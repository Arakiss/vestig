/**
 * Metrics Store
 *
 * Simple pub/sub store for performance metrics.
 * Designed for reliability over cleverness - no useSyncExternalStore magic.
 *
 * @packageDocumentation
 */

import { THRESHOLDS, getRating } from './thresholds'
import type {
	HistogramBucket,
	MetricEntry,
	MetricRating,
	MetricSummary,
	MetricsState,
	WebVitalName,
} from './types'

/**
 * Create a unique ID for metrics
 */
function createMetricId(): string {
	return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0
	const index = Math.ceil((p / 100) * sorted.length) - 1
	const clampedIndex = Math.max(0, Math.min(index, sorted.length - 1))
	return sorted[clampedIndex] ?? 0
}

type Listener = () => void

/**
 * Simple metrics store - no React magic, just data + subscriptions
 */
class SimpleMetricsStore {
	private state: MetricsState = {
		metrics: [],
		maxMetrics: 500,
		latestVitals: {},
	}

	private listeners = new Set<Listener>()

	/**
	 * Subscribe to store changes
	 */
	subscribe(listener: Listener): () => void {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	/**
	 * Notify all listeners of a change
	 */
	private notify(): void {
		for (const listener of this.listeners) {
			try {
				listener()
			} catch (error) {
				console.error('[vestig-metrics] Listener error:', error)
			}
		}
	}

	/**
	 * Add a new metric to the store
	 */
	addMetric(entry: Omit<MetricEntry, 'id' | 'timestamp'>): void {
		const metric: MetricEntry = {
			...entry,
			id: createMetricId(),
			timestamp: new Date().toISOString(),
		}

		this.state.metrics.push(metric)

		// Update latest vitals
		if (entry.type === 'web-vital') {
			this.state.latestVitals[entry.name as WebVitalName] = metric
		}

		// Trim if over limit
		if (this.state.metrics.length > this.state.maxMetrics) {
			this.state.metrics = this.state.metrics.slice(-this.state.maxMetrics)
		}

		this.notify()
	}

	/**
	 * Get latest vitals - returns a new object each time (React will handle memoization)
	 */
	getLatestVitals(): Partial<Record<WebVitalName, MetricEntry>> {
		return { ...this.state.latestVitals }
	}

	/**
	 * Get vitals summary
	 */
	getVitalsSummary(): Partial<Record<WebVitalName, MetricSummary>> {
		const result: Partial<Record<WebVitalName, MetricSummary>> = {}
		const vitals: WebVitalName[] = ['LCP', 'CLS', 'INP', 'TTFB', 'FCP']

		for (const name of vitals) {
			const summary = this.getSummary(name)
			if (summary) {
				result[name] = summary
			}
		}

		return result
	}

	/**
	 * Get route metrics
	 */
	getRouteMetrics(): MetricEntry[] {
		return this.state.metrics.filter((m) => m.type === 'route')
	}

	/**
	 * Get histogram for a specific metric
	 */
	getHistogram(name: string, bucketCount = 10): HistogramBucket[] {
		const values = this.state.metrics.filter((m) => m.name === name).map((m) => m.value)

		if (values.length === 0) return []

		const min = Math.min(...values)
		const max = Math.max(...values)
		const range = max - min || 1
		const bucketSize = range / bucketCount

		const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
			min: min + i * bucketSize,
			max: min + (i + 1) * bucketSize,
			count: 0,
			percentage: 0,
		}))

		for (const value of values) {
			const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1)
			const bucket = buckets[bucketIndex]
			if (bucket) bucket.count++
		}

		for (const bucket of buckets) {
			bucket.percentage = (bucket.count / values.length) * 100
		}

		return buckets
	}

	/**
	 * Get summary statistics for a metric
	 */
	getSummary(name: string): MetricSummary | null {
		const values = this.state.metrics.filter((m) => m.name === name).map((m) => m.value)

		if (values.length === 0) return null

		const sorted = [...values].sort((a, b) => a - b)
		const sum = values.reduce((acc, v) => acc + v, 0)
		const avg = sum / values.length
		const p75 = percentile(sorted, 75)

		let rating: MetricRating = 'needs-improvement'
		if (name in THRESHOLDS) {
			rating = getRating(name as WebVitalName, p75)
		}

		return {
			name,
			count: values.length,
			avg,
			min: sorted[0] ?? 0,
			max: sorted[sorted.length - 1] ?? 0,
			p50: percentile(sorted, 50),
			p75,
			p95: percentile(sorted, 95),
			p99: percentile(sorted, 99),
			rating,
		}
	}

	/**
	 * Get the latest metric for a given name
	 */
	getLatest(name: string): MetricEntry | null {
		if (name in this.state.latestVitals) {
			return this.state.latestVitals[name as WebVitalName] ?? null
		}

		const metrics = this.state.metrics.filter((m) => m.name === name)
		return metrics[metrics.length - 1] ?? null
	}

	/**
	 * Get current snapshot (for debugging)
	 */
	getSnapshot(): MetricsState {
		return this.state
	}

	/**
	 * Clear all metrics
	 */
	clear(): void {
		this.state.metrics = []
		this.state.latestVitals = {}
		this.notify()
	}
}

/**
 * Global metrics store singleton
 */
export const metricsStore = new SimpleMetricsStore()
