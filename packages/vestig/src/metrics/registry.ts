/**
 * Metrics registry
 *
 * Holds the metrics an application declares and renders them on demand. There
 * is a global registry because metrics are usually declared at module scope and
 * scraped from a single endpoint, but a private registry can be created for
 * tests or for isolating a subsystem.
 */

import { formatMetrics } from './format'
import { Counter, Gauge, Histogram } from './metrics'
import type { Collectable, CollectedMetric } from './types'

/**
 * Options for a registry.
 */
export interface RegistryOptions {
	/**
	 * Labels added to every sample, e.g. `{ service: 'checkout' }`.
	 *
	 * Applied at render time, so a metric declared without labels still gets
	 * them. A label a metric sets itself wins.
	 */
	defaultLabels?: Record<string, string>
}

/**
 * A collection of metrics that can be rendered together.
 */
export class MetricsRegistry {
	private metrics = new Map<string, Collectable>()
	private collectors: Array<() => void> = []
	private defaultLabels: Record<string, string>

	constructor(options: RegistryOptions = {}) {
		this.defaultLabels = { ...options.defaultLabels }
	}

	/**
	 * Register a metric.
	 *
	 * Re-registering the same name is an error: it usually means two modules
	 * declared the same metric with different labels or buckets, and silently
	 * keeping one of them produces a series that is wrong in a way nobody
	 * notices.
	 */
	register<T extends Collectable>(metric: T): T {
		const existing = this.metrics.get(metric.name)
		if (existing) {
			throw new Error(
				`Metric "${metric.name}" is already registered. Declare it once at module scope and import it, or use a separate registry.`,
			)
		}

		this.metrics.set(metric.name, metric)
		return metric
	}

	/**
	 * Get a metric that is already registered, or undefined.
	 */
	get(name: string): Collectable | undefined {
		return this.metrics.get(name)
	}

	/**
	 * Declare a counter, or return the existing one with that name.
	 *
	 * Idempotent so that a module re-evaluated by a dev server does not throw.
	 */
	counter(name: string, help: string, labelNames?: string[]): Counter {
		const existing = this.metrics.get(name)
		if (existing) return existing as Counter

		return this.register(new Counter({ name, help, labelNames }))
	}

	/**
	 * Declare a gauge, or return the existing one with that name.
	 */
	gauge(name: string, help: string, labelNames?: string[]): Gauge {
		const existing = this.metrics.get(name)
		if (existing) return existing as Gauge

		return this.register(new Gauge({ name, help, labelNames }))
	}

	/**
	 * Declare a histogram, or return the existing one with that name.
	 */
	histogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram {
		const existing = this.metrics.get(name)
		if (existing) return existing as Histogram

		return this.register(new Histogram({ name, help, labelNames, buckets }))
	}

	/**
	 * Add labels applied to every sample this registry renders.
	 */
	setDefaultLabels(labels: Record<string, string>): void {
		this.defaultLabels = { ...this.defaultLabels, ...labels }
	}

	/**
	 * Register a function to run immediately before each collection.
	 *
	 * For values that are read rather than accumulated — memory, uptime, queue
	 * depth — sampling them at scrape time avoids a background timer that would
	 * keep a serverless instance awake.
	 */
	addCollector(collect: () => void): void {
		this.collectors.push(collect)
	}

	/**
	 * Collect every registered metric.
	 */
	collect(): CollectedMetric[] {
		for (const collector of this.collectors) {
			try {
				collector()
			} catch {
				// A failing collector must not take the whole endpoint down:
				// losing one metric beats losing the scrape.
			}
		}

		const collected = [...this.metrics.values()].map((metric) => metric.collect())
		if (Object.keys(this.defaultLabels).length === 0) return collected

		return collected.map((metric) => ({
			...metric,
			samples: metric.samples.map((sample) => ({
				...sample,
				// The metric's own labels win: a per-series value is more specific
				// than a registry-wide default.
				labels: { ...this.defaultLabels, ...sample.labels },
			})),
		}))
	}

	/**
	 * Render every registered metric in Prometheus text format.
	 */
	metricsText(): string {
		return formatMetrics(this.collect())
	}

	/**
	 * Reset every metric's values, keeping the declarations.
	 */
	resetMetrics(): void {
		for (const metric of this.metrics.values()) metric.reset()
	}

	/**
	 * Remove every metric. Mainly for tests.
	 */
	clear(): void {
		this.metrics.clear()
	}

	/**
	 * Names of every registered metric.
	 */
	get registered(): string[] {
		return [...this.metrics.keys()]
	}
}

/**
 * The registry used by the module-level helpers and by the Next.js handler.
 */
export const globalRegistry = new MetricsRegistry()

/**
 * Declare a counter on the global registry.
 *
 * @example
 * ```typescript
 * const orders = counter('orders_total', 'Orders placed', ['status'])
 * orders.inc({ status: 'paid' })
 * ```
 */
export function counter(name: string, help: string, labelNames?: string[]): Counter {
	return globalRegistry.counter(name, help, labelNames)
}

/**
 * Declare a gauge on the global registry.
 *
 * @example
 * ```typescript
 * const queueDepth = gauge('queue_depth', 'Jobs waiting', ['queue'])
 * queueDepth.set(12, { queue: 'emails' })
 * ```
 */
export function gauge(name: string, help: string, labelNames?: string[]): Gauge {
	return globalRegistry.gauge(name, help, labelNames)
}

/**
 * Declare a histogram on the global registry.
 *
 * @example
 * ```typescript
 * const duration = histogram('job_duration_seconds', 'Job duration', ['job'])
 * duration.observe(1.4, { job: 'export' })
 * ```
 */
export function histogram(
	name: string,
	help: string,
	labelNames?: string[],
	buckets?: number[],
): Histogram {
	return globalRegistry.histogram(name, help, labelNames, buckets)
}

/**
 * Render the global registry in Prometheus text format.
 */
export function metricsText(): string {
	return globalRegistry.metricsText()
}
