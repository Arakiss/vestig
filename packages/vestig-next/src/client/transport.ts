'use client'

import type { LogEntry, Transport, TransportConfig } from 'vestig'

/**
 * Configuration for ClientHTTPTransport
 */
export interface ClientHTTPTransportConfig extends TransportConfig {
	/** Server endpoint URL (default: '/api/vestig') */
	url: string
	/** Batch size before auto-flush (default: 20) */
	batchSize?: number
	/** Flush interval in ms (default: 3000) */
	flushInterval?: number
	/** Max retry attempts (default: 3) */
	maxRetries?: number
	/** Retry delay in ms (default: 1000) */
	retryDelay?: number
	/** Callback on successful flush */
	onFlushSuccess?: () => void
	/** Callback on flush error */
	onFlushError?: (error: Error) => void
	/** Callback when logs are dropped */
	onDrop?: (count: number) => void
}

/**
 * HTTP transport for client-side log batching
 *
 * Features:
 * - Automatic batching with configurable size and interval
 * - Retry with exponential backoff
 * - Uses keepalive for beforeunload reliability
 * - Automatic page metadata enrichment
 */
export class ClientHTTPTransport implements Transport {
	readonly name: string
	readonly config: TransportConfig

	private url: string
	private batchSize: number
	private flushInterval: number
	private maxRetries: number
	private retryDelay: number
	private onFlushSuccess?: () => void
	private onFlushError?: (error: Error) => void
	private onDrop?: (count: number) => void

	private buffer: LogEntry[] = []
	private flushTimer: ReturnType<typeof setInterval> | null = null
	private isFlushing = false
	private isDestroyed = false
	private maxBufferSize = 500

	constructor(config: ClientHTTPTransportConfig) {
		this.name = config.name
		this.config = { name: config.name, enabled: config.enabled ?? true }
		this.url = config.url
		this.batchSize = config.batchSize ?? 20
		this.flushInterval = config.flushInterval ?? 3000
		this.maxRetries = config.maxRetries ?? 3
		this.retryDelay = config.retryDelay ?? 1000
		this.onFlushSuccess = config.onFlushSuccess
		this.onFlushError = config.onFlushError
		this.onDrop = config.onDrop
	}

	async init(): Promise<void> {
		// Start flush timer
		this.flushTimer = setInterval(() => {
			this.flush()
		}, this.flushInterval)
	}

	log(entry: LogEntry): void {
		if (this.isDestroyed) return

		// Enrich with client metadata
		const enrichedEntry: LogEntry = {
			...entry,
			metadata: {
				...entry.metadata,
				_client: {
					url: typeof window !== 'undefined' ? window.location.href : undefined,
					pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
					userAgent:
						typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : undefined,
				},
			},
		}

		// Check buffer size
		if (this.buffer.length >= this.maxBufferSize) {
			// Drop oldest entries
			const dropCount = Math.floor(this.maxBufferSize / 4)
			this.buffer.splice(0, dropCount)
			this.onDrop?.(dropCount)
		}

		this.buffer.push(enrichedEntry)

		// Auto-flush if batch size reached
		if (this.buffer.length >= this.batchSize) {
			this.flush()
		}
	}

	async flush(): Promise<void> {
		if (this.isFlushing || this.buffer.length === 0 || this.isDestroyed) {
			return
		}

		this.isFlushing = true
		const entries = [...this.buffer]
		this.buffer = []

		try {
			await this.sendWithRetry(entries)
			this.onFlushSuccess?.()
		} catch (error) {
			// Re-add failed entries to buffer (at the front)
			this.buffer.unshift(...entries)

			// Trim if buffer is too large
			if (this.buffer.length > this.maxBufferSize) {
				const excess = this.buffer.length - this.maxBufferSize
				this.buffer.splice(this.maxBufferSize)
				this.onDrop?.(excess)
			}

			this.onFlushError?.(error instanceof Error ? error : new Error(String(error)))
		} finally {
			this.isFlushing = false
		}
	}

	private async sendWithRetry(entries: LogEntry[]): Promise<void> {
		let lastError: Error | null = null

		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			try {
				const response = await fetch(this.url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ entries }),
					keepalive: true, // Important for beforeunload
				})

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}

				return
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error))

				// Don't retry on last attempt
				if (attempt < this.maxRetries - 1) {
					// Exponential backoff
					await new Promise((r) => setTimeout(r, this.retryDelay * 2 ** attempt))
				}
			}
		}

		throw lastError
	}

	async destroy(): Promise<void> {
		this.isDestroyed = true

		if (this.flushTimer) {
			clearInterval(this.flushTimer)
			this.flushTimer = null
		}

		// Final flush attempt
		if (this.buffer.length > 0) {
			this.isFlushing = false // Reset to allow final flush
			await this.flush()
		}
	}
}

/**
 * Create a client HTTP transport with default configuration
 */
export function createClientTransport(
	options: Partial<ClientHTTPTransportConfig> = {},
): ClientHTTPTransport {
	return new ClientHTTPTransport({
		name: 'vestig-client',
		url: '/api/vestig',
		...options,
	})
}
