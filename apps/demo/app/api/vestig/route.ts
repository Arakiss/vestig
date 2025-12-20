import { createVestigHandler } from '@vestig/next/route'
import { logStore, type DemoLogEntry } from '@/lib/demo-transport'

/**
 * Vestig API Route Handler
 *
 * This route handles:
 * - POST: Receives logs from client components (via VestigProvider)
 * - GET: SSE stream for real-time log viewing (dev tools)
 * - DELETE: Clear logs (dev only)
 *
 * The onLog callback bridges logs to the demo's LogStore for the SSE viewer.
 */
export const { GET, POST, DELETE } = createVestigHandler({
	maxLogs: 500,
	enableSSE: true, // Force enable for demo

	// Bridge logs to the demo's LogStore for the real-time viewer
	onLog: (entry) => {
		const demoEntry: DemoLogEntry = {
			...entry,
			id: (entry as DemoLogEntry).id ?? crypto.randomUUID(),
		}
		logStore.add(demoEntry)
	},
})
