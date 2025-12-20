import { type LogEntry, type Logger, createLogger } from 'vestig'
import { loadConfig } from '../config/loader'

/**
 * In-memory log store for SSE streaming (development only)
 */
class LogStore {
	private logs: LogEntry[] = []
	private subscribers = new Set<(entry: LogEntry) => void>()
	private maxLogs: number

	constructor(maxLogs = 500) {
		this.maxLogs = maxLogs
	}

	/**
	 * Add a single log entry
	 */
	add(entry: LogEntry): void {
		// Ensure entry has an ID
		const entryWithId = {
			...entry,
			id: (entry as LogEntry & { id?: string }).id ?? crypto.randomUUID(),
		}

		this.logs.push(entryWithId)

		// Trim if over limit
		if (this.logs.length > this.maxLogs) {
			this.logs.shift()
		}

		// Notify subscribers
		for (const callback of this.subscribers) {
			try {
				callback(entryWithId)
			} catch {
				// Subscriber may have errored, ignore
			}
		}
	}

	/**
	 * Add multiple log entries
	 */
	addBatch(entries: LogEntry[]): void {
		for (const entry of entries) {
			this.add(entry)
		}
	}

	/**
	 * Subscribe to new log entries
	 */
	subscribe(callback: (entry: LogEntry) => void): () => void {
		this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}

	/**
	 * Get recent log entries
	 */
	getRecent(count = 50): LogEntry[] {
		return this.logs.slice(-count)
	}

	/**
	 * Clear all logs
	 */
	clear(): void {
		this.logs = []
	}

	/**
	 * Get total count
	 */
	get count(): number {
		return this.logs.length
	}
}

// Singleton log store
let logStore: LogStore | null = null

function getLogStore(maxLogs?: number): LogStore {
	if (!logStore) {
		logStore = new LogStore(maxLogs)
	}
	return logStore
}

/**
 * Options for createVestigHandler
 */
export interface VestigHandlerOptions {
	/** Max logs to keep in memory (default: 500) */
	maxLogs?: number
	/** Enable SSE streaming (default: development only) */
	enableSSE?: boolean
	/** Callback for custom log processing */
	onLog?: (entry: LogEntry) => void | Promise<void>
}

/**
 * Create vestig API route handlers
 *
 * Provides:
 * - GET: SSE stream for real-time log viewing (dev only)
 * - POST: Receive logs from client
 * - DELETE: Clear log store (dev only)
 *
 * @example
 * ```typescript
 * // app/api/vestig/route.ts
 * import { createVestigHandler } from '@vestig/next/route'
 *
 * export const { GET, POST, DELETE } = createVestigHandler()
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * export const { GET, POST, DELETE } = createVestigHandler({
 *   maxLogs: 1000,
 *   onLog: async (entry) => {
 *     // Send to external logging service
 *     await sendToDatadog(entry)
 *   },
 * })
 * ```
 */
export function createVestigHandler(options: VestigHandlerOptions = {}) {
	const store = getLogStore(options.maxLogs)

	/**
	 * GET - SSE stream for real-time log viewing (development only)
	 */
	async function GET(request: Request): Promise<Response> {
		const config = await loadConfig()
		const enableSSE = options.enableSSE ?? config.next?.devTools?.enabled ?? false

		if (!enableSSE) {
			return Response.json({ error: 'SSE streaming is disabled in production' }, { status: 403 })
		}

		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder()

				// Send recent logs first
				const recent = store.getRecent()
				for (const entry of recent) {
					try {
						controller.enqueue(encoder.encode(`data: ${JSON.stringify(entry)}\n\n`))
					} catch {
						// Stream may be closed
					}
				}

				// Subscribe to new logs
				const unsubscribe = store.subscribe((entry) => {
					try {
						controller.enqueue(encoder.encode(`data: ${JSON.stringify(entry)}\n\n`))
					} catch {
						// Stream closed, cleanup
						unsubscribe()
					}
				})

				// Handle client disconnect via abort signal
				request.signal.addEventListener('abort', () => {
					unsubscribe()
					try {
						controller.close()
					} catch {
						// Already closed
					}
				})
			},
		})

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
	 * POST - Receive logs from client
	 */
	async function POST(request: Request): Promise<Response> {
		try {
			const body = await request.json()

			// Support single entry or batch
			const entries: LogEntry[] = Array.isArray(body.entries)
				? body.entries
				: body.entry
					? [body.entry]
					: [body]

			// Validate entries
			for (const entry of entries) {
				if (!entry.timestamp || !entry.level || !entry.message) {
					return Response.json(
						{
							error: 'Invalid log entry',
							details: 'Each entry must have timestamp, level, and message',
						},
						{ status: 400 },
					)
				}
			}

			// Add to store
			store.addBatch(entries)

			// Call custom handler if provided
			if (options.onLog) {
				for (const entry of entries) {
					try {
						await options.onLog(entry)
					} catch (error) {
						console.warn('[vestig] onLog handler error:', error)
					}
				}
			}

			// Also log to server if configured (re-emit client logs)
			const config = await loadConfig()
			if (config.next?.server) {
				const serverLogger = createLogger({
					level: config.level,
					enabled: config.enabled,
					sanitize: config.sanitize,
					structured: config.next.server.structured,
					namespace: 'client', // Mark as from client
				})

				for (const entry of entries) {
					const method = entry.level as keyof Logger
					if (typeof serverLogger[method] === 'function') {
						;(serverLogger[method] as (msg: string, meta?: unknown) => void)(
							entry.message,
							entry.metadata,
						)
					}
				}
			}

			return Response.json({
				success: true,
				count: entries.length,
			})
		} catch (error) {
			return Response.json(
				{
					error: 'Invalid request',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 400 },
			)
		}
	}

	/**
	 * DELETE - Clear log store (development only)
	 */
	async function DELETE(): Promise<Response> {
		const config = await loadConfig()
		const enableDelete = config.next?.devTools?.enabled ?? false

		if (!enableDelete) {
			return Response.json({ error: 'Log clearing is disabled in production' }, { status: 403 })
		}

		store.clear()
		return Response.json({ success: true })
	}

	return { GET, POST, DELETE }
}

/**
 * Pre-configured route handlers for direct export
 *
 * @example
 * ```typescript
 * // app/api/vestig/route.ts
 * export { GET, POST, DELETE } from '@vestig/next/route'
 * ```
 */
export const { GET, POST, DELETE } = createVestigHandler()
