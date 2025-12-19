import type { DatadogTransportConfig, LogEntry } from '../types'
import { BatchTransport } from './batch'

/**
 * Datadog intake URLs by site
 */
const DATADOG_URLS: Record<string, string> = {
	'datadoghq.com': 'https://http-intake.logs.datadoghq.com/api/v2/logs',
	'datadoghq.eu': 'https://http-intake.logs.datadoghq.eu/api/v2/logs',
	'us3.datadoghq.com': 'https://http-intake.logs.us3.datadoghq.com/api/v2/logs',
	'us5.datadoghq.com': 'https://http-intake.logs.us5.datadoghq.com/api/v2/logs',
}

/**
 * Datadog log level mapping
 */
const DD_LEVELS: Record<string, string> = {
	trace: 'debug',
	debug: 'debug',
	info: 'info',
	warn: 'warning',
	error: 'error',
}

/**
 * Datadog transport for sending logs to Datadog Log Management
 *
 * Automatically formats logs to Datadog's expected format and handles
 * authentication via DD-API-KEY header.
 *
 * @example
 * ```typescript
 * const transport = new DatadogTransport({
 *   name: 'datadog',
 *   apiKey: process.env.DD_API_KEY,
 *   service: 'my-service',
 *   site: 'datadoghq.com',
 *   tags: ['env:production', 'team:backend'],
 * })
 * ```
 */
export class DatadogTransport extends BatchTransport {
	readonly name: string

	private readonly apiKey: string
	private readonly url: string
	private readonly service?: string
	private readonly source?: string
	private readonly tags?: string[]

	constructor(config: DatadogTransportConfig) {
		super({
			...config,
			name: config.name ?? 'datadog',
			// Datadog recommends smaller batches
			batchSize: config.batchSize ?? 50,
			flushInterval: config.flushInterval ?? 3000,
		})

		this.name = config.name ?? 'datadog'
		this.apiKey = config.apiKey
		const site = config.site ?? 'datadoghq.com'
		const defaultUrl = 'https://http-intake.logs.datadoghq.com/api/v2/logs'
		this.url = DATADOG_URLS[site] ?? defaultUrl
		this.service = config.service
		this.source = config.source ?? 'vestig'
		this.tags = config.tags
	}

	/**
	 * Send entries to Datadog
	 */
	protected async send(entries: LogEntry[]): Promise<void> {
		const ddLogs = entries.map((entry) => this.transformEntry(entry))

		const response = await fetch(this.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'DD-API-KEY': this.apiKey,
			},
			body: JSON.stringify(ddLogs),
		})

		if (!response.ok) {
			throw new DatadogTransportError(
				`Datadog API error: ${response.status} ${response.statusText}`,
				response.status,
				await this.safeReadBody(response),
			)
		}
	}

	/**
	 * Transform a log entry to Datadog format
	 */
	private transformEntry(entry: LogEntry): DatadogLogEntry {
		const ddEntry: DatadogLogEntry = {
			ddsource: this.source ?? 'vestig',
			ddtags: this.buildTags(entry),
			hostname: this.getHostname(entry),
			message: entry.message,
			service: this.service ?? entry.namespace ?? 'unknown',
			status: DD_LEVELS[entry.level] ?? 'info',
			timestamp: entry.timestamp,
		}

		// Add structured attributes
		if (entry.metadata) {
			ddEntry.attributes = entry.metadata
		}

		// Add context as attributes
		if (entry.context) {
			ddEntry.attributes = { ...ddEntry.attributes, ...entry.context }
		}

		// Add error information
		if (entry.error) {
			ddEntry.error = {
				kind: entry.error.name,
				message: entry.error.message,
				stack: entry.error.stack,
			}
		}

		return ddEntry
	}

	/**
	 * Build Datadog tags from entry
	 */
	private buildTags(entry: LogEntry): string {
		const tags: string[] = []

		// Add configured tags
		if (this.tags) {
			tags.push(...this.tags)
		}

		// Add runtime tag
		tags.push(`runtime:${entry.runtime}`)

		// Add namespace if present
		if (entry.namespace) {
			tags.push(`namespace:${entry.namespace}`)
		}

		// Add trace IDs if present
		if (entry.context?.traceId) {
			tags.push(`trace_id:${entry.context.traceId}`)
		}
		if (entry.context?.spanId) {
			tags.push(`span_id:${entry.context.spanId}`)
		}

		return tags.join(',')
	}

	/**
	 * Get hostname from entry context or environment
	 */
	private getHostname(entry: LogEntry): string {
		// Try to get from context
		if (entry.context?.hostname) {
			return String(entry.context.hostname)
		}

		// Try environment variable
		if (typeof process !== 'undefined' && process.env?.HOSTNAME) {
			return process.env.HOSTNAME
		}

		return 'unknown'
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
 * Custom error for Datadog transport failures
 */
export class DatadogTransportError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly responseBody?: string,
	) {
		super(message)
		this.name = 'DatadogTransportError'
	}
}

/**
 * Datadog log entry format
 */
interface DatadogLogEntry {
	ddsource: string
	ddtags: string
	hostname: string
	message: string
	service: string
	status: string
	timestamp: string
	attributes?: Record<string, unknown>
	error?: {
		kind: string
		message: string
		stack?: string
	}
}
