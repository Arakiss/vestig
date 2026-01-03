/**
 * Prisma Integration
 *
 * Provides logging middleware and utilities for Prisma ORM.
 *
 * @example
 * ```typescript
 * // lib/db.ts
 * import { PrismaClient } from '@prisma/client'
 * import { withVestigPrisma } from '@vestig/next/db'
 *
 * const prisma = withVestigPrisma(new PrismaClient())
 * export { prisma }
 * ```
 *
 * @packageDocumentation
 */

import type { Logger } from 'vestig'
import { createQueryLogEntry, logQuery, mergeConfig } from './query-logger'
import type { DbLoggerConfig, PrismaQueryEvent } from './types'

/**
 * Type for Prisma Client with query events
 * Using a minimal interface to avoid requiring @prisma/client as dependency
 */
interface PrismaClientLike {
	$on(event: 'query', callback: (e: PrismaQueryEvent) => void): void
	$on(event: 'error', callback: (e: { message: string }) => void): void
	$on(event: 'warn', callback: (e: { message: string }) => void): void
	$use?(
		middleware: (params: unknown, next: (params: unknown) => Promise<unknown>) => Promise<unknown>,
	): void
}

/**
 * Prisma query event handler options
 */
export interface VestigPrismaOptions extends DbLoggerConfig {
	/**
	 * Logger instance to use
	 * If not provided, will use console-based logging
	 */
	logger?: Logger
}

/**
 * Create a query event handler for Prisma
 *
 * @example
 * ```typescript
 * const prisma = new PrismaClient({
 *   log: [{ emit: 'event', level: 'query' }],
 * })
 *
 * prisma.$on('query', createPrismaQueryHandler({
 *   logger: myLogger,
 *   slowQueryThreshold: 200,
 * }))
 * ```
 */
export function createPrismaQueryHandler(options: VestigPrismaOptions = {}) {
	const config = mergeConfig(options)
	const logger = options.logger

	return (event: PrismaQueryEvent): void => {
		// Parse params from JSON string
		let params: unknown[] | undefined
		try {
			params = JSON.parse(event.params)
		} catch {
			params = undefined
		}

		const entry = createQueryLogEntry(event.query, params, event.duration, config)

		if (logger) {
			const nsLogger = logger.child(config.namespace)
			logQuery(nsLogger, entry, config)
		} else {
			// Fallback to console
			if (entry.isSlow) {
				console.warn(`[${config.namespace}] Slow query:`, entry.query, `(${entry.duration}ms)`)
			} else if (config.logLevel === 'all') {
				console.debug(`[${config.namespace}]`, entry.query, `(${entry.duration}ms)`)
			}
		}
	}
}

/**
 * Wrap a Prisma Client with Vestig logging
 *
 * This is the recommended way to add logging to Prisma.
 * It automatically configures query events and adds logging.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client'
 * import { withVestigPrisma } from '@vestig/next/db'
 * import { createLogger } from 'vestig'
 *
 * const logger = createLogger({ namespace: 'app' })
 *
 * export const prisma = withVestigPrisma(
 *   new PrismaClient({
 *     log: [
 *       { emit: 'event', level: 'query' },
 *       { emit: 'event', level: 'error' },
 *       { emit: 'event', level: 'warn' },
 *     ],
 *   }),
 *   {
 *     logger,
 *     slowQueryThreshold: 100,
 *   }
 * )
 * ```
 *
 * @param prisma - Prisma Client instance (must have query event logging enabled)
 * @param options - Logging options
 * @returns The same Prisma Client with logging attached
 */
export function withVestigPrisma<T extends PrismaClientLike>(
	prisma: T,
	options: VestigPrismaOptions = {},
): T {
	const config = mergeConfig(options)
	const logger = options.logger

	// Subscribe to query events
	prisma.$on('query', createPrismaQueryHandler(options))

	// Subscribe to error events
	prisma.$on('error', (e) => {
		if (logger) {
			logger.child(config.namespace).error('Prisma error', { message: e.message })
		} else {
			console.error(`[${config.namespace}] Prisma error:`, e.message)
		}
	})

	// Subscribe to warn events
	prisma.$on('warn', (e) => {
		if (logger) {
			logger.child(config.namespace).warn('Prisma warning', { message: e.message })
		} else {
			console.warn(`[${config.namespace}] Prisma warning:`, e.message)
		}
	})

	return prisma
}

/**
 * Create Prisma log configuration for use with PrismaClient constructor
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client'
 * import { createPrismaLogConfig } from '@vestig/next/db'
 *
 * const prisma = new PrismaClient({
 *   log: createPrismaLogConfig(),
 * })
 * ```
 */
export function createPrismaLogConfig(options?: {
	includeInfo?: boolean
}): Array<{ emit: 'event'; level: 'query' | 'error' | 'warn' | 'info' }> {
	const config: Array<{ emit: 'event'; level: 'query' | 'error' | 'warn' | 'info' }> = [
		{ emit: 'event', level: 'query' },
		{ emit: 'event', level: 'error' },
		{ emit: 'event', level: 'warn' },
	]

	if (options?.includeInfo) {
		config.push({ emit: 'event', level: 'info' })
	}

	return config
}
