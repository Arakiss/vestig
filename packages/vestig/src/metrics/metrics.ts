/**
 * Counter, Gauge and Histogram
 *
 * Deliberately small: a metric is a name, a help string and a map from label
 * set to value. No background timers, no async, nothing that behaves
 * differently on an Edge runtime than it does on Node.
 */

import { assertValidLabelName, assertValidMetricName, labelKey, normalizeLabels } from './format'
import type {
	Collectable,
	CollectedMetric,
	HistogramOptions,
	MetricLabels,
	MetricOptions,
	MetricSample,
} from './types'

/**
 * Default bucket bounds, in seconds.
 *
 * Chosen for HTTP request durations: dense where responses usually land,
 * sparse in the tail where only outliers live.
 */
export const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] as const

/**
 * Shared bookkeeping: name validation and label handling.
 */
abstract class BaseMetric implements Collectable {
	readonly name: string
	readonly help: string
	readonly labelNames: string[]

	constructor(options: MetricOptions) {
		assertValidMetricName(options.name)
		for (const label of options.labelNames ?? []) assertValidLabelName(label)

		this.name = options.name
		this.help = options.help
		this.labelNames = [...(options.labelNames ?? [])]
	}

	/**
	 * Normalise a label set and reject labels the metric was not declared with.
	 *
	 * A typo in a label name would otherwise create a parallel series that looks
	 * plausible in a dashboard and never adds up.
	 */
	protected resolveLabels(labels: MetricLabels = {}): Record<string, string> {
		const normalized = normalizeLabels(labels)

		if (this.labelNames.length > 0) {
			for (const key of Object.keys(normalized)) {
				if (!this.labelNames.includes(key)) {
					throw new Error(
						`Metric "${this.name}" was not declared with label "${key}" (declared: ${this.labelNames.join(', ') || 'none'})`,
					)
				}
			}
		} else if (Object.keys(normalized).length > 0) {
			throw new Error(
				`Metric "${this.name}" was declared without labels but received: ${Object.keys(normalized).join(', ')}`,
			)
		}

		return normalized
	}

	abstract collect(): CollectedMetric
	abstract reset(): void
}

/**
 * A monotonically increasing count.
 *
 * @example
 * ```typescript
 * const orders = counter('orders_total', 'Orders placed', ['status'])
 * orders.inc({ status: 'paid' })
 * ```
 */
export class Counter extends BaseMetric {
	private values = new Map<string, { labels: Record<string, string>; value: number }>()

	/**
	 * Increase the counter.
	 *
	 * @param labels - Label set for this series
	 * @param value - Amount to add; must not be negative
	 */
	inc(labels: MetricLabels = {}, value = 1): void {
		if (value < 0) {
			throw new Error(`Counter "${this.name}" cannot decrease (received ${value})`)
		}

		const resolved = this.resolveLabels(labels)
		const key = labelKey(resolved)
		const existing = this.values.get(key)

		if (existing) existing.value += value
		else this.values.set(key, { labels: resolved, value })
	}

	/**
	 * Current value of a series, or 0 if it has never been incremented.
	 */
	get(labels: MetricLabels = {}): number {
		const key = labelKey(this.resolveLabels(labels))
		return this.values.get(key)?.value ?? 0
	}

	collect(): CollectedMetric {
		return {
			name: this.name,
			help: this.help,
			type: 'counter',
			samples: [...this.values.values()].map(({ labels, value }) => ({
				name: this.name,
				labels,
				value,
			})),
		}
	}

	reset(): void {
		this.values.clear()
	}
}

/**
 * A value that goes up and down.
 *
 * @example
 * ```typescript
 * const inFlight = gauge('http_requests_in_flight', 'Requests being served')
 * inFlight.inc()
 * inFlight.dec()
 * ```
 */
export class Gauge extends BaseMetric {
	private values = new Map<string, { labels: Record<string, string>; value: number }>()

	/** Set the gauge to an absolute value. */
	set(value: number, labels: MetricLabels = {}): void {
		const resolved = this.resolveLabels(labels)
		this.values.set(labelKey(resolved), { labels: resolved, value })
	}

	/** Add to the gauge (default 1). */
	inc(labels: MetricLabels = {}, value = 1): void {
		this.set(this.get(labels) + value, labels)
	}

	/** Subtract from the gauge (default 1). */
	dec(labels: MetricLabels = {}, value = 1): void {
		this.set(this.get(labels) - value, labels)
	}

	/** Current value of a series, or 0 if never set. */
	get(labels: MetricLabels = {}): number {
		const key = labelKey(this.resolveLabels(labels))
		return this.values.get(key)?.value ?? 0
	}

	collect(): CollectedMetric {
		return {
			name: this.name,
			help: this.help,
			type: 'gauge',
			samples: [...this.values.values()].map(({ labels, value }) => ({
				name: this.name,
				labels,
				value,
			})),
		}
	}

	reset(): void {
		this.values.clear()
	}
}

interface HistogramSeries {
	labels: Record<string, string>
	counts: number[]
	sum: number
	count: number
}

/**
 * A distribution of observations across buckets.
 *
 * Buckets are cumulative in the exposition format: each `le` bucket counts
 * every observation at or below its bound.
 *
 * @example
 * ```typescript
 * const duration = histogram('http_request_duration_seconds', 'Request duration', ['route'])
 * const stop = duration.startTimer({ route: '/api/orders' })
 * await handle()
 * stop()
 * ```
 */
export class Histogram extends BaseMetric {
	readonly buckets: number[]
	private series = new Map<string, HistogramSeries>()

	constructor(options: HistogramOptions) {
		super(options)

		const buckets = [...(options.buckets ?? DEFAULT_BUCKETS)].sort((a, b) => a - b)
		if (buckets.length === 0) {
			throw new Error(`Histogram "${options.name}" needs at least one bucket`)
		}
		if (options.labelNames?.includes('le')) {
			throw new Error(`Histogram "${options.name}" cannot use the reserved label "le"`)
		}

		this.buckets = buckets
	}

	/**
	 * Record an observation.
	 *
	 * @param value - The observed value, in the metric's unit
	 * @param labels - Label set for this series
	 */
	observe(value: number, labels: MetricLabels = {}): void {
		const resolved = this.resolveLabels(labels)
		const key = labelKey(resolved)

		let series = this.series.get(key)
		if (!series) {
			series = {
				labels: resolved,
				counts: new Array(this.buckets.length).fill(0),
				sum: 0,
				count: 0,
			}
			this.series.set(key, series)
		}

		for (let i = 0; i < this.buckets.length; i++) {
			if (value <= (this.buckets[i] as number)) series.counts[i] = (series.counts[i] as number) + 1
		}

		series.sum += value
		series.count += 1
	}

	/**
	 * Start a timer and return the function that records the elapsed seconds.
	 *
	 * Seconds, not milliseconds: Prometheus convention is base units, and
	 * dashboards built for `_seconds` silently misreport milliseconds.
	 *
	 * @returns A function that observes the elapsed time and returns it
	 */
	startTimer(labels: MetricLabels = {}): () => number {
		const start = now()

		return () => {
			const elapsedSeconds = (now() - start) / 1000
			this.observe(elapsedSeconds, labels)
			return elapsedSeconds
		}
	}

	collect(): CollectedMetric {
		const samples: MetricSample[] = []

		for (const series of this.series.values()) {
			for (let i = 0; i < this.buckets.length; i++) {
				samples.push({
					name: `${this.name}_bucket`,
					labels: { ...series.labels, le: String(this.buckets[i]) },
					value: series.counts[i] as number,
				})
			}

			// The +Inf bucket is mandatory and always equals the total count.
			samples.push({
				name: `${this.name}_bucket`,
				labels: { ...series.labels, le: '+Inf' },
				value: series.count,
			})
			samples.push({ name: `${this.name}_sum`, labels: series.labels, value: series.sum })
			samples.push({ name: `${this.name}_count`, labels: series.labels, value: series.count })
		}

		return { name: this.name, help: this.help, type: 'histogram', samples }
	}

	reset(): void {
		this.series.clear()
	}
}

/**
 * Monotonic clock where available, wall clock otherwise.
 */
function now(): number {
	return typeof performance !== 'undefined' && typeof performance.now === 'function'
		? performance.now()
		: Date.now()
}
