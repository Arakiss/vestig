import type { LogLevel } from '../types'

/**
 * Metrics collected by the logger
 */
export interface LoggerMetrics {
	/** Total logs by level */
	logs: Record<LogLevel, number>
	/** Total dropped logs (buffer overflow) */
	dropped: number
	/** Total transport errors */
	transportErrors: number
	/** Total sampled out logs */
	sampledOut: number
	/** Total flushes */
	flushes: number
	/** Last flush duration in milliseconds */
	lastFlushDurationMs: number
}

/**
 * Metrics collector for logger instrumentation
 *
 * @example
 * ```typescript
 * const metrics = new MetricsCollector()
 *
 * // Increment counters
 * metrics.incLogs('info')
 * metrics.incDropped()
 *
 * // Export in Prometheus format
 * const output = metrics.toPrometheus()
 * // vestig_logs_total{level="info"} 42
 * // vestig_logs_dropped_total 3
 * ```
 */
export class MetricsCollector {
	private logs: Record<LogLevel, number> = {
		trace: 0,
		debug: 0,
		info: 0,
		warn: 0,
		error: 0,
	}
	private dropped = 0
	private transportErrors = 0
	private sampledOut = 0
	private flushes = 0
	private lastFlushDurationMs = 0
	private readonly prefix: string
	private readonly labels: Record<string, string>

	constructor(options: { prefix?: string; labels?: Record<string, string> } = {}) {
		this.prefix = options.prefix ?? 'vestig'
		this.labels = options.labels ?? {}
	}

	/**
	 * Increment log counter for a level
	 */
	incLogs(level: LogLevel, count = 1): void {
		this.logs[level] += count
	}

	/**
	 * Increment dropped logs counter
	 */
	incDropped(count = 1): void {
		this.dropped += count
	}

	/**
	 * Increment transport errors counter
	 */
	incTransportErrors(count = 1): void {
		this.transportErrors += count
	}

	/**
	 * Increment sampled out counter
	 */
	incSampledOut(count = 1): void {
		this.sampledOut += count
	}

	/**
	 * Record a flush with duration
	 */
	recordFlush(durationMs: number): void {
		this.flushes++
		this.lastFlushDurationMs = durationMs
	}

	/**
	 * Get current metrics
	 */
	getMetrics(): LoggerMetrics {
		return {
			logs: { ...this.logs },
			dropped: this.dropped,
			transportErrors: this.transportErrors,
			sampledOut: this.sampledOut,
			flushes: this.flushes,
			lastFlushDurationMs: this.lastFlushDurationMs,
		}
	}

	/**
	 * Reset all metrics to zero
	 */
	reset(): void {
		this.logs = { trace: 0, debug: 0, info: 0, warn: 0, error: 0 }
		this.dropped = 0
		this.transportErrors = 0
		this.sampledOut = 0
		this.flushes = 0
		this.lastFlushDurationMs = 0
	}

	/**
	 * Format common labels as Prometheus label string
	 */
	private formatLabels(extra: Record<string, string> = {}): string {
		const allLabels = { ...this.labels, ...extra }
		const entries = Object.entries(allLabels)
		if (entries.length === 0) return ''
		return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`
	}

	/**
	 * Export metrics in Prometheus exposition format
	 *
	 * @example
	 * ```typescript
	 * const output = metrics.toPrometheus()
	 * // # HELP vestig_logs_total Total number of log entries by level
	 * // # TYPE vestig_logs_total counter
	 * // vestig_logs_total{level="info"} 42
	 * ```
	 */
	toPrometheus(): string {
		const lines: string[] = []
		const p = this.prefix

		// Logs by level
		lines.push(`# HELP ${p}_logs_total Total number of log entries by level`)
		lines.push(`# TYPE ${p}_logs_total counter`)
		for (const [level, count] of Object.entries(this.logs)) {
			const labels = this.formatLabels({ level })
			lines.push(`${p}_logs_total${labels} ${count}`)
		}

		// Dropped logs
		lines.push(`# HELP ${p}_logs_dropped_total Total number of dropped log entries`)
		lines.push(`# TYPE ${p}_logs_dropped_total counter`)
		lines.push(`${p}_logs_dropped_total${this.formatLabels()} ${this.dropped}`)

		// Transport errors
		lines.push(`# HELP ${p}_transport_errors_total Total number of transport errors`)
		lines.push(`# TYPE ${p}_transport_errors_total counter`)
		lines.push(`${p}_transport_errors_total${this.formatLabels()} ${this.transportErrors}`)

		// Sampled out logs
		lines.push(`# HELP ${p}_logs_sampled_out_total Total number of sampled out log entries`)
		lines.push(`# TYPE ${p}_logs_sampled_out_total counter`)
		lines.push(`${p}_logs_sampled_out_total${this.formatLabels()} ${this.sampledOut}`)

		// Flushes
		lines.push(`# HELP ${p}_flushes_total Total number of transport flushes`)
		lines.push(`# TYPE ${p}_flushes_total counter`)
		lines.push(`${p}_flushes_total${this.formatLabels()} ${this.flushes}`)

		// Last flush duration
		lines.push(`# HELP ${p}_last_flush_duration_ms Last flush duration in milliseconds`)
		lines.push(`# TYPE ${p}_last_flush_duration_ms gauge`)
		lines.push(`${p}_last_flush_duration_ms${this.formatLabels()} ${this.lastFlushDurationMs}`)

		return lines.join('\n')
	}

	/**
	 * Export metrics as JSON
	 */
	toJSON(): LoggerMetrics {
		return this.getMetrics()
	}
}

/**
 * Global metrics instance for convenience
 */
export const globalMetrics = new MetricsCollector()

/**
 * Create a new metrics collector with custom prefix and labels
 */
export function createMetricsCollector(options?: {
	prefix?: string
	labels?: Record<string, string>
}): MetricsCollector {
	return new MetricsCollector(options)
}
