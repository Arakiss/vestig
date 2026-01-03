import { NextResponse } from 'next/server'
import { withVestig } from '@vestig/next'

/**
 * Web Vitals metrics endpoint
 *
 * Receives performance metrics from the client and logs them
 * using Vestig for observability. In production, you might
 * forward these to an analytics service like Datadog or New Relic.
 */
export const POST = withVestig(
	async (request, { log, ctx, timing }) => {
		try {
			// Parse and validate request body
			const body = await request.json()

			// Validate metrics structure
			if (!body || typeof body !== 'object') {
				log.warn('Invalid metrics payload received', {
					contentType: request.headers.get('content-type'),
				})
				return NextResponse.json(
					{ error: 'Invalid payload', code: 'INVALID_PAYLOAD' },
					{ status: 400 },
				)
			}

			const { metrics, context } = body

			// Log received metrics with context
			log.info('Web Vitals metrics received', {
				metricsCount: Array.isArray(metrics) ? metrics.length : 1,
				route: context?.route || 'unknown',
				userAgent: request.headers.get('user-agent')?.slice(0, 100),
			})

			// Log individual metrics at debug level for detailed analysis
			if (Array.isArray(metrics)) {
				for (const metric of metrics) {
					log.debug('Metric received', {
						name: metric.name,
						value: metric.value,
						rating: metric.rating,
						route: context?.route,
					})
				}
			}

			// In production, forward to your analytics service:
			// await sendToAnalytics(metrics)

			log.debug('Metrics processed successfully', {
				durationMs: timing.elapsed().toFixed(2),
			})

			return NextResponse.json({
				success: true,
				requestId: ctx.requestId,
				processedAt: new Date().toISOString(),
			})
		} catch (error) {
			// Determine error type for better diagnostics
			const isParseError = error instanceof SyntaxError
			const errorCode = isParseError ? 'PARSE_ERROR' : 'INTERNAL_ERROR'
			const statusCode = isParseError ? 400 : 500

			log.error('Failed to process metrics', {
				error: error instanceof Error ? error.message : String(error),
				errorCode,
				durationMs: timing.elapsed().toFixed(2),
				stack: error instanceof Error ? error.stack : undefined,
			})

			return NextResponse.json(
				{
					error: isParseError ? 'Invalid JSON payload' : 'Failed to process metrics',
					code: errorCode,
					requestId: ctx.requestId,
				},
				{ status: statusCode },
			)
		}
	},
	{ namespace: 'api:metrics' },
)

export const dynamic = 'force-dynamic'
