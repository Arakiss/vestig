import { internalConsole } from '../internal-console'
import type {
	BatchTransportConfig,
	BatchTransportRetryEvent,
	BatchTransportStats,
	LogEntry,
	Transport,
	TransportConfig,
} from '../types'
import { CircularBuffer } from '../utils/buffer'

/**
 * Default batch transport configuration
 */
const DEFAULTS = {
	batchSize: 100,
	flushInterval: 5000,
	maxRetries: 3,
	retryDelay: 1000,
	throwOnError: true,
} as const

function normalizeMaxBufferSize(batchSize: number, maxBufferSize: number | undefined): number {
	if (maxBufferSize === undefined) return batchSize * 2
	if (!Number.isFinite(maxBufferSize) || maxBufferSize < 1) {
		throw new Error('BatchTransport maxBufferSize must be a positive finite number')
	}
	return Math.max(batchSize, Math.floor(maxBufferSize))
}

function normalizeBatchSize(batchSize: number | undefined): number {
	const value = batchSize ?? DEFAULTS.batchSize
	if (!Number.isFinite(value) || value < 1) {
		throw new Error('BatchTransport batchSize must be a positive finite number')
	}
	return Math.floor(value)
}

/**
 * Abstract base class for batch transports
 *
 * Provides automatic batching with circular buffer, periodic flushing,
 * and retry logic with exponential backoff.
 */
export abstract class BatchTransport implements Transport {
	abstract readonly name: string
	readonly config: TransportConfig

	protected readonly buffer: CircularBuffer<LogEntry>
	protected readonly batchSize: number
	protected readonly maxBufferSize: number
	protected readonly flushInterval: number
	protected readonly maxRetries: number
	protected readonly retryDelay: number
	protected readonly throwOnError: boolean

	private flushTimer: ReturnType<typeof setInterval> | null = null
	private isFlushing = false
	private isDestroyed = false
	private failedBatch: LogEntry[] | null = null
	private flushPromise: Promise<void> | null = null
	private readonly onRetryCallback?: (event: BatchTransportRetryEvent) => void
	private readonly onErrorCallback?: (error: Error, entries: readonly LogEntry[]) => void
	private readonly onDropCallback?: (entries: readonly LogEntry[]) => void

	constructor(config: BatchTransportConfig) {
		this.config = {
			name: config.name,
			enabled: config.enabled ?? true,
			level: config.level,
			filter: config.filter,
		}

		this.batchSize = normalizeBatchSize(config.batchSize)
		this.maxBufferSize = normalizeMaxBufferSize(this.batchSize, config.maxBufferSize)
		this.flushInterval = config.flushInterval ?? DEFAULTS.flushInterval
		this.maxRetries = config.maxRetries ?? DEFAULTS.maxRetries
		this.retryDelay = config.retryDelay ?? DEFAULTS.retryDelay
		this.throwOnError = config.throwOnError ?? DEFAULTS.throwOnError
		this.onRetryCallback = config.onRetry
		this.onErrorCallback = config.onError
		this.onDropCallback = config.onDrop

		this.buffer = new CircularBuffer<LogEntry>({
			maxSize: this.maxBufferSize,
			onDrop: (items) => this.handleDrop(items as LogEntry[]),
		})
	}

	/**
	 * Initialize the transport and start the flush timer
	 */
	async init(): Promise<void> {
		if (this.flushTimer) return

		this.flushTimer = setInterval(() => {
			this.flush().catch((err) => {
				internalConsole.error(`[${this.name}] Flush error:`, err)
			})
		}, this.flushInterval)

		// Ensure timer doesn't prevent process exit
		if (typeof this.flushTimer.unref === 'function') {
			this.flushTimer.unref()
		}
	}

	/**
	 * Add a log entry to the buffer
	 */
	log(entry: LogEntry): void {
		if (this.isDestroyed) return

		this.buffer.push(entry)

		// Auto-flush when batch size reached
		if (this.buffer.size >= this.batchSize && !this.isFlushing) {
			this.flush().catch((err) => {
				internalConsole.error(`[${this.name}] Auto-flush error:`, err)
			})
		}
	}

	/**
	 * Flush all buffered entries
	 */
	async flush(): Promise<void> {
		while (true) {
			if (this.flushPromise) {
				await this.flushPromise
			} else {
				if (this.buffer.size === 0 && !this.failedBatch) return

				const promise = this.flushOnce()
				this.flushPromise = promise

				try {
					await promise
				} finally {
					if (this.flushPromise === promise) {
						this.flushPromise = null
					}
				}
			}

			// If new entries arrived while the previous batch was in flight, drain them too.
			// Do not immediately retry a failed batch here; the failure has already been reported.
			if (this.buffer.size === 0 || this.failedBatch) return
		}
	}

	private async flushOnce(): Promise<void> {
		this.isFlushing = true

		try {
			const entries = this.takePendingEntries()
			await this.sendWithRetry(entries)
		} finally {
			this.isFlushing = false
		}
	}

	private takePendingEntries(): LogEntry[] {
		const failedEntries = this.failedBatch
		this.failedBatch = null

		const newEntries = this.buffer.toArray()
		this.buffer.clear()

		return failedEntries ? [...failedEntries, ...newEntries] : newEntries
	}

	/**
	 * Cleanup and stop the flush timer
	 */
	async destroy(): Promise<void> {
		this.isDestroyed = true

		if (this.flushTimer) {
			clearInterval(this.flushTimer)
			this.flushTimer = null
		}

		// Final flush, including a retained failed batch from an earlier attempt.
		if (this.buffer.size > 0 || this.failedBatch) {
			await this.flush()
		}
	}

	/**
	 * Send entries with retry logic and exponential backoff
	 */
	protected async sendWithRetry(entries: LogEntry[]): Promise<void> {
		let lastError: Error = new Error('Unknown error')
		const attempts = Math.max(1, this.maxRetries)

		for (let attempt = 0; attempt < attempts; attempt++) {
			try {
				await this.send(entries)
				return
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err))

				if (!this.isRetryableError(lastError)) {
					break
				}

				if (attempt < attempts - 1) {
					// Exponential backoff: 1s, 2s, 4s, etc.
					const delay = this.retryDelay * 2 ** attempt
					this.handleRetry({
						transport: this.name,
						entries,
						attempt: attempt + 1,
						maxAttempts: attempts,
						nextRetryDelay: delay,
						error: lastError,
					})
					await this.sleep(delay)
				}
			}
		}

		// All retries failed - store for retry on next flush
		// This ensures entries aren't lost due to transient failures
		// Note: Only ONE failed batch is retained to prevent unbounded growth
		this.failedBatch = entries

		const error = new BatchTransportError(
			`[${this.name}] Failed to send ${entries.length} entries after ${attempts} attempt${attempts === 1 ? '' : 's'}`,
			{
				transport: this.name,
				batchSize: entries.length,
				attempts,
				cause: lastError,
			},
		)

		// Call error handler for logging/monitoring
		this.handleSendError(error, entries)

		if (this.throwOnError) {
			throw error
		}
	}

	/**
	 * Abstract method to send entries to the destination
	 * Subclasses must implement this
	 */
	protected abstract send(entries: LogEntry[]): Promise<void>

	/**
	 * Called when entries are dropped from the buffer
	 * Subclasses can override to handle dropped entries
	 */
	protected onDrop(entries: LogEntry[]): void {
		internalConsole.warn(
			`[${this.name}] Dropped ${entries.length} log entries due to buffer overflow`,
		)
	}

	/**
	 * Called before a retry delay after a retryable send failure.
	 * Subclasses can override to collect metrics without parsing console output.
	 */
	protected onRetry(_event: BatchTransportRetryEvent): void {
		// No-op by default to avoid noisy retry logs.
	}

	/**
	 * Called when send fails after all retries
	 * Subclasses can override to handle send failures
	 */
	protected onSendError(error: Error, entries: LogEntry[]): void {
		internalConsole.error(
			`[${this.name}] Failed to send ${entries.length} entries after ${Math.max(1, this.maxRetries)} attempts:`,
			error.cause instanceof Error ? error.cause.message : error.message,
		)
	}

	private handleDrop(entries: LogEntry[]): void {
		this.invokeCallback('onDrop callback', () => this.onDropCallback?.(entries))
		this.invokeCallback('onDrop hook', () => this.onDrop(entries))
	}

	private handleRetry(event: BatchTransportRetryEvent): void {
		this.invokeCallback('onRetry callback', () => this.onRetryCallback?.(event))
		this.invokeCallback('onRetry hook', () => this.onRetry(event))
	}

	private handleSendError(error: BatchTransportError, entries: LogEntry[]): void {
		this.invokeCallback('onError callback', () => this.onErrorCallback?.(error, entries))
		this.invokeCallback('onSendError hook', () => this.onSendError(error, entries))
	}

	private isRetryableError(error: Error): boolean {
		const candidate = error as Error & { isRetryable?: unknown }
		return typeof candidate.isRetryable === 'boolean' ? candidate.isRetryable : true
	}

	private invokeCallback(name: string, callback: () => void): void {
		try {
			callback()
		} catch (err) {
			internalConsole.error(
				`[${this.name}] Ignored error thrown by ${name}:`,
				err instanceof Error ? err : new Error(String(err)),
			)
		}
	}

	/**
	 * Utility to sleep for a given duration
	 */
	protected sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * Get buffer statistics
	 */
	getStats(): BatchTransportStats {
		const stats = this.buffer.getStats()
		return {
			buffered: stats.size,
			dropped: stats.dropped,
			isFlushing: this.isFlushing || this.flushPromise !== null,
			pendingRetry: this.failedBatch?.length ?? 0,
			maxBufferSize: stats.maxSize,
			utilization: stats.utilization,
		}
	}
}

/**
 * Error emitted by BatchTransport when a batch cannot be delivered after retries.
 *
 * The failed entries remain retained for the next flush attempt unless the process exits.
 */
export class BatchTransportError extends Error {
	readonly transport: string
	readonly batchSize: number
	readonly attempts: number
	override readonly cause?: Error

	constructor(
		message: string,
		options: {
			transport: string
			batchSize: number
			attempts: number
			cause?: Error
		},
	) {
		super(message, options.cause ? { cause: options.cause } : undefined)
		this.name = 'BatchTransportError'
		this.transport = options.transport
		this.batchSize = options.batchSize
		this.attempts = options.attempts
		this.cause = options.cause
	}
}
