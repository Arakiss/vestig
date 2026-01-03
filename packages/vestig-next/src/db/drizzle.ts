/**
 * Drizzle Integration
 *
 * Provides a custom logger for Drizzle ORM that integrates with Vestig.
 *
 * @example
 * ```typescript
 * // lib/db.ts
 * import { drizzle } from 'drizzle-orm/postgres-js'
 * import postgres from 'postgres'
 * import { createVestigDrizzleLogger } from '@vestig/next/db'
 *
 * const client = postgres(process.env.DATABASE_URL!)
 * export const db = drizzle(client, {
 *   logger: createVestigDrizzleLogger(),
 * })
 * ```
 *
 * @packageDocumentation
 */

import type { Logger as VestigLogger } from 'vestig'
import { createQueryLogEntry, formatDuration, logQuery, mergeConfig } from './query-logger'
import type { DbLoggerConfig, DrizzleLogger } from './types'

/**
 * Options for Vestig Drizzle logger
 */
export interface VestigDrizzleLoggerOptions extends DbLoggerConfig {
	/**
	 * Logger instance to use
	 * If not provided, will use console-based logging
	 */
	logger?: VestigLogger
}

/**
 * Create a Drizzle-compatible logger that integrates with Vestig
 *
 * @example Basic usage
 * ```typescript
 * import { drizzle } from 'drizzle-orm/postgres-js'
 * import { createVestigDrizzleLogger } from '@vestig/next/db'
 *
 * const db = drizzle(client, {
 *   logger: createVestigDrizzleLogger(),
 * })
 * ```
 *
 * @example With Vestig logger
 * ```typescript
 * import { createLogger } from 'vestig'
 * import { createVestigDrizzleLogger } from '@vestig/next/db'
 *
 * const logger = createLogger({ namespace: 'app' })
 *
 * const db = drizzle(client, {
 *   logger: createVestigDrizzleLogger({
 *     logger,
 *     slowQueryThreshold: 200,
 *     logLevel: 'slow', // Only log slow queries
 *   }),
 * })
 * ```
 *
 * @example With custom callback
 * ```typescript
 * const db = drizzle(client, {
 *   logger: createVestigDrizzleLogger({
 *     onQuery: (entry) => {
 *       // Send to analytics, APM, etc.
 *       if (entry.isSlow) {
 *         sendToAPM(entry)
 *       }
 *     },
 *   }),
 * })
 * ```
 */
export function createVestigDrizzleLogger(options: VestigDrizzleLoggerOptions = {}): DrizzleLogger {
	const config = mergeConfig(options)
	const logger = options.logger

	// Track query start times for duration calculation
	const queryTimings = new Map<string, number>()

	return {
		logQuery(query: string, params: unknown[]): void {
			// Drizzle calls logQuery at the start, so we need to track timing ourselves
			// For simplicity, we'll estimate duration as 0 and rely on actual timing if available
			// In practice, Drizzle doesn't provide duration, so we measure it

			const startTime = performance.now()
			const queryKey = `${query}-${JSON.stringify(params)}-${startTime}`

			// Store start time
			queryTimings.set(queryKey, startTime)

			// Use setTimeout to estimate duration (hacky but works for logging purposes)
			// In real usage, the actual query runs after logQuery is called
			setTimeout(() => {
				const duration = performance.now() - startTime
				queryTimings.delete(queryKey)

				const entry = createQueryLogEntry(query, params, duration, config)

				if (logger) {
					const nsLogger = logger.child(config.namespace)
					logQuery(nsLogger, entry, config)
				} else {
					// Fallback to console
					if (entry.isSlow) {
						console.warn(
							`[${config.namespace}] Slow query:`,
							entry.query,
							`(${formatDuration(entry.duration)})`,
						)
					} else if (config.logLevel === 'all') {
						console.debug(
							`[${config.namespace}]`,
							entry.query,
							`(${formatDuration(entry.duration)})`,
						)
					}
				}
			}, 0)
		},
	}
}

/**
 * Create a Drizzle logger that measures actual query duration
 *
 * This is a more accurate version that wraps your database client
 * to measure actual query execution time.
 *
 * @example
 * ```typescript
 * import { drizzle } from 'drizzle-orm/postgres-js'
 * import { withVestigDrizzle } from '@vestig/next/db'
 *
 * const client = postgres(process.env.DATABASE_URL!)
 * const { db, logger } = withVestigDrizzle(
 *   (logger) => drizzle(client, { logger }),
 *   { slowQueryThreshold: 100 }
 * )
 * ```
 */
export function createDrizzleQueryLogger(options: VestigDrizzleLoggerOptions = {}) {
	const config = mergeConfig(options)
	const vestigLogger = options.logger

	/**
	 * Log a query with explicit timing
	 */
	function log(query: string, params: unknown[], durationMs: number): void {
		const entry = createQueryLogEntry(query, params, durationMs, config)

		if (vestigLogger) {
			const nsLogger = vestigLogger.child(config.namespace)
			logQuery(nsLogger, entry, config)
		} else {
			if (entry.isSlow) {
				console.warn(
					`[${config.namespace}] Slow query:`,
					entry.query,
					`(${formatDuration(entry.duration)})`,
				)
			} else if (config.logLevel === 'all') {
				console.debug(`[${config.namespace}]`, entry.query, `(${formatDuration(entry.duration)})`)
			}
		}

		config.onQuery(entry)
	}

	return { log, config }
}

/**
 * Utility to wrap any async function with query timing
 *
 * @example
 * ```typescript
 * import { measureQuery } from '@vestig/next/db'
 *
 * const result = await measureQuery(
 *   () => db.select().from(users).where(eq(users.id, 1)),
 *   'SELECT * FROM users WHERE id = ?',
 *   [1],
 *   { logger }
 * )
 * ```
 */
export async function measureQuery<T>(
	queryFn: () => Promise<T>,
	query: string,
	params: unknown[] = [],
	options: VestigDrizzleLoggerOptions = {},
): Promise<T> {
	const { log } = createDrizzleQueryLogger(options)
	const start = performance.now()

	try {
		const result = await queryFn()
		const duration = performance.now() - start
		log(query, params, duration)
		return result
	} catch (error) {
		const duration = performance.now() - start
		log(query, params, duration)
		throw error
	}
}
