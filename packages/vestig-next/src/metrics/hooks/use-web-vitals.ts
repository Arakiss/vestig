/**
 * Web Vitals Hook
 *
 * React hook for capturing Core Web Vitals metrics.
 * Uses simple useState + useEffect pattern (React Compiler handles memoization).
 *
 * @packageDocumentation
 */

'use client'

import { useEffect, useState } from 'react'
import type { Metric } from 'web-vitals'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import { MetricsReporter } from '../reporter'
import { metricsStore } from '../store'
import type { MetricEntry, MetricSummary, NavigationType, WebVitalName } from '../types'

/**
 * Options for useWebVitals hook
 */
interface UseWebVitalsOptions {
	/** Enable Web Vitals collection */
	enabled?: boolean
	/** Sampling rate (0.0 - 1.0) */
	sampleRate?: number
	/** Report endpoint */
	reportEndpoint?: string
	/** Report immediately when rating is poor */
	reportPoorImmediately?: boolean
	/** Debug mode */
	debug?: boolean
}

/**
 * Convert web-vitals Metric to our MetricEntry format
 */
function toMetricEntry(metric: Metric): Omit<MetricEntry, 'id' | 'timestamp'> {
	return {
		type: 'web-vital',
		name: metric.name as WebVitalName,
		value: metric.value,
		rating: metric.rating,
		metadata: {
			navigationType: metric.navigationType as NavigationType,
			delta: metric.delta,
			pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
		},
	}
}

/**
 * Hook to capture Core Web Vitals
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useWebVitals({
 *     enabled: process.env.NODE_ENV === 'development',
 *     sampleRate: 0.1,
 *     reportPoorImmediately: true,
 *   })
 *
 *   return <div>My App</div>
 * }
 * ```
 */
export function useWebVitals(options: UseWebVitalsOptions = {}): void {
	const {
		enabled = true,
		sampleRate = 1.0,
		reportEndpoint = '/api/vestig/metrics',
		reportPoorImmediately = true,
		debug = false,
	} = options

	useEffect(() => {
		if (!enabled) return
		if (Math.random() > sampleRate) return

		const reporter = new MetricsReporter({
			endpoint: reportEndpoint,
			debug,
		})

		const handleMetric = (metric: Metric): void => {
			const entry = toMetricEntry(metric)
			metricsStore.addMetric(entry)

			if (debug) {
				console.log(`[vestig-metrics] ${metric.name}:`, {
					value: metric.value,
					rating: metric.rating,
					delta: metric.delta,
				})
			}

			const fullEntry: MetricEntry = {
				...entry,
				id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
				timestamp: new Date().toISOString(),
			}

			if (reportPoorImmediately && metric.rating === 'poor') {
				reporter.reportImmediate(fullEntry)
			} else {
				reporter.report(fullEntry)
			}
		}

		onLCP(handleMetric)
		onCLS(handleMetric)
		onINP(handleMetric)
		onTTFB(handleMetric)
		onFCP(handleMetric)

		return () => {
			reporter.destroy()
		}
	}, [enabled, sampleRate, reportEndpoint, reportPoorImmediately, debug])
}

/**
 * Hook to get the current Web Vitals from the store
 *
 * Simple useState + useEffect pattern - React Compiler handles memoization.
 * No useSyncExternalStore = no hydration headaches.
 *
 * @returns Latest Web Vitals values
 *
 * @example
 * ```tsx
 * function MetricsDisplay() {
 *   const vitals = useWebVitalsData()
 *
 *   return (
 *     <div>
 *       <p>LCP: {vitals.LCP?.value ?? 'N/A'}</p>
 *       <p>CLS: {vitals.CLS?.value ?? 'N/A'}</p>
 *       <p>INP: {vitals.INP?.value ?? 'N/A'}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWebVitalsData(): Partial<Record<WebVitalName, MetricEntry>> {
	const [vitals, setVitals] = useState<Partial<Record<WebVitalName, MetricEntry>>>({})

	useEffect(() => {
		// Get initial state
		setVitals(metricsStore.getLatestVitals())

		// Subscribe to updates
		const unsubscribe = metricsStore.subscribe(() => {
			setVitals(metricsStore.getLatestVitals())
		})

		return unsubscribe
	}, [])

	return vitals
}

/**
 * Hook to get Web Vitals summary statistics
 *
 * @returns Summary statistics for all Web Vitals
 */
export function useWebVitalsSummary(): Partial<Record<WebVitalName, MetricSummary>> {
	const [summary, setSummary] = useState<Partial<Record<WebVitalName, MetricSummary>>>({})

	useEffect(() => {
		setSummary(metricsStore.getVitalsSummary())

		const unsubscribe = metricsStore.subscribe(() => {
			setSummary(metricsStore.getVitalsSummary())
		})

		return unsubscribe
	}, [])

	return summary
}
