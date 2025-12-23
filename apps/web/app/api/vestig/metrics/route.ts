import { NextResponse } from 'next/server'

/**
 * Endpoint for receiving Web Vitals metrics
 * In production, you might forward these to an analytics service
 */
export async function POST(request: Request) {
	try {
		const metrics = await request.json()

		// In development, just log to console
		if (process.env.NODE_ENV === 'development') {
			console.log('[vestig-metrics] Received:', JSON.stringify(metrics, null, 2))
		}

		// In production, forward to your analytics service:
		// await sendToAnalytics(metrics)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('[vestig-metrics] Failed to process metrics:', error)
		return NextResponse.json({ error: 'Failed to process metrics' }, { status: 500 })
	}
}

export const dynamic = 'force-dynamic'
