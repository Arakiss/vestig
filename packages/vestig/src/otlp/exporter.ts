/**
 * OTLP Exporter for vestig
 *
 * Exports spans to OTLP-compatible backends (Jaeger, Honeycomb, Grafana, Vercel, etc.)
 * using the OTLP/JSON protocol.
 */

import type { Span } from '../tracing/types'
import { VERSION } from '../version'
import type { SpanProcessor } from './processor'
import {
	type OTLPExportTraceServiceRequest,
	type OTLPKeyValue,
	type OTLPSpan,
	toOTLPAttributes,
	toOTLPSpan,
} from './types'

/**
 * Configuration for OTLPExporter
 */
export interface OTLPExporterConfig {
	/**
	 * OTLP endpoint URL for traces
	 * @example 'https://otel.example.com/v1/traces'
	 * @example 'https://api.honeycomb.io/v1/traces'
	 */
	endpoint: string

	/**
	 * Service name (required) - identifies your application
	 * Maps to OTLP resource attribute 'service.name'
	 */
	serviceName: string

	/**
	 * Service version (optional)
	 * Maps to OTLP resource attribute 'service.version'
	 */
	serviceVersion?: string

	/**
	 * Deployment environment (optional)
	 * Maps to OTLP resource attribute 'deployment.environment'
	 * @example 'production', 'staging', 'development'
	 */
	environment?: string

	/**
	 * Custom HTTP headers for authentication
	 * @example { 'Authorization': 'Bearer token' }
	 * @example { 'x-honeycomb-team': 'api-key' }
	 */
	headers?: Record<string, string>

	/**
	 * Additional resource attributes
	 * @example { 'host.name': 'server-1', 'cloud.region': 'us-east-1' }
	 */
	resourceAttributes?: Record<string, unknown>

	/**
	 * Maximum number of spans to batch before sending
	 * @default 100
	 */
	batchSize?: number

	/**
	 * Interval in ms between automatic flushes
	 * @default 5000
	 */
	flushInterval?: number

	/**
	 * Request timeout in ms
	 * @default 30000
	 */
	timeout?: number

	/**
	 * Maximum retry attempts on failure
	 * @default 3
	 */
	maxRetries?: number

	/**
	 * Delay between retries in ms (doubles each attempt)
	 * @default 1000
	 */
	retryDelay?: number

	/**
	 * Enable/disable the exporter
	 * @default true
	 */
	enabled?: boolean
}

/**
 * Default configuration values
 */
const DEFAULTS = {
	batchSize: 100,
	flushInterval: 5000,
	timeout: 30000,
	maxRetries: 3,
	retryDelay: 1000,
	enabled: true,
} as const

/**
 * OTLP Exporter for sending spans to OTLP-compatible backends
 *
 * Implements the SpanProcessor interface to receive spans from vestig
 * and batches them for efficient export.
 *
 * @example
 * ```typescript
 * import { registerSpanProcessor } from 'vestig'
 * import { OTLPExporter } from 'vestig/otlp'
 *
 * const exporter = new OTLPExporter({
 *   endpoint: 'https://otel.vercel.com/v1/traces',
 *   serviceName: 'my-app',
 *   serviceVersion: '1.0.0',
 *   environment: 'production',
 *   headers: {
 *     'Authorization': `Bearer ${process.env.OTEL_TOKEN}`,
 *   },
 * })
 *
 * registerSpanProcessor(exporter)
 *
 * // Your spans will now be exported to the OTLP endpoint
 * await span('db:query', async (s) => {
 *   s.setAttribute('db.table', 'users')
 *   return await db.select().from(users)
 * })
 * ```
 */
export class OTLPExporter implements SpanProcessor {
	private readonly config: Required<
		Pick<
			OTLPExporterConfig,
			'batchSize' | 'flushInterval' | 'timeout' | 'maxRetries' | 'retryDelay' | 'enabled'
		>
	> &
		OTLPExporterConfig

	private readonly resourceAttributes: OTLPKeyValue[]
	private buffer: OTLPSpan[] = []
	private flushTimer: ReturnType<typeof setInterval> | null = null
	private isFlushing = false
	private isShutdown = false

	/**
	 * Epoch time when the exporter was created
	 * Used to convert performance.now() offsets to absolute timestamps
	 */
	private readonly epochStartMs: number

	constructor(config: OTLPExporterConfig) {
		this.config = {
			...config,
			batchSize: config.batchSize ?? DEFAULTS.batchSize,
			flushInterval: config.flushInterval ?? DEFAULTS.flushInterval,
			timeout: config.timeout ?? DEFAULTS.timeout,
			maxRetries: config.maxRetries ?? DEFAULTS.maxRetries,
			retryDelay: config.retryDelay ?? DEFAULTS.retryDelay,
			enabled: config.enabled ?? DEFAULTS.enabled,
		}

		// Calculate epoch offset for timestamp conversion
		// performance.now() gives time since page load/process start
		// We need to convert to Unix epoch milliseconds
		this.epochStartMs = Date.now() - performance.now()

		// Build resource attributes
		const resourceAttrs: Record<string, unknown> = {
			'service.name': config.serviceName,
			...(config.serviceVersion && { 'service.version': config.serviceVersion }),
			...(config.environment && { 'deployment.environment': config.environment }),
			'telemetry.sdk.name': 'vestig',
			'telemetry.sdk.version': VERSION,
			'telemetry.sdk.language': 'javascript',
			...config.resourceAttributes,
		}
		this.resourceAttributes = toOTLPAttributes(resourceAttrs)

		// Start flush timer
		this.startFlushTimer()
	}

	/**
	 * Start the periodic flush timer
	 */
	private startFlushTimer(): void {
		if (this.flushTimer) return

		this.flushTimer = setInterval(() => {
			this.forceFlush().catch((err) => {
				console.error('[vestig/otlp] Flush error:', err)
			})
		}, this.config.flushInterval)

		// Don't block process exit
		if (typeof this.flushTimer.unref === 'function') {
			this.flushTimer.unref()
		}
	}

	/**
	 * Stop the flush timer
	 */
	private stopFlushTimer(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer)
			this.flushTimer = null
		}
	}

	/**
	 * Called when a span starts (optional for batching exporters)
	 */
	onStart(_span: Span): void {
		// We don't need to do anything on start for a batching exporter
		// The span will be captured in onEnd when it's complete
	}

	/**
	 * Called when a span ends - adds the span to the buffer
	 */
	onEnd(span: Span): void {
		if (!this.config.enabled || this.isShutdown) return

		// Convert to OTLP format and buffer
		const otlpSpan = toOTLPSpan(span, this.epochStartMs)
		this.buffer.push(otlpSpan)

		// Auto-flush when batch size reached
		if (this.buffer.length >= this.config.batchSize && !this.isFlushing) {
			this.forceFlush().catch((err) => {
				console.error('[vestig/otlp] Auto-flush error:', err)
			})
		}
	}

	/**
	 * Force flush all buffered spans
	 */
	async forceFlush(): Promise<void> {
		if (this.isFlushing || this.buffer.length === 0) return

		this.isFlushing = true

		try {
			const spans = this.buffer
			this.buffer = []

			await this.sendWithRetry(spans)
		} finally {
			this.isFlushing = false
		}
	}

	/**
	 * Shutdown the exporter
	 */
	async shutdown(): Promise<void> {
		if (this.isShutdown) return

		this.isShutdown = true
		this.stopFlushTimer()

		// Final flush
		if (this.buffer.length > 0) {
			await this.forceFlush()
		}
	}

	/**
	 * Send spans with retry logic
	 */
	private async sendWithRetry(spans: OTLPSpan[]): Promise<void> {
		let lastError: Error = new Error('Unknown error')

		for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
			try {
				await this.send(spans)
				return
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err))

				// Don't retry on client errors (4xx) - log and exit
				if (err instanceof OTLPExportError && err.isClientError) {
					console.error(
						`[vestig/otlp] Client error exporting ${spans.length} spans (not retrying):`,
						lastError.message,
					)
					return
				}

				if (attempt < this.config.maxRetries - 1) {
					// Exponential backoff
					const delay = this.config.retryDelay * 2 ** attempt
					await this.sleep(delay)
				}
			}
		}

		// All retries failed
		console.error(
			`[vestig/otlp] Failed to export ${spans.length} spans after ${this.config.maxRetries} retries:`,
			lastError.message,
		)
	}

	/**
	 * Send spans to the OTLP endpoint
	 */
	private async send(spans: OTLPSpan[]): Promise<void> {
		const payload: OTLPExportTraceServiceRequest = {
			resourceSpans: [
				{
					resource: {
						attributes: this.resourceAttributes,
					},
					scopeSpans: [
						{
							scope: {
								name: 'vestig',
								version: VERSION,
							},
							spans,
						},
					],
				},
			],
		}

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

		try {
			const response = await fetch(this.config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...this.config.headers,
				},
				body: JSON.stringify(payload),
				signal: controller.signal,
				keepalive: true,
			})

			if (!response.ok) {
				const body = await this.safeReadBody(response)
				throw new OTLPExportError(
					`OTLP export failed: HTTP ${response.status} ${response.statusText}`,
					response.status,
					body,
				)
			}
		} catch (err) {
			if (err instanceof OTLPExportError) {
				throw err
			}
			if (err instanceof Error) {
				if (err.name === 'AbortError') {
					throw new OTLPExportError(`OTLP export timeout after ${this.config.timeout}ms`, 408)
				}
				throw new OTLPExportError(err.message, 0, undefined, err)
			}
			throw new OTLPExportError(String(err), 0)
		} finally {
			clearTimeout(timeoutId)
		}
	}

	/**
	 * Safely read response body
	 */
	private async safeReadBody(response: Response): Promise<string | undefined> {
		try {
			return await response.text()
		} catch {
			return undefined
		}
	}

	/**
	 * Sleep utility
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * Get export statistics
	 */
	getStats(): {
		buffered: number
		isFlushing: boolean
		isShutdown: boolean
	} {
		return {
			buffered: this.buffer.length,
			isFlushing: this.isFlushing,
			isShutdown: this.isShutdown,
		}
	}
}

/**
 * Error class for OTLP export failures
 */
export class OTLPExportError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly responseBody?: string,
		override readonly cause?: Error,
	) {
		super(message, cause ? { cause } : undefined)
		this.name = 'OTLPExportError'
	}

	get isNetworkError(): boolean {
		return this.statusCode === 0
	}

	get isTimeout(): boolean {
		return this.statusCode === 408
	}

	get isClientError(): boolean {
		return this.statusCode >= 400 && this.statusCode < 500
	}

	get isServerError(): boolean {
		return this.statusCode >= 500 && this.statusCode < 600
	}

	get isRetryable(): boolean {
		return this.isNetworkError || this.isTimeout || this.isServerError
	}
}
