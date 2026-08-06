/**
 * Metrics
 *
 * Two separate things live here:
 *
 * - `MetricsCollector` instruments vestig itself (logs emitted, dropped
 *   entries, transport errors) and answers "is my logging healthy?".
 * - The registry, `Counter`, `Gauge` and `Histogram` are for your application's
 *   own metrics, and answer "is my application healthy?".
 *
 * Both render to the Prometheus text format.
 */

// Logger self-instrumentation
export {
	MetricsCollector,
	globalMetrics,
	createMetricsCollector,
	type LoggerMetrics,
} from './prometheus'

// Application metrics
export { Counter, Gauge, Histogram, DEFAULT_BUCKETS } from './metrics'
export {
	MetricsRegistry,
	globalRegistry,
	counter,
	gauge,
	histogram,
	metricsText,
	type RegistryOptions,
} from './registry'
export { collectRuntimeMetrics, canCollectRuntimeMetrics } from './runtime'
export { PROMETHEUS_CONTENT_TYPE, formatMetrics } from './format'
export type {
	CollectedMetric,
	Collectable,
	HistogramOptions,
	MetricLabels,
	MetricOptions,
	MetricSample,
	MetricType,
} from './types'
