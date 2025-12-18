import type { BatchTransportConfig, LogEntry, Transport, TransportConfig } from '../types'
import { CircularBuffer } from '../utils/buffer'

/**
 * Default batch transport configuration
 */
const DEFAULTS = {
	batchSize: 100,
	flushInterval: 5000,
	maxRetries: 3,
	retryDelay: 1000,
} as const

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
	protected readonly flushInterval: number
	protected readonly maxRetries: number
	protected readonly retryDelay: number

	private flushTimer: ReturnType<typeof setInterval> | null = null
	private isFlushing = false
	private isDestroyed = false

	constructor(config: BatchTransportConfig) {
		this.config = {
			name: config.name,
			enabled: config.enabled ?? true,
			level: config.level,
			filter: config.filter,
		}

		this.batchSize = config.batchSize ?? DEFAULTS.batchSize
		this.flushInterval = config.flushInterval ?? DEFAULTS.flushInterval
		this.maxRetries = config.maxRetries ?? DEFAULTS.maxRetries
		this.retryDelay = config.retryDelay ?? DEFAULTS.retryDelay

		this.buffer = new CircularBuffer<LogEntry>({
			maxSize: this.batchSize * 2, // Allow some overflow before dropping
			onDrop: (items) => this.onDrop(items as LogEntry[]),
		})
	}

	/**
	 * Initialize the transport and start the flush timer
	 */
	async init(): Promise<void> {
		if (this.flushTimer) return

		this.flushTimer = setInterval(() => {
			this.flush().catch((err) => {
				console.error(`[${this.name}] Flush error:`, err)
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
				console.error(`[${this.name}] Auto-flush error:`, err)
			})
		}
	}

	/**
	 * Flush all buffered entries
	 */
	async flush(): Promise<void> {
		if (this.isFlushing || this.buffer.size === 0) return

		this.isFlushing = true

		try {
			const entries = this.buffer.toArray()
			this.buffer.clear()

			await this.sendWithRetry(entries)
		} finally {
			this.isFlushing = false
		}
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

		// Final flush
		if (this.buffer.size > 0) {
			await this.flush()
		}
	}

	/**
	 * Send entries with retry logic and exponential backoff
	 */
	protected async sendWithRetry(entries: LogEntry[]): Promise<void> {
		let lastError: Error = new Error('Unknown error')

		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			try {
				await this.send(entries)
				return
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err))

				if (attempt < this.maxRetries - 1) {
					// Exponential backoff: 1s, 2s, 4s, etc.
					const delay = this.retryDelay * 2 ** attempt
					await this.sleep(delay)
				}
			}
		}

		// All retries failed, call error handler
		this.onSendError(lastError, entries)
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
		console.warn(`[${this.name}] Dropped ${entries.length} log entries due to buffer overflow`)
	}

	/**
	 * Called when send fails after all retries
	 * Subclasses can override to handle send failures
	 */
	protected onSendError(error: Error, entries: LogEntry[]): void {
		console.error(
			`[${this.name}] Failed to send ${entries.length} entries after ${this.maxRetries} retries:`,
			error.message,
		)
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
	getStats(): {
		buffered: number
		dropped: number
		isFlushing: boolean
	} {
		const stats = this.buffer.getStats()
		return {
			buffered: stats.size,
			dropped: stats.dropped,
			isFlushing: this.isFlushing,
		}
	}
}
