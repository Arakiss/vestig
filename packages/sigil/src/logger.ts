import { mergeConfig } from './config'
import { getContext } from './context'
import { shouldLog } from './levels'
import { RUNTIME } from './runtime'
import { ConsoleTransport } from './transports/console'
import type {
	LogContext,
	LogEntry,
	LogLevel,
	LogMetadata,
	Logger,
	LoggerConfig,
	Transport,
} from './types'
import { isError, serializeError } from './utils/error'
import { sanitize } from './utils/sanitize'

/**
 * Format variadic arguments into message and metadata
 */
function formatArgs(args: unknown[]): { message: string; metadata: LogMetadata } {
	if (args.length === 0) {
		return { message: '', metadata: {} }
	}

	const first = args[0]

	// If first arg is a string, it's the message
	if (typeof first === 'string') {
		const message = first
		const rest = args.slice(1)

		// If second arg is a plain object (not Error), it's metadata
		if (rest.length === 1 && typeof rest[0] === 'object' && rest[0] !== null && !isError(rest[0])) {
			return { message, metadata: rest[0] as LogMetadata }
		}

		// Otherwise, collect all remaining args
		const metadata: LogMetadata = {}
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i]
			if (isError(arg)) {
				metadata.error = serializeError(arg)
			} else if (typeof arg === 'object' && arg !== null) {
				Object.assign(metadata, arg)
			} else {
				metadata[`arg${i + 1}`] = arg
			}
		}
		return { message, metadata }
	}

	// If first arg is not a string, stringify all
	const metadata: LogMetadata = {}
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		if (isError(arg)) {
			metadata.error = serializeError(arg)
		} else if (typeof arg === 'object' && arg !== null) {
			Object.assign(metadata, arg)
		} else {
			metadata[`arg${i}`] = arg
		}
	}
	return { message: String(first), metadata }
}

/**
 * Core logger implementation
 */
export class LoggerImpl implements Logger {
	private config: Required<LoggerConfig>
	private transport: Transport
	private children: Map<string, LoggerImpl> = new Map()

	constructor(config?: LoggerConfig) {
		this.config = mergeConfig(config)
		this.transport = new ConsoleTransport({
			structured: this.config.structured,
			colors: !this.config.structured,
		})
	}

	/**
	 * Internal log method
	 */
	private log(level: LogLevel, args: unknown[]): void {
		// Check if logging is enabled and level is sufficient
		if (!this.config.enabled || !shouldLog(level, this.config.level)) {
			return
		}

		const { message, metadata } = formatArgs(args)

		// Get context from async storage
		const asyncContext = getContext()

		// Sanitize metadata if enabled
		const sanitizedMetadata = this.config.sanitize
			? (sanitize(metadata, this.config.sanitizeFields) as LogMetadata)
			: metadata

		// Build log entry
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined,
			context: this.mergeContext(asyncContext),
			runtime: RUNTIME,
			namespace: this.config.namespace || undefined,
			error: sanitizedMetadata.error as LogEntry['error'],
		}

		// Remove error from metadata since it's top-level
		if (entry.metadata?.error) {
			const { error: _, ...rest } = entry.metadata
			entry.metadata = Object.keys(rest).length > 0 ? rest : undefined
		}

		// Send to transport
		this.transport.log(entry)
	}

	/**
	 * Merge static context with async context
	 */
	private mergeContext(asyncContext?: LogContext): LogContext | undefined {
		const staticContext = this.config.context
		const hasStatic = Object.keys(staticContext).length > 0
		const hasAsync = asyncContext && Object.keys(asyncContext).length > 0

		if (!hasStatic && !hasAsync) return undefined
		return { ...staticContext, ...asyncContext }
	}

	// Log level methods
	trace(message: string, metadata?: LogMetadata): void
	trace(...args: unknown[]): void
	trace(...args: unknown[]): void {
		this.log('trace', args)
	}

	debug(message: string, metadata?: LogMetadata): void
	debug(...args: unknown[]): void
	debug(...args: unknown[]): void {
		this.log('debug', args)
	}

	info(message: string, metadata?: LogMetadata): void
	info(...args: unknown[]): void
	info(...args: unknown[]): void {
		this.log('info', args)
	}

	warn(message: string, metadata?: LogMetadata): void
	warn(...args: unknown[]): void
	warn(...args: unknown[]): void {
		this.log('warn', args)
	}

	error(message: string, metadata?: LogMetadata): void
	error(...args: unknown[]): void
	error(...args: unknown[]): void {
		this.log('error', args)
	}

	/**
	 * Create a child logger with a namespace
	 */
	child(namespace: string, config?: Partial<LoggerConfig>): Logger {
		const fullNamespace = this.config.namespace
			? `${this.config.namespace}:${namespace}`
			: namespace

		// Check cache
		const cached = this.children.get(fullNamespace)
		if (cached && !config) {
			return cached
		}

		// Create new child logger
		const child = new LoggerImpl({
			...this.config,
			...config,
			namespace: fullNamespace,
			context: { ...this.config.context, ...config?.context },
		})

		// Cache if no custom config
		if (!config) {
			this.children.set(fullNamespace, child)
		}

		return child
	}

	/**
	 * Set the minimum log level
	 */
	setLevel(level: LogLevel): void {
		this.config.level = level
	}

	/**
	 * Get the current log level
	 */
	getLevel(): LogLevel {
		return this.config.level
	}

	/**
	 * Enable logging
	 */
	enable(): void {
		this.config.enabled = true
	}

	/**
	 * Disable logging
	 */
	disable(): void {
		this.config.enabled = false
	}

	/**
	 * Check if logging is enabled
	 */
	isEnabled(): boolean {
		return this.config.enabled
	}

	/**
	 * Flush any buffered logs
	 */
	async flush(): Promise<void> {
		await this.transport.flush?.()
	}
}

/**
 * Create a new logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
	return new LoggerImpl(config)
}
