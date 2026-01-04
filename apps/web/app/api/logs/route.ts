import { createLogStream, getSubscriberCount, logStore } from '@/lib/demo-transport'
import { API_LIMITS } from '@/lib/constants'
import { withVestig } from '@vestig/next'

/**
 * GET /api/logs - Server-Sent Events stream for real-time logs
 *
 * This endpoint creates an SSE connection that streams log entries
 * to connected clients in real-time for the demo log viewer.
 *
 * Note: Client logs are now sent to /api/vestig via @vestig/next.
 * This endpoint is only for the SSE stream to the log viewer UI.
 */
export async function GET(request: Request) {
	const subscriberCount = getSubscriberCount()

	// Check subscriber limit to prevent resource exhaustion
	if (subscriberCount >= API_LIMITS.MAX_SSE_SUBSCRIBERS) {
		console.warn(
			`[api:logs] SSE subscriber limit reached: ${subscriberCount}/${API_LIMITS.MAX_SSE_SUBSCRIBERS}`,
		)
		return new Response(
			JSON.stringify({
				error: 'Too many connections',
				code: 'MAX_SUBSCRIBERS_REACHED',
			}),
			{
				status: 503,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

	console.info(`[api:logs] SSE connection opened. Subscribers: ${subscriberCount + 1}`)

	try {
		const stream = createLogStream()

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache, no-transform',
				Connection: 'keep-alive',
				'X-Accel-Buffering': 'no', // Disable nginx buffering
			},
		})
	} catch (error) {
		console.error('[api:logs] Failed to create SSE stream:', error)

		return new Response(
			JSON.stringify({
				error: 'Failed to create stream',
				code: 'STREAM_ERROR',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}

/**
 * DELETE /api/logs - Clear all stored logs
 *
 * Useful for demo purposes to reset the log viewer
 */
export const DELETE = withVestig(
	async (request, { log, ctx }) => {
		const logCount = logStore.getSize()

		try {
			logStore.clear()

			log.info('Logs cleared', {
				clearedCount: logCount,
				userAgent: request.headers.get('user-agent')?.slice(0, 100),
			})

			return Response.json({
				success: true,
				message: 'Logs cleared',
				clearedCount: logCount,
				requestId: ctx.requestId,
			})
		} catch (error) {
			log.error('Failed to clear logs', {
				error: error instanceof Error ? error.message : String(error),
			})

			return Response.json(
				{
					success: false,
					error: 'Failed to clear logs',
					code: 'CLEAR_ERROR',
				},
				{ status: 500 },
			)
		}
	},
	{ namespace: 'api:logs' },
)
