/**
 * @vestig/next/db - Database Query Logging
 *
 * This module provides database query logging integrations
 * for Prisma and Drizzle ORMs.
 *
 * @example Prisma Integration
 * ```typescript
 * // lib/db.ts
 * import { PrismaClient } from '@prisma/client'
 * import { withVestigPrisma, createPrismaLogConfig } from '@vestig/next/db'
 * import { createLogger } from 'vestig'
 *
 * const logger = createLogger({ namespace: 'app' })
 *
 * const prisma = withVestigPrisma(
 *   new PrismaClient({ log: createPrismaLogConfig() }),
 *   { logger, slowQueryThreshold: 100 }
 * )
 *
 * export { prisma }
 * ```
 *
 * @example Drizzle Integration
 * ```typescript
 * // lib/db.ts
 * import { drizzle } from 'drizzle-orm/postgres-js'
 * import postgres from 'postgres'
 * import { createVestigDrizzleLogger } from '@vestig/next/db'
 * import { createLogger } from 'vestig'
 *
 * const logger = createLogger({ namespace: 'app' })
 * const client = postgres(process.env.DATABASE_URL!)
 *
 * export const db = drizzle(client, {
 *   logger: createVestigDrizzleLogger({
 *     logger,
 *     slowQueryThreshold: 100,
 *   }),
 * })
 * ```
 *
 * @packageDocumentation
 */

// Prisma integration
export {
	withVestigPrisma,
	createPrismaQueryHandler,
	createPrismaLogConfig,
	type VestigPrismaOptions,
} from './prisma'

// Drizzle integration
export {
	createVestigDrizzleLogger,
	createDrizzleQueryLogger,
	measureQuery,
	type VestigDrizzleLoggerOptions,
} from './drizzle'

// PostgreSQL driver instrumentation
export {
	instrumentPostgres,
	isPostgresInstrumented,
	type PostgresInstrumentConfig,
} from './postgres'

// Core utilities
export {
	formatDuration,
	createQueryLogEntry,
	logQuery,
	mergeConfig,
	extractAllTableNames,
} from './query-logger'

// Types
export type {
	QueryLogEntry,
	DbLoggerConfig,
	DatabaseInstrumentConfig,
	PrismaQueryEvent,
	PrismaLogEvent,
	DrizzleLogger,
} from './types'
