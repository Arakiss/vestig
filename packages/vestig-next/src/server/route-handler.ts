import {
	type LogLevel,
	type Logger,
	type SanitizePreset,
	type Span,
	createCorrelationContext,
	createLogger,
	span as createSpan,
	withContext,
} from 'vestig'
import type { RouteHandler, RouteHandlerContext, WithVestigOptions } from '../types'
import { extractCorrelationHeaders, setCorrelationHeaders } from '../utils/headers'
import { extractRequestMetadata } from '../utils/metadata'
import { createRequestTiming, formatDuration } from '../utils/timing'

type NextRequest = Request & { nextUrl?: URL }
type RouteContext = { params: Promise<RouteHandlerContext['params']> }

export interface RouteHandlerOptions extends WithVestigOptions {
	/** Log level for the route handler logger */
	level?: LogLevel
	/** Enable/disable logging */
	enabled?: boolean
	/** PII sanitization preset */
	sanitize?: SanitizePreset
	/** Use structured JSON output */
	structured?: boolean
	/** Additional context to include in all logs */
	context?: Record<string, unknown>
}

const DEFAULT_OPTIONS: RouteHandlerOptions = {
	level: 'info',
	enabled: true,
	sanitize: 'default',
	structured: true,
	logRequest: true,
	logResponse: true,
}

/**
 * Wrap a route handler with vestig logging
 *
 * Provides automatic:
 * - Request correlation (requestId, traceId, spanId)
 * - Request/response logging with timing
 * - Context propagation
 * - Error logging
 *
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { withVestig } from '@vestig/next'
 *
 * export const GET = withVestig(
 *   async (request, { log, ctx, timing }) => {
 *     log.debug('Fetching users from database')
 *
 *     const users = await db.users.findMany()
 *
 *     log.info('Users fetched', {
 *       count: users.length,
 *       duration: `${timing.elapsed().toFixed(2)}ms`,
 *     })
 *
 *     return Response.json({
 *       users,
 *       meta: { requestId: ctx.requestId },
 *     })
 *   },
 *   { namespace: 'api:users' }
 * )
 * ```
 */
export function withVestig<T = Response>(
	handler: RouteHandler<T>,
	options: RouteHandlerOptions = {},
): (request: NextRequest, routeContext: RouteContext) => Promise<T> {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	return async (request: NextRequest, routeContext?: RouteContext) => {
		const timing = createRequestTiming()

		// Create base logger
		const baseLogger = createLogger({
			level: mergedOptions.level,
			enabled: mergedOptions.enabled,
			sanitize: mergedOptions.sanitize,
			structured: mergedOptions.structured,
			context: mergedOptions.context,
		})

		const log = mergedOptions.namespace
			? baseLogger.child(mergedOptions.namespace)
			: baseLogger.child('api')

		// Extract correlation context from request headers
		const correlationHeaders = extractCorrelationHeaders(request.headers)
		const ctx = createCorrelationContext({
			requestId: correlationHeaders.requestId,
			traceId: correlationHeaders.traceId,
			spanId: correlationHeaders.spanId,
		})

		// Get route params
		const params = routeContext?.params ? await routeContext.params : {}

		// Get URL info for span name
		const url = request.nextUrl ?? new URL(request.url)
		const namespace = mergedOptions.namespace ?? 'api'

		return withContext(ctx, async () => {
			// Wrap entire request handling in a span
			return createSpan(`route:${namespace}`, async (s: Span) => {
				// Set HTTP attributes on span
				s.setAttributes({
					'http.method': request.method,
					'http.url': url.pathname,
					'http.request_id': ctx.requestId,
				})

				// Create handler context with span
				const handlerContext: RouteHandlerContext = {
					log,
					ctx,
					params,
					timing: {
						start: timing.start,
						elapsed: () => timing.elapsed(),
						mark: (name: string) => timing.mark(name),
					},
					span: s,
				}

				// Log request if enabled
				if (mergedOptions.logRequest !== false) {
					const metadata = extractRequestMetadata(request)
					log.info('Request received', {
						...metadata,
						requestId: ctx.requestId,
						traceId: ctx.traceId,
					})
				}

				try {
					const result = await handler(request, handlerContext)

					// Log response if enabled and result is Response
					if (result instanceof Response) {
						const duration = timing.complete()
						s.setAttribute('http.status_code', result.status)
						s.setStatus(result.ok ? 'ok' : 'error')

						if (mergedOptions.logResponse !== false) {
							log.info('Response sent', {
								status: result.status,
								duration: formatDuration(duration),
								durationMs: duration,
								requestId: ctx.requestId,
							})
						}

						// Add correlation headers to response
						setCorrelationHeaders(result.headers, ctx)
					} else {
						s.setStatus('ok')
					}

					return result
				} catch (error) {
					const duration = timing.complete()
					s.setStatus('error', error instanceof Error ? error.message : String(error))

					log.error('Request failed', {
						error,
						duration: formatDuration(duration),
						durationMs: duration,
						requestId: ctx.requestId,
					})
					throw error
				}
			})
		})
	}
}

/**
 * Create route handlers for all HTTP methods at once
 *
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { createRouteHandlers } from '@vestig/next'
 *
 * export const { GET, POST, DELETE } = createRouteHandlers(
 *   {
 *     async GET(req, { log }) {
 *       log.info('Fetching users')
 *       return Response.json(users)
 *     },
 *     async POST(req, { log }) {
 *       log.info('Creating user')
 *       return Response.json(user, { status: 201 })
 *     },
 *     async DELETE(req, { log, params }) {
 *       log.info('Deleting user', { id: params.id })
 *       return new Response(null, { status: 204 })
 *     },
 *   },
 *   { namespace: 'api:users' }
 * )
 * ```
 */
export function createRouteHandlers(
	handlers: {
		GET?: RouteHandler
		POST?: RouteHandler
		PUT?: RouteHandler
		PATCH?: RouteHandler
		DELETE?: RouteHandler
		HEAD?: RouteHandler
		OPTIONS?: RouteHandler
	},
	options: RouteHandlerOptions = {},
): Record<string, ReturnType<typeof withVestig>> {
	const result: Record<string, ReturnType<typeof withVestig>> = {}

	for (const [method, handler] of Object.entries(handlers)) {
		if (handler) {
			result[method] = withVestig(handler, {
				...options,
				namespace: options.namespace ?? `api:${method.toLowerCase()}`,
			})
		}
	}

	return result
}
