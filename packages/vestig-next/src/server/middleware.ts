import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	type LogLevel,
	type Logger,
	type SanitizePreset,
	createCorrelationContext,
	createLogger,
	createTraceparent,
	parseTraceparent,
} from 'vestig'
import { CORRELATION_HEADERS } from '../utils/headers'
import { createRequestTiming, formatDuration } from '../utils/timing'

export interface MiddlewareOptions {
	/** Log level for the middleware logger */
	level?: LogLevel
	/** Enable/disable logging */
	enabled?: boolean
	/** PII sanitization preset */
	sanitize?: SanitizePreset
	/** Namespace for middleware logs */
	namespace?: string
	/** Paths to skip (prefix matching) */
	skipPaths?: string[]
	/** Custom header name for request ID */
	requestIdHeader?: string
	/** Enable request/response timing logs */
	timing?: boolean
	/** Log level for incoming requests */
	requestLogLevel?: LogLevel
	/** Log level for outgoing responses */
	responseLogLevel?: LogLevel
	/** Use structured JSON output */
	structured?: boolean
}

// Default options
const DEFAULT_OPTIONS: MiddlewareOptions = {
	level: 'info',
	enabled: true,
	sanitize: 'default',
	namespace: 'middleware',
	skipPaths: ['/_next', '/favicon.ico', '/api/vestig'],
	requestIdHeader: CORRELATION_HEADERS.REQUEST_ID,
	timing: true,
	requestLogLevel: 'info',
	responseLogLevel: 'info',
	structured: true,
}

// Cached logger per middleware instance
const loggerCache = new WeakMap<MiddlewareOptions, Logger>()

function getOrCreateLogger(options: MiddlewareOptions): Logger {
	const cached = loggerCache.get(options)
	if (cached) return cached

	const logger = createLogger({
		level: options.level,
		enabled: options.enabled,
		sanitize: options.sanitize,
		namespace: options.namespace,
		structured: options.structured,
	})

	loggerCache.set(options, logger)
	return logger
}

/**
 * Create vestig middleware with custom configuration
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createVestigMiddleware } from '@vestig/next/middleware'
 *
 * export const middleware = createVestigMiddleware({
 *   skipPaths: ['/health', '/metrics'],
 * })
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 */
export function createVestigMiddleware(options: MiddlewareOptions = {}) {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	return function vestigMiddleware(request: NextRequest) {
		// Skip configured paths
		const pathname = request.nextUrl.pathname
		const skipPaths = mergedOptions.skipPaths!

		if (skipPaths.some((p) => pathname.startsWith(p))) {
			return NextResponse.next()
		}

		const logger = getOrCreateLogger(mergedOptions)
		const log = logger.child('request')
		const timing = createRequestTiming()

		// Extract or generate correlation context
		const requestIdHeader = mergedOptions.requestIdHeader!
		const existingRequestId = request.headers.get(requestIdHeader) ?? undefined
		const traceparent = request.headers.get(CORRELATION_HEADERS.TRACEPARENT)
		const parsed = traceparent ? parseTraceparent(traceparent) : null

		const ctx = createCorrelationContext({
			requestId: existingRequestId,
			traceId: parsed?.traceId,
			spanId: parsed?.spanId,
		})

		// Log incoming request
		const requestLogLevel = mergedOptions.requestLogLevel!
		log[requestLogLevel]('Request received', {
			method: request.method,
			path: pathname,
			search: request.nextUrl.search || undefined,
			userAgent: request.headers.get('user-agent')?.slice(0, 100),
			ip:
				request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
				request.headers.get('x-real-ip'),
			requestId: ctx.requestId,
			traceId: ctx.traceId,
		})

		// Create new headers with correlation IDs
		const requestHeaders = new Headers(request.headers)
		requestHeaders.set(CORRELATION_HEADERS.REQUEST_ID, ctx.requestId!)
		requestHeaders.set(CORRELATION_HEADERS.TRACE_ID, ctx.traceId!)
		requestHeaders.set(CORRELATION_HEADERS.SPAN_ID, ctx.spanId!)
		requestHeaders.set(
			CORRELATION_HEADERS.TRACEPARENT,
			createTraceparent(ctx.traceId!, ctx.spanId!),
		)

		// Create response with updated headers
		const response = NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		})

		// Add correlation headers to response
		response.headers.set(CORRELATION_HEADERS.REQUEST_ID, ctx.requestId!)
		response.headers.set(CORRELATION_HEADERS.TRACE_ID, ctx.traceId!)

		// Log response with timing if enabled
		if (mergedOptions.timing) {
			const duration = timing.complete()
			const responseLogLevel = mergedOptions.responseLogLevel!
			log[responseLogLevel]('Response sent', {
				method: request.method,
				path: pathname,
				duration: formatDuration(duration),
				durationMs: duration,
				requestId: ctx.requestId,
			})
		}

		return response
	}
}

/**
 * Pre-configured vestig middleware for direct export (deprecated, use proxy instead)
 *
 * @example
 * ```typescript
 * // middleware.ts (deprecated in Next.js 16+)
 * export { vestigMiddleware as middleware } from '@vestig/next/middleware'
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 * @deprecated Use createVestigProxy for Next.js 16+
 */
export const vestigMiddleware = createVestigMiddleware()

// Alias for backwards compatibility
export type { MiddlewareOptions as ProxyOptions }

/**
 * Create vestig proxy for Next.js 16+ (replaces middleware)
 *
 * In Next.js 16, middleware.ts was renamed to proxy.ts and runs on Node.js runtime
 * instead of Edge runtime.
 *
 * @example
 * ```typescript
 * // proxy.ts (Next.js 16+)
 * import { createVestigProxy } from '@vestig/next/middleware'
 *
 * export const proxy = createVestigProxy({
 *   skipPaths: ['/health', '/metrics'],
 * })
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 */
export function createVestigProxy(options: MiddlewareOptions = {}) {
	// Proxy uses the same implementation as middleware
	// but is exported with the correct name for proxy.ts
	return createVestigMiddleware(options)
}

/**
 * Pre-configured vestig proxy for direct export
 *
 * @example
 * ```typescript
 * // proxy.ts (Next.js 16+)
 * export { vestigProxy as proxy } from '@vestig/next/middleware'
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 */
export const vestigProxy = createVestigProxy()

/**
 * Helper to create proxy/middleware config matcher
 */
export function createProxyMatcher(
	options: {
		include?: string[]
		exclude?: string[]
	} = {},
) {
	const include = options.include ?? ['/((?!_next/static|_next/image|favicon.ico).*)']
	return {
		matcher: include,
	}
}

/**
 * @deprecated Use createProxyMatcher instead
 */
export const createMiddlewareMatcher = createProxyMatcher
