/**
 * Vestig Proxy for automatic request correlation (Next.js 16+)
 *
 * This proxy automatically:
 * - Generates/extracts requestId, traceId, spanId
 * - Adds correlation headers to all requests
 * - Logs request/response with timing
 */
import { createVestigProxy } from '@vestig/next/middleware'

export const proxy = createVestigProxy({
	level: 'trace',
	skipPaths: ['/_next', '/favicon.ico', '/api/vestig', '/api/logs'],
	timing: true,
})

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!_next/static|_next/image|favicon.ico).*)',
	],
}
