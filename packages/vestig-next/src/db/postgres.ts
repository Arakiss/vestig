/**
 * PostgreSQL Auto-Instrumentation
 *
 * Wraps postgres-js client for automatic span creation and metrics.
 * Provides precise timing measurement by wrapping at the driver level.
 *
 * @example
 * ```typescript
 * import postgres from 'postgres'
 * import { instrumentPostgres } from '@vestig/next/db'
 * import { drizzle } from 'drizzle-orm/postgres-js'
 *
 * const client = instrumentPostgres(postgres(DATABASE_URL), {
 *   slowQueryThreshold: 100,
 *   onQuery: (entry) => {
 *     if (entry.isSlow) metrics.recordSlowQuery(entry)
 *   }
 * })
 *
 * export const db = drizzle(client)
 * ```
 *
 * @packageDocumentation
 */

import { span } from 'vestig'
import { getDatabaseConfig } from '../instrumentation/register'
import { createQueryLogEntry, mergeConfig } from './query-logger'
import type { DbLoggerConfig } from './types'

/**
 * Configuration for postgres-js instrumentation
 */
export interface PostgresInstrumentConfig extends DbLoggerConfig {
	/**
	 * Database system name for OTLP semantic conventions
	 * @default 'postgresql'
	 */
	dbSystem?: string

	/**
	 * Database name for OTLP attributes
	 */
	dbName?: string

	/**
	 * Connection string or identifier (will be sanitized)
	 * Used for debugging, credentials are removed
	 */
	connectionName?: string
}

/**
 * Type for postgres-js Sql client
 * We use a minimal interface to avoid requiring postgres as a dependency
 */
interface PostgresSql {
	// Template literal call signature
	(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>

	// Common postgres-js methods
	unsafe: (query: string, params?: unknown[]) => Promise<unknown[]>
	begin: <T>(fn: (sql: PostgresSql) => Promise<T>) => Promise<T>
	end: (options?: { timeout?: number }) => Promise<void>
	file: (path: string, options?: unknown) => Promise<unknown[]>

	// Allow any other properties
	[key: string]: unknown
}

/**
 * Internal state for tracking instrumentation
 */
interface PostgresInstrumentState {
	config: Required<DbLoggerConfig>
	dbSystem: string
	dbName?: string
}

/**
 * Build a parameterized query string from template literal parts
 */
function buildQueryString(strings: TemplateStringsArray, values: unknown[]): string {
	let result = strings[0] ?? ''
	for (let i = 0; i < values.length; i++) {
		result += `$${i + 1}${strings[i + 1] ?? ''}`
	}
	return result
}

/**
 * Execute an instrumented query with span creation
 */
async function instrumentedQuery(
	target: PostgresSql,
	args: [TemplateStringsArray, ...unknown[]],
	state: PostgresInstrumentState,
): Promise<unknown[]> {
	const [strings, ...values] = args
	const query = buildQueryString(strings, values)

	// Create initial entry (duration will be updated after execution)
	const entry = createQueryLogEntry(query, values, 0, state.config)
	const spanName = `db.query ${entry.operation}${entry.table ? ` ${entry.table}` : ''}`

	return span(spanName, async (s) => {
		// Set OpenTelemetry semantic conventions for database
		s.setAttribute('db.system', state.dbSystem)
		s.setAttribute('db.operation', entry.operation)
		s.setAttribute('db.statement', entry.query)
		if (entry.table) s.setAttribute('db.sql.table', entry.table)
		if (state.dbName) s.setAttribute('db.name', state.dbName)

		const start = performance.now()

		try {
			// Call original postgres-js function
			const result = (await Reflect.apply(target, target, args)) as unknown[]
			const duration = performance.now() - start

			// Update entry with real duration
			entry.duration = duration
			entry.isSlow = duration >= state.config.slowQueryThreshold

			// Set span attributes
			s.setAttribute('db.duration_ms', Math.round(duration))
			if (Array.isArray(result)) {
				s.setAttribute('db.rows_affected', result.length)
			}
			if (entry.isSlow) {
				s.setAttribute('db.slow_query', true)
			}

			s.setStatus('ok')

			// Call user callback with complete entry
			state.config.onQuery(entry)

			return result
		} catch (error) {
			const duration = performance.now() - start
			entry.duration = duration

			s.setAttribute('db.duration_ms', Math.round(duration))
			s.setAttribute('db.error', true)
			s.setStatus('error', error instanceof Error ? error.message : String(error))

			// Still call callback on error
			state.config.onQuery(entry)
			throw error
		}
	})
}

/**
 * Execute an instrumented unsafe query
 */
async function instrumentedUnsafe(
	unsafeFn: PostgresSql['unsafe'],
	query: string,
	params: unknown[] | undefined,
	state: PostgresInstrumentState,
): Promise<unknown[]> {
	const entry = createQueryLogEntry(query, params ?? [], 0, state.config)
	const spanName = `db.query.unsafe ${entry.operation}${entry.table ? ` ${entry.table}` : ''}`

	return span(spanName, async (s) => {
		s.setAttribute('db.system', state.dbSystem)
		s.setAttribute('db.operation', entry.operation)
		s.setAttribute('db.statement', entry.query)
		s.setAttribute('db.query_type', 'unsafe')
		if (entry.table) s.setAttribute('db.sql.table', entry.table)
		if (state.dbName) s.setAttribute('db.name', state.dbName)

		const start = performance.now()

		try {
			const result = await unsafeFn(query, params)
			const duration = performance.now() - start

			entry.duration = duration
			entry.isSlow = duration >= state.config.slowQueryThreshold

			s.setAttribute('db.duration_ms', Math.round(duration))
			if (Array.isArray(result)) {
				s.setAttribute('db.rows_affected', result.length)
			}
			if (entry.isSlow) {
				s.setAttribute('db.slow_query', true)
			}

			s.setStatus('ok')
			state.config.onQuery(entry)

			return result
		} catch (error) {
			const duration = performance.now() - start
			entry.duration = duration

			s.setAttribute('db.duration_ms', Math.round(duration))
			s.setAttribute('db.error', true)
			s.setStatus('error', error instanceof Error ? error.message : String(error))

			state.config.onQuery(entry)
			throw error
		}
	})
}

/**
 * Create an instrumented begin (transaction) wrapper
 */
function createInstrumentedBegin(
	originalBegin: PostgresSql['begin'],
	state: PostgresInstrumentState,
): PostgresSql['begin'] {
	return async <T>(fn: (sql: PostgresSql) => Promise<T>): Promise<T> => {
		return span('db.transaction', async (s) => {
			s.setAttribute('db.system', state.dbSystem)
			s.setAttribute('db.operation', 'TRANSACTION')
			if (state.dbName) s.setAttribute('db.name', state.dbName)

			const start = performance.now()

			try {
				// Wrap the inner sql client passed to the transaction
				const result = await originalBegin(async (txSql) => {
					// Create instrumented version for transaction queries
					const instrumentedTxSql = instrumentPostgres(txSql as unknown as PostgresSql, {
						...state.config,
						dbSystem: state.dbSystem,
						dbName: state.dbName,
					})
					return fn(instrumentedTxSql as unknown as PostgresSql)
				})

				const duration = performance.now() - start
				s.setAttribute('db.duration_ms', Math.round(duration))
				s.setStatus('ok')

				return result
			} catch (error) {
				const duration = performance.now() - start
				s.setAttribute('db.duration_ms', Math.round(duration))
				s.setAttribute('db.error', true)
				s.setAttribute('db.transaction_rollback', true)
				s.setStatus('error', error instanceof Error ? error.message : String(error))
				throw error
			}
		})
	}
}

/**
 * Instrument a postgres-js client for automatic span creation and metrics
 *
 * This function wraps the postgres-js client to automatically:
 * - Create OTLP spans for each query
 * - Measure precise query duration
 * - Detect slow queries
 * - Call the onQuery callback for external metrics
 *
 * @example Basic usage
 * ```typescript
 * import postgres from 'postgres'
 * import { instrumentPostgres } from '@vestig/next/db'
 *
 * const sql = instrumentPostgres(postgres(DATABASE_URL))
 *
 * // All queries now create spans automatically
 * const users = await sql`SELECT * FROM users`
 * ```
 *
 * @example With Drizzle ORM
 * ```typescript
 * import postgres from 'postgres'
 * import { instrumentPostgres } from '@vestig/next/db'
 * import { drizzle } from 'drizzle-orm/postgres-js'
 *
 * const client = instrumentPostgres(postgres(DATABASE_URL), {
 *   slowQueryThreshold: 100,
 *   onQuery: (entry) => {
 *     // Send to your metrics system for noisy neighbor detection
 *     if (entry.isSlow) {
 *       metrics.recordSlowQuery({
 *         table: entry.table,
 *         operation: entry.operation,
 *         duration: entry.duration,
 *       })
 *     }
 *   }
 * })
 *
 * export const db = drizzle(client)
 * ```
 *
 * @example With custom database name
 * ```typescript
 * const sql = instrumentPostgres(postgres(DATABASE_URL), {
 *   dbName: 'myapp_production',
 *   dbSystem: 'postgresql',
 * })
 * ```
 *
 * @param client - The postgres-js client instance
 * @param options - Configuration options
 * @returns Instrumented postgres-js client with the same interface
 */
export function instrumentPostgres<T extends PostgresSql>(
	client: T,
	options?: PostgresInstrumentConfig,
): T {
	// Merge with global config from registerVestig() if available
	const globalConfig = getDatabaseConfig()
	const mergedOptions = { ...globalConfig, ...options }
	const config = mergeConfig(mergedOptions)
	const dbSystem = mergedOptions?.dbSystem ?? 'postgresql'
	const dbName = mergedOptions?.dbName

	const state: PostgresInstrumentState = {
		config,
		dbSystem,
		dbName,
	}

	// Create a proxy that intercepts both template literal calls and method access
	return new Proxy(client, {
		// Handle template literal calls: sql`SELECT * FROM users`
		apply(target, _thisArg, args: [TemplateStringsArray, ...unknown[]]) {
			return instrumentedQuery(target, args, state)
		},

		// Handle method access: sql.unsafe(), sql.begin(), etc.
		get(target, prop, receiver) {
			const value = Reflect.get(target, prop, receiver)

			// Wrap special postgres-js methods
			if (prop === 'unsafe' && typeof value === 'function') {
				return (query: string, params?: unknown[]) => {
					return instrumentedUnsafe(
						value.bind(target) as PostgresSql['unsafe'],
						query,
						params,
						state,
					)
				}
			}

			if (prop === 'begin' && typeof value === 'function') {
				return createInstrumentedBegin(value.bind(target) as PostgresSql['begin'], state)
			}

			// For file() - wrap with basic span
			if (prop === 'file' && typeof value === 'function') {
				return async (path: string, fileOptions?: unknown) => {
					return span(`db.file ${path}`, async (s) => {
						s.setAttribute('db.system', state.dbSystem)
						s.setAttribute('db.operation', 'FILE')
						s.setAttribute('db.file_path', path)
						if (state.dbName) s.setAttribute('db.name', state.dbName)

						const start = performance.now()

						try {
							const result = await (value as PostgresSql['file']).call(target, path, fileOptions)
							const duration = performance.now() - start

							s.setAttribute('db.duration_ms', Math.round(duration))
							s.setStatus('ok')

							return result
						} catch (error) {
							const duration = performance.now() - start
							s.setAttribute('db.duration_ms', Math.round(duration))
							s.setAttribute('db.error', true)
							s.setStatus('error', error instanceof Error ? error.message : String(error))
							throw error
						}
					})
				}
			}

			// Pass through all other properties unchanged
			return value
		},
	}) as T
}

/**
 * Check if a postgres-js client is instrumented
 *
 * Note: This is a best-effort check. Due to Proxy transparency,
 * it's not always possible to detect instrumentation.
 */
export function isPostgresInstrumented(client: unknown): boolean {
	// Proxy objects don't have a reliable way to detect them
	// This is mainly for documentation purposes
	return typeof client === 'function' && 'unsafe' in (client as object)
}
