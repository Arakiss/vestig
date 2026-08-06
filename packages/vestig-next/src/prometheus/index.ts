/**
 * @vestig/next/prometheus - Prometheus metrics for Next.js
 *
 * Server-side counterpart to `@vestig/next/metrics`, which is a client module
 * for Web Vitals. This one runs on the server: it exposes the scrape endpoint
 * and records HTTP metrics.
 *
 * @example Expose the endpoint
 * ```typescript
 * // app/metrics/route.ts
 * import { createMetricsHandler } from '@vestig/next/prometheus'
 *
 * export const GET = createMetricsHandler({ token: process.env.METRICS_TOKEN })
 * export const dynamic = 'force-dynamic'
 * ```
 *
 * @example Instrument a route
 * ```typescript
 * // app/api/orders/route.ts
 * import { withMetrics } from '@vestig/next/prometheus'
 *
 * export const POST = withMetrics(
 *   async (request) => Response.json(await placeOrder(await request.json())),
 *   { route: '/api/orders' },
 * )
 * ```
 *
 * @example Your own metrics
 * ```typescript
 * import { counter, histogram } from 'vestig/metrics'
 *
 * const orders = counter('orders_total', 'Orders placed', ['status'])
 * const value = histogram('order_value_eur', 'Order value in euros', [], [10, 50, 100, 500])
 *
 * orders.inc({ status: 'paid' })
 * value.observe(129.9)
 * ```
 *
 * @packageDocumentation
 */

export { createMetricsHandler, type MetricsHandlerOptions } from './handler'
export {
	withMetrics,
	httpMetrics,
	type HttpMetrics,
	type HttpMetricsOptions,
	type WithMetricsOptions,
} from './http'

// Re-exported so an application can declare metrics without importing the core
// package directly. They are the same instruments and the same global registry.
export {
	counter,
	gauge,
	histogram,
	metricsText,
	globalRegistry,
	MetricsRegistry,
	collectRuntimeMetrics,
	canCollectRuntimeMetrics,
	PROMETHEUS_CONTENT_TYPE,
	Counter,
	Gauge,
	Histogram,
	DEFAULT_BUCKETS,
} from 'vestig'
export type { MetricLabels, MetricSample, CollectedMetric, RegistryOptions } from 'vestig'
