import type { LogEntry } from 'vestig'

/**
 * Extended log entry with unique ID for UI rendering
 */
export interface DemoLogEntry extends LogEntry {
	id: string
}

/**
 * In-memory log storage for SSE streaming
 * This acts as a pub/sub system for real-time log delivery to the demo log viewer
 *
 * Note: The actual logging is now handled by @vestig/next.
 * This LogStore only exists for the demo's real-time log viewer UI.
 */
class LogStore {
	private logs: DemoLogEntry[] = []
	private subscribers: Set<(entry: DemoLogEntry) => void> = new Set()
	private maxLogs = 500

	/**
	 * Add a log entry and notify all subscribers
	 */
	add(entry: DemoLogEntry): void {
		this.logs.push(entry)
		// Keep memory bounded
		if (this.logs.length > this.maxLogs) {
			this.logs.shift()
		}
		// Notify all SSE subscribers
		this.subscribers.forEach((callback) => callback(entry))
	}

	/**
	 * Subscribe to new log entries (used by SSE endpoint)
	 */
	subscribe(callback: (entry: DemoLogEntry) => void): () => void {
		this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}

	/**
	 * Get recent logs (for initial load)
	 */
	getRecent(count = 50): DemoLogEntry[] {
		return this.logs.slice(-count)
	}

	/**
	 * Clear all logs
	 */
	clear(): void {
		this.logs = []
	}

	/**
	 * Get subscriber count (for debugging)
	 */
	get subscriberCount(): number {
		return this.subscribers.size
	}
}

// Global singleton for log collection (demo-specific)
export const logStore = new LogStore()

/**
 * Create an SSE stream for log entries
 * Used by the /api/logs route to stream logs to the client
 */
export function createLogStream(): ReadableStream {
	return new ReadableStream({
		start(controller) {
			// Send recent logs first
			const recentLogs = logStore.getRecent()
			for (const entry of recentLogs) {
				const data = `data: ${JSON.stringify(entry)}\n\n`
				controller.enqueue(new TextEncoder().encode(data))
			}

			// Subscribe to new logs
			const unsubscribe = logStore.subscribe((entry) => {
				try {
					const data = `data: ${JSON.stringify(entry)}\n\n`
					controller.enqueue(new TextEncoder().encode(data))
				} catch {
					// Stream closed
					unsubscribe()
				}
			})
		},
		cancel() {
			// Stream was cancelled
		},
	})
}
