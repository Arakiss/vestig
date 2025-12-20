import { createLogStream, logStore } from '@/lib/demo-transport'

/**
 * GET /api/logs - Server-Sent Events stream for real-time logs
 *
 * This endpoint creates an SSE connection that streams log entries
 * to connected clients in real-time for the demo log viewer.
 *
 * Note: Client logs are now sent to /api/vestig via @vestig/next.
 * This endpoint is only for the SSE stream to the log viewer UI.
 */
export async function GET() {
	const stream = createLogStream()

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no', // Disable nginx buffering
		},
	})
}

/**
 * DELETE /api/logs - Clear all stored logs
 *
 * Useful for demo purposes to reset the log viewer
 */
export async function DELETE() {
	logStore.clear()
	return Response.json({ success: true, message: 'Logs cleared' })
}
