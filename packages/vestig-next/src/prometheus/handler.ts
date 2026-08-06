/**
 * The /metrics endpoint
 *
 * A route handler that renders the registry in the Prometheus text format.
 *
 * Two things about running this on Next.js are worth being explicit about,
 * because getting them wrong produces data that looks fine and is not:
 *
 * - Metrics live in the memory of the instance that served the request. With
 *   several serverless instances, a scrape reads whichever one answered, and
 *   counters appear to jump backwards. On a long-lived server (`next start`,
 *   a container, a VM) this is exactly what Prometheus expects.
 * - Middleware runs on the Edge runtime, a separate module instance from the
 *   Node handlers. Metrics recorded there are not visible here. Record from
 *   route handlers and server actions.
 */

import {
	PROMETHEUS_CONTENT_TYPE,
	collectRuntimeMetrics,
	globalRegistry,
	type MetricsRegistry,
} from 'vestig'

/**
 * Options for {@link createMetricsHandler}.
 */
export interface MetricsHandlerOptions {
	/** Registry to render. Defaults to the global one. */
	registry?: MetricsRegistry

	/**
	 * Bearer token required to scrape.
	 *
	 * Defaults to `process.env.VESTIG_METRICS_TOKEN`. A metrics endpoint
	 * reachable from the internet exposes route names, traffic shape and error
	 * rates, so on a public deployment this should be set.
	 */
	token?: string

	/**
	 * Include process metrics (memory, CPU, uptime). Defaults to true where the
	 * runtime can provide them.
	 */
	runtimeMetrics?: boolean

	/**
	 * Labels added to every metric, e.g. `{ service: 'checkout' }`.
	 */
	defaultLabels?: Record<string, string>
}

/**
 * Read an environment variable without assuming `process` exists.
 */
function readEnv(name: string): string | undefined {
	try {
		const proc = globalThis.process as NodeJS.Process | undefined
		return proc?.env?.[name]
	} catch {
		return undefined
	}
}

/**
 * Whether the request carries the expected bearer token.
 */
function isAuthorized(request: Request, token: string): boolean {
	const header = request.headers.get('authorization') ?? ''
	const provided = header.startsWith('Bearer ') ? header.slice(7) : ''

	// Length-independent comparison is not meaningful here without a constant
	// time primitive available on every runtime; the token is a scrape secret,
	// not a password, and the endpoint is not a brute-force oracle.
	return provided === token
}

let warnedAboutOpenEndpoint = false

/**
 * Warn once when a production deployment exposes metrics without a token.
 */
function warnIfUnprotected(): void {
	if (warnedAboutOpenEndpoint) return
	if (readEnv('NODE_ENV') !== 'production') return

	warnedAboutOpenEndpoint = true
	console.warn(
		'[vestig] The metrics endpoint is running in production without a token. ' +
			'Anyone who can reach it sees your route names, traffic volume and error rates. ' +
			'Set VESTIG_METRICS_TOKEN, or pass { token } to createMetricsHandler.',
	)
}

/**
 * Create the GET handler for a metrics route.
 *
 * @example
 * ```typescript
 * // app/metrics/route.ts
 * import { createMetricsHandler } from '@vestig/next/prometheus'
 *
 * export const GET = createMetricsHandler()
 *
 * // Metrics are per-instance, so the route must not be cached or prerendered
 * export const dynamic = 'force-dynamic'
 * ```
 *
 * @example Protecting the endpoint
 * ```typescript
 * export const GET = createMetricsHandler({
 *   token: process.env.METRICS_TOKEN,
 *   defaultLabels: { service: 'checkout' },
 * })
 * // scrape with: Authorization: Bearer <token>
 * ```
 */
export function createMetricsHandler(
	options: MetricsHandlerOptions = {},
): (request: Request) => Promise<Response> {
	const registry = options.registry ?? globalRegistry
	const token = options.token ?? readEnv('VESTIG_METRICS_TOKEN')

	if (options.defaultLabels) registry.setDefaultLabels(options.defaultLabels)
	if (options.runtimeMetrics !== false) collectRuntimeMetrics(registry)

	return async (request: Request): Promise<Response> => {
		if (token) {
			if (!isAuthorized(request, token)) {
				return new Response('Unauthorized\n', {
					status: 401,
					headers: { 'www-authenticate': 'Bearer' },
				})
			}
		} else {
			warnIfUnprotected()
		}

		const body = registry.metricsText()

		return new Response(body, {
			status: 200,
			headers: {
				'content-type': PROMETHEUS_CONTENT_TYPE,
				// A cached scrape is a lie about the present, and CDNs will cache
				// a 200 on a GET given the chance.
				'cache-control': 'no-store, max-age=0',
			},
		})
	}
}
