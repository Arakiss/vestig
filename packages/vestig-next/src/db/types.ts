/**
 * Database Logging Types
 *
 * Types for database query logging with Prisma and Drizzle.
 *
 * @packageDocumentation
 */

/**
 * Query log entry
 */
export interface QueryLogEntry {
	/** Unique query ID */
	id: string
	/** ISO timestamp */
	timestamp: string
	/** SQL query (sanitized) */
	query: string
	/** Query parameters (sanitized) */
	params?: unknown[]
	/** Duration in milliseconds */
	duration: number
	/** Whether query was slow (exceeded threshold) */
	isSlow: boolean
	/** Database operation type */
	operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER'
	/** Table/model name if detectable */
	table?: string
	/** Request context if available */
	context?: {
		requestId?: string
		traceId?: string
	}
}

/**
 * Configuration for database logging
 */
export interface DbLoggerConfig {
	/**
	 * Enable query logging
	 * @default true in development
	 */
	enabled?: boolean
	/**
	 * Slow query threshold in milliseconds
	 * @default 100
	 */
	slowQueryThreshold?: number
	/**
	 * Log all queries or only slow ones
	 * @default 'all' in dev, 'slow' in prod
	 */
	logLevel?: 'all' | 'slow' | 'none'
	/**
	 * Sanitize query parameters (hide sensitive data)
	 * @default true
	 */
	sanitizeParams?: boolean
	/**
	 * Maximum query length to log
	 * @default 1000
	 */
	maxQueryLength?: number
	/**
	 * Custom logger namespace
	 * @default 'db'
	 */
	namespace?: string
	/**
	 * Callback when query is logged
	 */
	onQuery?: (entry: QueryLogEntry) => void
}

/**
 * Prisma log event types
 */
export type PrismaLogEvent = {
	timestamp: Date
	message: string
	target: string
}

export type PrismaQueryEvent = {
	timestamp: Date
	query: string
	params: string
	duration: number
	target: string
}

/**
 * Drizzle logger interface
 */
export interface DrizzleLogger {
	logQuery(query: string, params: unknown[]): void
}

/**
 * Sensitive parameter patterns to sanitize
 */
export const SENSITIVE_PATTERNS = [
	/password/i,
	/secret/i,
	/token/i,
	/api_key/i,
	/apikey/i,
	/credit_card/i,
	/creditcard/i,
	/ssn/i,
	/social_security/i,
]

/**
 * Check if a parameter name is sensitive
 */
export function isSensitiveParam(name: string): boolean {
	return SENSITIVE_PATTERNS.some((pattern) => pattern.test(name))
}

/**
 * Configuration for database auto-instrumentation
 *
 * Used with registerVestig() to configure database instrumentation
 * from the instrumentation.ts file.
 */
export interface DatabaseInstrumentConfig {
	/**
	 * Slow query threshold in milliseconds
	 * Queries exceeding this will be marked as slow
	 * @default 100
	 */
	slowQueryThreshold?: number

	/**
	 * Log level for query logging
	 * - 'all': Log all queries
	 * - 'slow': Only log slow queries
	 * - 'none': Disable logging (spans still created)
	 * @default 'slow' in production, 'all' in development
	 */
	logLevel?: 'all' | 'slow' | 'none'

	/**
	 * Callback when a query completes
	 * Use this for external metrics (e.g., noisy neighbor detection)
	 */
	onQuery?: (entry: QueryLogEntry) => void

	/**
	 * Database system for OTLP semantic attributes
	 * @default 'postgresql'
	 */
	dbSystem?: string

	/**
	 * Database name for OTLP attributes
	 */
	dbName?: string
}
