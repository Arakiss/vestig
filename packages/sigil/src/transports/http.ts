import type { HTTPTransportConfig, LogEntry } from '../types'
import { BatchTransport } from './batch'

/**
 * Default HTTP transport configuration
 */
const DEFAULTS = {
	method: 'POST' as const,
	timeout: 30000,
	headers: {
		'Content-Type': 'application/json',
	},
} as const

/**
 * HTTP transport for sending logs to external services
 *
 * Supports any runtime with native fetch (Node 18+, Bun, Deno, Edge, Browser).
 * Features batching, retry logic, custom headers, and payload transformation.
 *
 * @example
 * ```typescript
 * const transport = new HTTPTransport({
 *   name: 'my-http',
 *   url: 'https://logs.example.com/ingest',
 *   headers: {
 *     'Authorization': 'Bearer my-token',
 *   },
 *   transform: (entries) => ({
 *     logs: entries,
 *     timestamp: Date.now(),
 *   }),
 * })
 * ```
 */
export class HTTPTransport extends BatchTransport {
	readonly name: string

	private readonly url: string
	private readonly method: 'POST' | 'PUT'
	private readonly headers: Record<string, string>
	private readonly timeout: number
	private readonly transform?: (entries: LogEntry[]) => unknown

	constructor(config: HTTPTransportConfig) {
		super({
			...config,
			name: config.name ?? 'http',
		})

		this.name = config.name ?? 'http'
		this.url = config.url
		this.method = config.method ?? DEFAULTS.method
		this.headers = { ...DEFAULTS.headers, ...config.headers }
		this.timeout = config.timeout ?? DEFAULTS.timeout
		this.transform = config.transform
	}

	/**
	 * Send entries to the configured URL
	 */
	protected async send(entries: LogEntry[]): Promise<void> {
		const payload = this.transform ? this.transform(entries) : entries
		const body = JSON.stringify(payload)

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.timeout)

		try {
			const response = await fetch(this.url, {
				method: this.method,
				headers: this.headers,
				body,
				signal: controller.signal,
			})

			if (!response.ok) {
				throw new HTTPTransportError(
					`HTTP ${response.status}: ${response.statusText}`,
					response.status,
					await this.safeReadBody(response),
				)
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				throw new HTTPTransportError(`Request timeout after ${this.timeout}ms`, 408)
			}
			throw err
		} finally {
			clearTimeout(timeoutId)
		}
	}

	/**
	 * Safely read response body for error messages
	 */
	private async safeReadBody(response: Response): Promise<string | undefined> {
		try {
			return await response.text()
		} catch {
			return undefined
		}
	}
}

/**
 * Custom error for HTTP transport failures
 */
export class HTTPTransportError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly responseBody?: string,
	) {
		super(message)
		this.name = 'HTTPTransportError'
	}
}
