/**
 * Route Metrics Hook
 *
 * React hook for capturing route-level performance metrics
 * including render time, hydration time, and data fetching.
 *
 * @packageDocumentation
 */

'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetricsReporter } from '../reporter'
import { metricsStore } from '../store'
import type { MetricEntry, RouteMetric } from '../types'

/**
 * Options for useRouteMetrics hook
 */
interface UseRouteMetricsOptions {
	/** Enable route metrics collection */
	enabled?: boolean
	/** Report endpoint */
	reportEndpoint?: string
	/** Debug mode */
	debug?: boolean
}

/**
 * Hook to capture route-level performance metrics
 *
 * Automatically tracks:
 * - Route render time
 * - Hydration time (client-side)
 * - Navigation timing
 *
 * @example
 * ```tsx
 * function MyLayout({ children }) {
 *   useRouteMetrics({
 *     enabled: process.env.NODE_ENV === 'development',
 *   })
 *
 *   return <div>{children}</div>
 * }
 * ```
 */
export function useRouteMetrics(options: UseRouteMetricsOptions = {}): void {
	const { enabled = true, reportEndpoint = '/api/vestig/metrics', debug = false } = options

	const pathname = usePathname()
	const renderStartRef = useRef<number>(performance.now())
	const lastPathnameRef = useRef<string | null>(null)
	const hydrationMeasuredRef = useRef(false)

	useEffect(() => {
		if (!enabled) return

		const reporter = new MetricsReporter({
			endpoint: reportEndpoint,
			debug,
			batchInterval: 10000, // Longer interval for route metrics
		})

		// Measure hydration time on initial mount
		if (!hydrationMeasuredRef.current && typeof window !== 'undefined') {
			hydrationMeasuredRef.current = true

			// Use requestIdleCallback or setTimeout to measure after hydration
			const measureHydration = (): void => {
				const hydrationTime = performance.now() - renderStartRef.current

				if (debug) {
					console.log(
						`[vestig-metrics] Hydration time for ${pathname}:`,
						hydrationTime.toFixed(2),
						'ms',
					)
				}

				const entry: Omit<MetricEntry, 'id' | 'timestamp'> = {
					type: 'route',
					name: 'hydration',
					value: hydrationTime,
					metadata: {
						pathname,
					},
				}

				metricsStore.addMetric(entry)
			}

			if ('requestIdleCallback' in window) {
				;(window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
					measureHydration,
				)
			} else {
				setTimeout(measureHydration, 0)
			}
		}

		return () => {
			reporter.destroy()
		}
	}, [enabled, reportEndpoint, debug, pathname])

	// Track route changes
	useEffect(() => {
		if (!enabled) return

		// Skip initial render
		if (lastPathnameRef.current === null) {
			lastPathnameRef.current = pathname
			return
		}

		// Route changed - measure navigation time
		if (pathname !== lastPathnameRef.current) {
			const navigationTime = performance.now() - renderStartRef.current

			if (debug) {
				console.log(`[vestig-metrics] Navigation to ${pathname}:`, navigationTime.toFixed(2), 'ms')
			}

			const entry: Omit<MetricEntry, 'id' | 'timestamp'> = {
				type: 'route',
				name: 'navigation',
				value: navigationTime,
				metadata: {
					pathname,
				},
			}

			metricsStore.addMetric(entry)

			// Reset for next navigation
			lastPathnameRef.current = pathname
			renderStartRef.current = performance.now()
		}
	}, [enabled, pathname, debug])
}

/**
 * Hook to get route metrics from the store
 *
 * Uses simple useState + useEffect pattern - React Compiler handles memoization.
 *
 * @returns Array of route metrics
 */
export function useRouteMetricsData(): MetricEntry[] {
	const [routeMetrics, setRouteMetrics] = useState<MetricEntry[]>([])

	useEffect(() => {
		setRouteMetrics(metricsStore.getRouteMetrics())

		const unsubscribe = metricsStore.subscribe(() => {
			setRouteMetrics(metricsStore.getRouteMetrics())
		})

		return unsubscribe
	}, [])

	return routeMetrics
}

/**
 * Hook to manually measure render time
 *
 * Useful for measuring specific component render times.
 *
 * @example
 * ```tsx
 * function ExpensiveComponent() {
 *   const { startMeasure, endMeasure } = useRenderTiming('ExpensiveComponent')
 *
 *   useEffect(() => {
 *     startMeasure()
 *     return () => endMeasure()
 *   }, [])
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useRenderTiming(componentName: string) {
	const startTimeRef = useRef<number | null>(null)

	const startMeasure = useCallback(() => {
		startTimeRef.current = performance.now()
	}, [])

	const endMeasure = useCallback(() => {
		if (startTimeRef.current === null) return

		const renderTime = performance.now() - startTimeRef.current
		startTimeRef.current = null

		const entry: Omit<MetricEntry, 'id' | 'timestamp'> = {
			type: 'custom',
			name: `render:${componentName}`,
			value: renderTime,
			metadata: {
				pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
			},
		}

		metricsStore.addMetric(entry)
	}, [componentName])

	return { startMeasure, endMeasure }
}

/**
 * Hook to measure data fetching time
 *
 * @example
 * ```tsx
 * function DataComponent() {
 *   const { measureFetch } = useDataFetchTiming()
 *
 *   useEffect(() => {
 *     measureFetch('users', async () => {
 *       const res = await fetch('/api/users')
 *       return res.json()
 *     })
 *   }, [])
 * }
 * ```
 */
export function useDataFetchTiming() {
	const measureFetch = useCallback(
		async <T>(name: string, fetchFn: () => Promise<T>): Promise<T> => {
			const start = performance.now()

			try {
				const result = await fetchFn()
				const duration = performance.now() - start

				const entry: Omit<MetricEntry, 'id' | 'timestamp'> = {
					type: 'custom',
					name: `fetch:${name}`,
					value: duration,
					metadata: {
						pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
					},
				}

				metricsStore.addMetric(entry)

				return result
			} catch (error) {
				const duration = performance.now() - start

				const entry: Omit<MetricEntry, 'id' | 'timestamp'> = {
					type: 'custom',
					name: `fetch:${name}:error`,
					value: duration,
					metadata: {
						pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
					},
				}

				metricsStore.addMetric(entry)

				throw error
			}
		},
		[],
	)

	return { measureFetch }
}
