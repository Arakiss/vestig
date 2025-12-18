/**
 * Log levels from least to most severe
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

/**
 * Runtime environment detection
 */
export type Runtime = 'node' | 'bun' | 'edge' | 'browser' | 'worker' | 'unknown'

/**
 * Metadata attached to log entries
 */
export type LogMetadata = Record<string, unknown>

/**
 * Context that persists across async operations
 */
export interface LogContext {
	requestId?: string
	traceId?: string
	spanId?: string
	userId?: string
	sessionId?: string
	[key: string]: unknown
}

/**
 * A structured log entry
 */
export interface LogEntry {
	timestamp: string
	level: LogLevel
	message: string
	metadata?: LogMetadata
	context?: LogContext
	runtime: Runtime
	namespace?: string
	error?: SerializedError
}

/**
 * Serialized error with cause chain support
 */
export interface SerializedError {
	name: string
	message: string
	stack?: string
	cause?: SerializedError
	code?: string | number
	[key: string]: unknown
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
	/** Minimum log level to output */
	level?: LogLevel
	/** Enable/disable logging */
	enabled?: boolean
	/** Output as JSON (production) or formatted (development) */
	structured?: boolean
	/** Enable data sanitization (default: true) */
	sanitize?: boolean
	/** Additional fields to sanitize */
	sanitizeFields?: string[]
	/** Static context added to all logs */
	context?: LogContext
	/** Logger namespace for child loggers */
	namespace?: string
}

/**
 * Transport interface for log output
 */
export interface Transport {
	name: string
	log(entry: LogEntry): void | Promise<void>
	flush?(): void | Promise<void>
}

/**
 * Logger interface
 */
export interface Logger {
	trace(message: string, metadata?: LogMetadata): void
	trace(...args: unknown[]): void
	debug(message: string, metadata?: LogMetadata): void
	debug(...args: unknown[]): void
	info(message: string, metadata?: LogMetadata): void
	info(...args: unknown[]): void
	warn(message: string, metadata?: LogMetadata): void
	warn(...args: unknown[]): void
	error(message: string, metadata?: LogMetadata): void
	error(...args: unknown[]): void

	child(namespace: string, config?: Partial<LoggerConfig>): Logger
	setLevel(level: LogLevel): void
	getLevel(): LogLevel
	enable(): void
	disable(): void
	isEnabled(): boolean
	flush(): Promise<void>
}
