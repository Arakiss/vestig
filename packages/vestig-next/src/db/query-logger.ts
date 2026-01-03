/**
 * Query Logger Core
 *
 * Core utilities for database query logging shared by
 * Prisma and Drizzle integrations.
 *
 * @packageDocumentation
 */

import type { Logger } from 'vestig'
import type { DbLoggerConfig, QueryLogEntry } from './types'
import { isSensitiveParam } from './types'

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<DbLoggerConfig> = {
	enabled: process.env.NODE_ENV === 'development',
	slowQueryThreshold: 100,
	logLevel: process.env.NODE_ENV === 'development' ? 'all' : 'slow',
	sanitizeParams: true,
	maxQueryLength: 1000,
	namespace: 'db',
	onQuery: () => {},
}

/**
 * Create a unique query ID
 */
function createQueryId(): string {
	return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`
}

/**
 * Detect SQL operation type from query
 */
function detectOperation(query: string): QueryLogEntry['operation'] {
	const trimmed = query.trim().toUpperCase()
	if (trimmed.startsWith('SELECT')) return 'SELECT'
	if (trimmed.startsWith('INSERT')) return 'INSERT'
	if (trimmed.startsWith('UPDATE')) return 'UPDATE'
	if (trimmed.startsWith('DELETE')) return 'DELETE'
	return 'OTHER'
}

/**
 * Extract table name from query (best effort)
 */
function extractTableName(query: string): string | undefined {
	const patterns = [
		/FROM\s+["'`]?(\w+)["'`]?/i,
		/INTO\s+["'`]?(\w+)["'`]?/i,
		/UPDATE\s+["'`]?(\w+)["'`]?/i,
		/DELETE\s+FROM\s+["'`]?(\w+)["'`]?/i,
	]

	for (const pattern of patterns) {
		const match = pattern.exec(query)
		if (match?.[1]) {
			return match[1]
		}
	}

	return undefined
}

/**
 * Sanitize query parameters to hide sensitive data
 */
function sanitizeParams(params: unknown[], query: string): unknown[] {
	return params.map((param, index) => {
		// Check if this position might be a sensitive field
		const queryLower = query.toLowerCase()
		const sensitiveFields = ['password', 'secret', 'token', 'key', 'credit', 'ssn']

		for (const field of sensitiveFields) {
			if (queryLower.includes(field)) {
				// If query contains sensitive field names, redact string params
				if (typeof param === 'string' && param.length > 0) {
					return '[REDACTED]'
				}
			}
		}

		// For objects, check property names
		if (typeof param === 'object' && param !== null) {
			const sanitized: Record<string, unknown> = {}
			for (const [key, value] of Object.entries(param)) {
				if (isSensitiveParam(key)) {
					sanitized[key] = '[REDACTED]'
				} else {
					sanitized[key] = value
				}
			}
			return sanitized
		}

		return param
	})
}

/**
 * Truncate query if too long
 */
function truncateQuery(query: string, maxLength: number): string {
	if (query.length <= maxLength) return query
	return `${query.slice(0, maxLength)}... [truncated]`
}

/**
 * Format duration for logging
 */
export function formatDuration(ms: number): string {
	if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
	if (ms < 1000) return `${ms.toFixed(2)}ms`
	return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Create a query log entry
 */
export function createQueryLogEntry(
	query: string,
	params: unknown[] | undefined,
	duration: number,
	config: Required<DbLoggerConfig>,
	context?: { requestId?: string; traceId?: string },
): QueryLogEntry {
	const operation = detectOperation(query)
	const table = extractTableName(query)
	const isSlow = duration >= config.slowQueryThreshold

	return {
		id: createQueryId(),
		timestamp: new Date().toISOString(),
		query: truncateQuery(query, config.maxQueryLength),
		params: params && config.sanitizeParams ? sanitizeParams(params, query) : params,
		duration,
		isSlow,
		operation,
		table,
		context,
	}
}

/**
 * Log a query with the provided logger
 */
export function logQuery(
	logger: Logger,
	entry: QueryLogEntry,
	config: Required<DbLoggerConfig>,
): void {
	// Check if we should log
	if (!config.enabled) return
	if (config.logLevel === 'none') return
	if (config.logLevel === 'slow' && !entry.isSlow) return

	const metadata = {
		query: entry.query,
		duration: formatDuration(entry.duration),
		durationMs: entry.duration,
		operation: entry.operation,
		...(entry.table && { table: entry.table }),
		...(entry.params && { params: entry.params }),
		...(entry.context?.requestId && { requestId: entry.context.requestId }),
		...(entry.isSlow && { slow: true }),
	}

	const message = entry.isSlow
		? `Slow query: ${entry.operation}${entry.table ? ` ${entry.table}` : ''} (${formatDuration(entry.duration)})`
		: `${entry.operation}${entry.table ? ` ${entry.table}` : ''} (${formatDuration(entry.duration)})`

	if (entry.isSlow) {
		logger.warn(message, metadata)
	} else {
		logger.debug(message, metadata)
	}

	// Call custom callback
	config.onQuery(entry)
}

/**
 * Merge config with defaults
 */
export function mergeConfig(config?: DbLoggerConfig): Required<DbLoggerConfig> {
	return { ...DEFAULT_CONFIG, ...config }
}
