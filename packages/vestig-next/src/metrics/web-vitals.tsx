/**
 * VestigMetrics Component
 *
 * Drop-in component for capturing Core Web Vitals and route metrics.
 * Add this to your root layout for automatic performance monitoring.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { VestigMetrics } from '@vestig/next/metrics'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <VestigMetrics
 *           sampleRate={0.1}  // 10% sampling in production
 *           reportEndpoint="/api/vestig/metrics"
 *         />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @packageDocumentation
 */

'use client'

import { useRouteMetrics } from './hooks/use-route-metrics'
import { useWebVitals } from './hooks/use-web-vitals'
import type { VestigMetricsConfig } from './types'

/**
 * Props for VestigMetrics component
 */
export interface VestigMetricsProps extends VestigMetricsConfig {}

/**
 * VestigMetrics - Core Web Vitals and Route Metrics Component
 *
 * This component automatically captures:
 * - **LCP** (Largest Contentful Paint) - Loading performance
 * - **CLS** (Cumulative Layout Shift) - Visual stability
 * - **INP** (Interaction to Next Paint) - Interactivity
 * - **TTFB** (Time to First Byte) - Server responsiveness
 * - **FCP** (First Contentful Paint) - Perceived load speed
 * - **Route metrics** - Navigation and hydration times
 *
 * @example Basic usage
 * ```tsx
 * <VestigMetrics />
 * ```
 *
 * @example With configuration
 * ```tsx
 * <VestigMetrics
 *   sampleRate={0.1}           // 10% of users
 *   reportEndpoint="/api/metrics"
 *   reportPoorImmediately      // Alert on poor metrics
 *   captureRouteMetrics        // Track route changes
 *   debug={process.env.NODE_ENV === 'development'}
 * />
 * ```
 *
 * @example Production setup
 * ```tsx
 * <VestigMetrics
 *   enabled={process.env.NODE_ENV === 'production'}
 *   sampleRate={0.1}
 *   reportPoorImmediately
 * />
 * ```
 */
export function VestigMetrics({
	enabled = true,
	sampleRate,
	reportEndpoint = '/api/vestig/metrics',
	reportPoorImmediately = true,
	captureRouteMetrics = true,
	debug = false,
}: VestigMetricsProps): null {
	// Determine sample rate based on environment if not specified
	const effectiveSampleRate =
		sampleRate ??
		(typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? 0.1 : 1.0)

	// Capture Core Web Vitals
	useWebVitals({
		enabled,
		sampleRate: effectiveSampleRate,
		reportEndpoint,
		reportPoorImmediately,
		debug,
	})

	// Capture route metrics
	useRouteMetrics({
		enabled: enabled && captureRouteMetrics,
		reportEndpoint,
		debug,
	})

	// This component doesn't render anything
	return null
}
