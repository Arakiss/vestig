import type { LogEntry, LogLevel, SentryTransportConfig } from '../types'
import { BatchTransport } from './batch'

/**
 * Sentry severity level mapping from vestig log levels
 */
const SENTRY_LEVELS: Record<LogLevel, string> = {
	trace: 'debug',
	debug: 'debug',
	info: 'info',
	warn: 'warning',
	error: 'error',
}

/**
 * Sentry log level priority for filtering
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
}

/**
 * Parsed DSN components
 */
interface ParsedDSN {
	publicKey: string
	host: string
	projectId: string
}

/**
 * Sentry transport for sending logs to Sentry
 *
 * Maps vestig log entries to Sentry events and sends them via
 * Sentry's Store API. Supports environments, releases, tags,
 * and automatic error extraction.
 *
 * @example
 * ```typescript
 * const transport = new SentryTransport({
 *   name: 'sentry',
 *   dsn: process.env.SENTRY_DSN,
 *   environment: 'production',
 *   release: 'my-app@1.2.3',
 *   tags: { team: 'backend' },
 * })
 *
 * logger.addTransport(transport)
 * logger.error('Database connection failed', { host: 'db-1' })
 * ```
 */
export class SentryTransport extends BatchTransport {
	readonly name: string

	private readonly parsedDSN: ParsedDSN
	private readonly environment?: string
	private readonly release?: string
	private readonly service?: string
	private readonly serverName?: string
	private readonly tags?: Record<string, string>
	private readonly minLevel: LogLevel

	constructor(config: SentryTransportConfig) {
		super({
			...config,
			name: config.name ?? 'sentry',
			// Sentry recommends smaller batches for real-time alerting
			batchSize: config.batchSize ?? 10,
			flushInterval: config.flushInterval ?? 2000,
		})

		this.name = config.name ?? 'sentry'
		this.parsedDSN = this.parseDSN(config.dsn)
		this.environment = config.environment
		this.release = config.release
		this.service = config.service
		this.serverName = config.serverName
		this.tags = config.tags
		this.minLevel = config.minLevel ?? 'warn'
	}

	/**
	 * Parse Sentry DSN into components
	 */
	private parseDSN(dsn: string): ParsedDSN {
		try {
			const url = new URL(dsn)
			const publicKey = url.username
			const host = url.host
			const projectId = url.pathname.slice(1) // Remove leading slash

			if (!publicKey || !projectId) {
				throw new Error('Invalid DSN format')
			}

			return { publicKey, host, projectId }
		} catch {
			throw new SentryTransportError(`Invalid Sentry DSN: ${dsn}`, 0)
		}
	}

	/**
	 * Build the Sentry store API URL
	 */
	private getStoreUrl(): string {
		const { host, projectId } = this.parsedDSN
		return `https://${host}/api/${projectId}/store/`
	}

	/**
	 * Check if a log entry should be sent based on minimum level
	 */
	private shouldSend(entry: LogEntry): boolean {
		return LEVEL_PRIORITY[entry.level] >= LEVEL_PRIORITY[this.minLevel]
	}

	/**
	 * Send entries to Sentry
	 */
	protected async send(entries: LogEntry[]): Promise<void> {
		// Filter entries by minimum level
		const filteredEntries = entries.filter((e) => this.shouldSend(e))

		if (filteredEntries.length === 0) {
			return
		}

		// Send each entry as a separate event (Sentry doesn't batch well)
		const promises = filteredEntries.map((entry) => this.sendEvent(entry))
		const results = await Promise.allSettled(promises)

		// Check for failures
		const failures = results.filter((r) => r.status === 'rejected')
		if (failures.length > 0) {
			const firstError = (failures[0] as PromiseRejectedResult).reason
			throw firstError
		}
	}

	/**
	 * Send a single event to Sentry
	 */
	private async sendEvent(entry: LogEntry): Promise<void> {
		const event = this.transformEntry(entry)
		const url = this.getStoreUrl()

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Sentry-Auth': this.buildAuthHeader(),
			},
			body: JSON.stringify(event),
		})

		if (!response.ok) {
			throw new SentryTransportError(
				`Sentry API error: ${response.status} ${response.statusText}`,
				response.status,
				await this.safeReadBody(response),
			)
		}
	}

	/**
	 * Build Sentry authentication header
	 */
	private buildAuthHeader(): string {
		const { publicKey } = this.parsedDSN
		const timestamp = Math.floor(Date.now() / 1000)

		return [
			'Sentry sentry_version=7',
			`sentry_timestamp=${timestamp}`,
			`sentry_key=${publicKey}`,
			'sentry_client=vestig/1.0.0',
		].join(', ')
	}

	/**
	 * Transform a log entry to Sentry event format
	 */
	private transformEntry(entry: LogEntry): SentryEvent {
		const event: SentryEvent = {
			event_id: this.generateEventId(),
			timestamp: entry.timestamp,
			platform: 'node',
			level: SENTRY_LEVELS[entry.level],
			logger: entry.namespace ?? 'vestig',
			message: {
				formatted: entry.message,
			},
		}

		// Add environment
		if (this.environment) {
			event.environment = this.environment
		}

		// Add release
		if (this.release) {
			event.release = this.release
		}

		// Add server name
		if (this.serverName) {
			event.server_name = this.serverName
		}

		// Build tags
		const tags: Record<string, string> = {
			runtime: entry.runtime,
			...(this.tags ?? {}),
		}

		if (this.service) {
			tags.service = this.service
		}

		if (entry.namespace) {
			tags.namespace = entry.namespace
		}

		event.tags = tags

		// Add extra context from metadata
		if (entry.metadata || entry.context) {
			event.extra = {
				...entry.metadata,
				...entry.context,
			}
		}

		// Add error information as exception
		if (entry.error) {
			event.exception = {
				values: [
					{
						type: entry.error.name,
						value: entry.error.message,
						stacktrace: entry.error.stack
							? { frames: this.parseStackTrace(entry.error.stack) }
							: undefined,
					},
				],
			}
		}

		// Add trace context if available
		if (entry.context?.traceId) {
			event.contexts = {
				trace: {
					trace_id: String(entry.context.traceId),
					span_id: entry.context.spanId ? String(entry.context.spanId) : undefined,
				},
			}
		}

		return event
	}

	/**
	 * Generate a random event ID (32 hex chars)
	 */
	private generateEventId(): string {
		const bytes = new Uint8Array(16)
		if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
			crypto.getRandomValues(bytes)
		} else {
			// Fallback for environments without crypto
			for (let i = 0; i < bytes.length; i++) {
				bytes[i] = Math.floor(Math.random() * 256)
			}
		}
		return Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')
	}

	/**
	 * Parse stack trace into Sentry frame format
	 */
	private parseStackTrace(stack: string): SentryStackFrame[] {
		const lines = stack.split('\n').slice(1) // Skip first line (error message)
		const frames: SentryStackFrame[] = []

		for (const line of lines) {
			const match = line.match(/^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/)
			if (match?.[2] && match[3] && match[4]) {
				frames.push({
					function: match[1] || '<anonymous>',
					filename: match[2],
					lineno: Number.parseInt(match[3], 10),
					colno: Number.parseInt(match[4], 10),
				})
			}
		}

		// Sentry expects frames in reverse order (most recent last)
		return frames.reverse()
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
 * Custom error for Sentry transport failures
 */
export class SentryTransportError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly responseBody?: string,
	) {
		super(message)
		this.name = 'SentryTransportError'
	}
}

/**
 * Sentry event format
 */
interface SentryEvent {
	event_id: string
	timestamp: string
	platform: string
	level: string
	logger: string
	message: {
		formatted: string
	}
	environment?: string
	release?: string
	server_name?: string
	tags?: Record<string, string>
	extra?: Record<string, unknown>
	exception?: {
		values: Array<{
			type: string
			value: string
			stacktrace?: {
				frames: SentryStackFrame[]
			}
		}>
	}
	contexts?: {
		trace?: {
			trace_id: string
			span_id?: string
		}
	}
}

/**
 * Sentry stack frame format
 */
interface SentryStackFrame {
	function: string
	filename: string
	lineno: number
	colno: number
}
