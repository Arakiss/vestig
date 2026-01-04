import type { DedupeConfig, LogLevel } from '../types'

/**
 * Default dedupe configuration
 */
const DEFAULTS: Required<DedupeConfig> = {
	enabled: true,
	windowMs: 1000,
	maxSize: 1000,
	includeLevel: true,
	includeNamespace: true,
}

/**
 * Tracked log entry for deduplication
 */
interface TrackedLog {
	/** First occurrence timestamp */
	firstSeen: number
	/** Total count including first */
	count: number
	/** Log level for the summary */
	level: LogLevel
}

/**
 * Result of checking if a log should be suppressed
 */
export interface DedupeResult {
	/** Whether this log should be suppressed */
	suppressed: boolean
	/** If not suppressed and is a summary, how many were suppressed */
	suppressedCount?: number
	/** If this is a summary log, the original key */
	isFlush?: boolean
}

/**
 * Deduplicator for suppressing repeated identical log messages
 *
 * Uses an LRU-like eviction strategy to bound memory usage while
 * tracking duplicate logs within a time window.
 */
export class Deduplicator {
	private readonly config: Required<DedupeConfig>
	private readonly tracked: Map<string, TrackedLog> = new Map()
	private cleanupTimer: ReturnType<typeof setInterval> | null = null

	constructor(config?: DedupeConfig) {
		this.config = {
			...DEFAULTS,
			...config,
			enabled: config?.enabled ?? DEFAULTS.enabled,
		}

		// Start cleanup timer
		if (this.config.enabled) {
			this.startCleanup()
		}
	}

	/**
	 * Check if a log should be suppressed
	 *
	 * @param message - The log message
	 * @param level - The log level
	 * @param namespace - Optional namespace
	 * @returns Whether the log should be suppressed
	 */
	shouldSuppress(message: string, level: LogLevel, namespace?: string): DedupeResult {
		if (!this.config.enabled) {
			return { suppressed: false }
		}

		const key = this.createKey(message, level, namespace)
		const now = Date.now()
		const existing = this.tracked.get(key)

		if (existing) {
			// Check if still within window
			if (now - existing.firstSeen < this.config.windowMs) {
				existing.count++
				return { suppressed: true }
			}

			// Window expired - emit summary and reset
			const suppressedCount = existing.count - 1 // Exclude the first one
			this.tracked.delete(key)

			// Start tracking this new occurrence
			this.track(key, now, level)

			if (suppressedCount > 0) {
				return { suppressed: false, suppressedCount, isFlush: true }
			}
			return { suppressed: false }
		}

		// First occurrence - track it
		this.track(key, now, level)
		return { suppressed: false }
	}

	/**
	 * Get counts of all currently tracked logs that were suppressed
	 *
	 * Useful for flushing all pending summaries on shutdown.
	 */
	getPendingSummaries(): Array<{ key: string; count: number; level: LogLevel }> {
		const summaries: Array<{ key: string; count: number; level: LogLevel }> = []

		for (const [key, entry] of this.tracked) {
			if (entry.count > 1) {
				summaries.push({
					key,
					count: entry.count - 1, // Exclude the first logged one
					level: entry.level,
				})
			}
		}

		return summaries
	}

	/**
	 * Clear all tracked entries
	 */
	clear(): void {
		this.tracked.clear()
	}

	/**
	 * Stop the cleanup timer
	 */
	destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer)
			this.cleanupTimer = null
		}
		this.tracked.clear()
	}

	/**
	 * Create a deduplication key from message and optional context
	 */
	private createKey(message: string, level: LogLevel, namespace?: string): string {
		const parts: string[] = [message]

		if (this.config.includeLevel) {
			parts.unshift(level)
		}

		if (this.config.includeNamespace && namespace) {
			parts.unshift(namespace)
		}

		return parts.join('|')
	}

	/**
	 * Track a new log entry
	 */
	private track(key: string, timestamp: number, level: LogLevel): void {
		// Evict oldest if at capacity
		if (this.tracked.size >= this.config.maxSize) {
			this.evictOldest()
		}

		this.tracked.set(key, {
			firstSeen: timestamp,
			count: 1,
			level,
		})
	}

	/**
	 * Evict the oldest entry (LRU-style)
	 */
	private evictOldest(): void {
		// Map maintains insertion order, so first key is oldest
		const firstKey = this.tracked.keys().next().value
		if (firstKey !== undefined) {
			this.tracked.delete(firstKey)
		}
	}

	/**
	 * Start periodic cleanup of expired entries
	 *
	 * Only cleans up entries that have count=1 (no pending summary).
	 * Entries with pending summaries are kept until the next log of the same
	 * type, which will emit the summary and reset tracking.
	 */
	private startCleanup(): void {
		// Clean up every windowMs (but wait 2x windowMs for first run to avoid edge cases)
		this.cleanupTimer = setInterval(() => {
			const now = Date.now()
			const expireTime = now - this.config.windowMs

			for (const [key, entry] of this.tracked) {
				// Only clean up if expired AND no pending summary
				if (entry.firstSeen < expireTime && entry.count === 1) {
					this.tracked.delete(key)
				}
			}
		}, this.config.windowMs * 2) // Run less frequently to reduce timing issues

		// Unref so it doesn't keep the process alive
		if (typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
			this.cleanupTimer.unref()
		}
	}

	/**
	 * Get statistics about the deduplicator
	 */
	getStats(): { tracked: number; maxSize: number; windowMs: number } {
		return {
			tracked: this.tracked.size,
			maxSize: this.config.maxSize,
			windowMs: this.config.windowMs,
		}
	}
}
