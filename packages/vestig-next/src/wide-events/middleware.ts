import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	type LogLevel,
	type Logger,
	type SanitizePreset,
	type TailSamplingConfig,
	createCorrelationContext,
	createLogger,
	createTraceparent,
	createWideEvent,
	parseTraceparent,
} from 'vestig'
import { CORRELATION_HEADERS } from '../utils/headers'
import { type WideEventRequestContext, runWithWideEvent } from './context'

/**
 * Options for the wide event middleware
 */
export interface WideEventMiddlewareOptions {
	/** Log level for the logger */
	level?: LogLevel
	/** Enable/disable wide event logging */
	enabled?: boolean
	/** PII sanitization preset */
	sanitize?: SanitizePreset
	/** Paths to skip (prefix matching) */
	skipPaths?: string[]
	/** Custom header name for request ID */
	requestIdHeader?: string
	/** Use structured JSON output */
	structured?: boolean
	/** Tail sampling configuration for wide events */
	tailSampling?: TailSamplingConfig
}

const DEFAULT_OPTIONS: WideEventMiddlewareOptions = {
	level: 'info',
	enabled: true,
	sanitize: 'default',
	skipPaths: ['/_next', '/favicon.ico', '/api/vestig'],
	requestIdHeader: CORRELATION_HEADERS.REQUEST_ID,
	structured: true,
}

// Cached logger per middleware instance
const loggerCache = new WeakMap<WideEventMiddlewareOptions, Logger>()

function getOrCreateLogger(options: WideEventMiddlewareOptions): Logger {
	const cached = loggerCache.get(options)
	if (cached) return cached

	const logger = createLogger({
		level: options.level,
		enabled: options.enabled,
		sanitize: options.sanitize,
		structured: options.structured,
		tailSampling: options.tailSampling,
	})

	loggerCache.set(options, logger)
	return logger
}

/**
 * Create wide event middleware for Next.js
 *
 * This middleware automatically creates a wide event for each request
 * and populates it with HTTP context. The wide event is available
 * throughout the request lifecycle via `getWideEvent()`.
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createWideEventMiddleware } from '@vestig/next/wide-events'
 *
 * export const middleware = createWideEventMiddleware({
 *   skipPaths: ['/health', '/metrics'],
 *   tailSampling: {
 *     enabled: true,
 *     alwaysKeepStatuses: ['error'],
 *     slowThresholdMs: 2000,
 *     successSampleRate: 0.1,
 *   },
 * })
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 */
export function createWideEventMiddleware(options: WideEventMiddlewareOptions = {}) {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	return async function wideEventMiddleware(request: NextRequest) {
		// Skip configured paths
		const pathname = request.nextUrl.pathname
		const skipPaths = mergedOptions.skipPaths ?? DEFAULT_OPTIONS.skipPaths ?? []

		if (skipPaths.some((p) => pathname.startsWith(p))) {
			return NextResponse.next()
		}

		const logger = getOrCreateLogger(mergedOptions)
		const startTime = performance.now()

		// Extract or generate correlation context
		const requestIdHeader =
			mergedOptions.requestIdHeader ??
			DEFAULT_OPTIONS.requestIdHeader ??
			CORRELATION_HEADERS.REQUEST_ID
		const existingRequestId = request.headers.get(requestIdHeader) ?? undefined
		const traceparent = request.headers.get(CORRELATION_HEADERS.TRACEPARENT)
		const parsed = traceparent ? parseTraceparent(traceparent) : null

		const ctx = createCorrelationContext({
			requestId: existingRequestId,
			traceId: parsed?.traceId,
			spanId: parsed?.spanId,
		})

		// Create wide event for this request
		const event = createWideEvent({
			type: 'http.request',
			context: {
				requestId: ctx.requestId,
				traceId: ctx.traceId,
				spanId: ctx.spanId,
			},
		})

		// Populate initial HTTP context
		event.merge('http', {
			method: request.method,
			path: pathname,
			search: request.nextUrl.search || undefined,
			host: request.headers.get('host'),
		})

		// Add user context from headers if available
		const userAgent = request.headers.get('user-agent')
		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
			request.headers.get('x-real-ip')

		if (userAgent || ip) {
			event.merge('client', {
				userAgent: userAgent?.slice(0, 200),
				ip,
			})
		}

		// Create request context
		const eventContext: WideEventRequestContext = {
			event,
			startTime,
		}

		// Run middleware with wide event context
		// These are guaranteed to exist from createCorrelationContext
		const requestId = ctx.requestId ?? ''
		const traceId = ctx.traceId ?? ''
		const spanId = ctx.spanId ?? ''

		return runWithWideEvent(eventContext, () => {
			// Create new headers with correlation IDs
			const requestHeaders = new Headers(request.headers)
			requestHeaders.set(CORRELATION_HEADERS.REQUEST_ID, requestId)
			requestHeaders.set(CORRELATION_HEADERS.TRACE_ID, traceId)
			requestHeaders.set(CORRELATION_HEADERS.SPAN_ID, spanId)
			requestHeaders.set(CORRELATION_HEADERS.TRACEPARENT, createTraceparent(traceId, spanId))

			// Create response with updated headers
			const response = NextResponse.next({
				request: {
					headers: requestHeaders,
				},
			})

			// Add correlation headers to response
			response.headers.set(CORRELATION_HEADERS.REQUEST_ID, requestId)
			response.headers.set(CORRELATION_HEADERS.TRACE_ID, traceId)

			// Complete the wide event
			const duration = performance.now() - startTime

			// Add final timing
			event.set('performance', 'duration_ms', duration)

			// End and emit the wide event
			const completedEvent = event.end({
				status: 'success',
				level: 'info',
			})

			// Emit through the logger (applies tail sampling if configured)
			logger.emitWideEvent(completedEvent)

			return response
		})
	}
}

/**
 * Pre-configured wide event middleware for direct export
 *
 * @example
 * ```typescript
 * // middleware.ts
 * export { wideEventMiddleware as middleware } from '@vestig/next/wide-events'
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 */
export const wideEventMiddleware = createWideEventMiddleware()
