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
		// Keep memory bounded - use slice for O(1) amortized instead of shift O(n)
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs)
		}
		// Notify all SSE subscribers
		for (const callback of this.subscribers) {
			callback(entry)
		}
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
	 * Get current log count
	 */
	getSize(): number {
		return this.logs.length
	}

	/**
	 * Get subscriber count (for monitoring)
	 */
	getSubscriberCount(): number {
		return this.subscribers.size
	}
}

// Use globalThis to ensure singleton survives Next.js module isolation
// This ensures Server Components and API Routes share the same instance
const globalForLogStore = globalThis as typeof globalThis & {
	__vestigDemoLogStore?: LogStore
}

// Global singleton for log collection (demo-specific)
export const logStore = globalForLogStore.__vestigDemoLogStore ?? new LogStore()

// Persist to globalThis in development to survive HMR and module isolation
if (process.env.NODE_ENV !== 'production') {
	globalForLogStore.__vestigDemoLogStore = logStore
}

/**
 * Get current subscriber count (for connection limiting)
 */
export function getSubscriberCount(): number {
	return logStore.getSubscriberCount()
}

/**
 * Create an SSE stream for log entries
 * Used by the /api/logs route to stream logs to the client
 *
 * Wraps each log entry with { type: 'log', ...entry } to match
 * the format expected by VestigDevOverlay's useServerLogs hook.
 */
export function createLogStream(): ReadableStream {
	return new ReadableStream({
		start(controller) {
			// Send recent logs first
			const recentLogs = logStore.getRecent()
			for (const entry of recentLogs) {
				// Wrap with type: 'log' for DevOverlay compatibility
				const data = `data: ${JSON.stringify({ type: 'log', ...entry })}\n\n`
				controller.enqueue(new TextEncoder().encode(data))
			}

			// Subscribe to new logs
			const unsubscribe = logStore.subscribe((entry) => {
				try {
					// Wrap with type: 'log' for DevOverlay compatibility
					const data = `data: ${JSON.stringify({ type: 'log', ...entry })}\n\n`
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
