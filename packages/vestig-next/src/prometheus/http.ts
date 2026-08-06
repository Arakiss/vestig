/**
 * Automatic HTTP metrics
 *
 * The three signals a request-serving system is judged on — rate, errors,
 * duration — recorded per route and status so they aggregate the way
 * dashboards expect.
 *
 * Route labels use the route *pattern* rather than the URL. `/orders/1` and
 * `/orders/2` must not become two series: unbounded label values are the most
 * common way a Prometheus setup falls over.
 */

import { type Counter, type Gauge, type Histogram, globalRegistry } from 'vestig'
import type { MetricsRegistry } from 'vestig'

/**
 * The standard HTTP metric set.
 */
export interface HttpMetrics {
	/** Requests handled, by method, route and status code */
	requestsTotal: Counter
	/** Request duration in seconds, by method and route */
	requestDuration: Histogram
	/** Requests currently being served */
	requestsInFlight: Gauge
}

/**
 * Options for the HTTP metric set.
 */
export interface HttpMetricsOptions {
	/** Registry to declare the metrics on. Defaults to the global one. */
	registry?: MetricsRegistry
	/** Bucket bounds in seconds. Defaults to the registry's default spread. */
	buckets?: number[]
}

/**
 * Declare (or reuse) the standard HTTP metrics.
 *
 * Idempotent: calling it from several modules returns the same instruments.
 */
export function httpMetrics(options: HttpMetricsOptions = {}): HttpMetrics {
	const registry = options.registry ?? globalRegistry

	return {
		requestsTotal: registry.counter('http_requests_total', 'Total HTTP requests handled', [
			'method',
			'route',
			'status',
		]),
		requestDuration: registry.histogram(
			'http_request_duration_seconds',
			'HTTP request duration in seconds',
			['method', 'route'],
			options.buckets,
		),
		requestsInFlight: registry.gauge(
			'http_requests_in_flight',
			'HTTP requests currently being served',
			['method', 'route'],
		),
	}
}

/**
 * Options for {@link withMetrics}.
 */
export interface WithMetricsOptions extends HttpMetricsOptions {
	/**
	 * Route pattern for the label, e.g. `/api/orders/[id]`.
	 *
	 * Strongly recommended. Without it the pathname is used, which turns every
	 * distinct id into its own series.
	 */
	route?: string
}

type RouteHandler = (request: Request, context?: unknown) => Response | Promise<Response>

/**
 * Bucket a status code the way HTTP semantics do.
 */
function statusClass(status: number): string {
	return `${Math.floor(status / 100)}xx`
}

/**
 * Wrap a route handler so it records rate, errors and duration.
 *
 * Composes with `withVestig`: wrap with whichever you want outermost.
 *
 * @example
 * ```typescript
 * // app/api/orders/[id]/route.ts
 * import { withMetrics } from '@vestig/next/prometheus'
 *
 * export const GET = withMetrics(
 *   async (request) => Response.json(await getOrder()),
 *   { route: '/api/orders/[id]' },
 * )
 * ```
 */
export function withMetrics(handler: RouteHandler, options: WithMetricsOptions = {}): RouteHandler {
	const metrics = httpMetrics(options)

	return async (request: Request, context?: unknown): Promise<Response> => {
		const method = request.method
		const route = options.route ?? safePathname(request.url)
		const labels = { method, route }

		metrics.requestsInFlight.inc(labels)
		const stop = metrics.requestDuration.startTimer(labels)

		try {
			const response = await handler(request, context)
			metrics.requestsTotal.inc({ ...labels, status: statusClass(response.status) })
			return response
		} catch (error) {
			// A thrown handler is a 500 to the client, so it must count as one
			// here too — otherwise the error rate hides exactly the failures
			// that matter most.
			metrics.requestsTotal.inc({ ...labels, status: '5xx' })
			throw error
		} finally {
			stop()
			metrics.requestsInFlight.dec(labels)
		}
	}
}

/**
 * Pathname of a URL, falling back to `unknown` rather than throwing.
 */
function safePathname(url: string): string {
	try {
		return new URL(url).pathname
	} catch {
		return 'unknown'
	}
}
