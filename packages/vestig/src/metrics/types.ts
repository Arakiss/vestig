/**
 * Application metrics types
 *
 * These describe metrics about the application, not about the logger.
 * `MetricsCollector` in `prometheus.ts` instruments vestig itself; everything
 * here is for the counters, gauges and histograms your own code records.
 */

/**
 * Label values attached to a single sample.
 *
 * Numbers and booleans are accepted and stringified, because label values are
 * always text in the exposition format.
 */
export type MetricLabels = Record<string, string | number | boolean>

/**
 * Metric kinds supported by the exposition format.
 */
export type MetricType = 'counter' | 'gauge' | 'histogram'

/**
 * Options shared by every metric.
 */
export interface MetricOptions {
	/** Metric name, e.g. `http_requests_total` */
	name: string
	/** Single-line description shown as HELP */
	help: string
	/** Label names this metric accepts, in any order */
	labelNames?: string[]
}

/**
 * Options for a histogram.
 */
export interface HistogramOptions extends MetricOptions {
	/**
	 * Upper bounds of the buckets, ascending. `+Inf` is added automatically.
	 * Defaults to a spread suited to request durations in seconds.
	 */
	buckets?: number[]
}

/**
 * A single exported sample.
 */
export interface MetricSample {
	name: string
	labels: Record<string, string>
	value: number
}

/**
 * A metric and everything needed to render it.
 */
export interface CollectedMetric {
	name: string
	help: string
	type: MetricType
	samples: MetricSample[]
}

/**
 * Anything the registry can collect.
 */
export interface Collectable {
	readonly name: string
	collect(): CollectedMetric
	reset(): void
}
