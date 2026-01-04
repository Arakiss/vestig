import { mergeConfig } from './config'
import { getContext } from './context'
import { LOG_LEVELS, shouldLog } from './levels'
import { RUNTIME } from './runtime'
import { type Sampler, createSampler } from './sampling'
import {
	type Span,
	type SpanCallback,
	type SpanOptions,
	type SpanSyncCallback,
	span as spanFn,
	spanSync as spanSyncFn,
} from './tracing'
import { ConsoleTransport } from './transports/console'
import type {
	LogContext,
	LogEntry,
	LogLevel,
	LogMetadata,
	Logger,
	LoggerConfig,
	ResolvedLoggerConfig,
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
 * FinalizationRegistry for cleaning up stale WeakRef entries in children Map.
 * When a child logger is garbage collected, this removes its entry from the parent's Map.
 */
const childLoggerRegistry = new FinalizationRegistry<{
	parent: WeakRef<LoggerImpl>
	namespace: string
}>((heldValue) => {
	const parent = heldValue.parent.deref()
	if (parent) {
		parent.cleanupChild(heldValue.namespace)
	}
})

/**
 * Core logger implementation
 */
export class LoggerImpl implements Logger {
	private config: ResolvedLoggerConfig
	private transports: Transport[] = []
	/** WeakRef cache to prevent memory leaks - children can be GC'd when no longer referenced */
	private children: Map<string, WeakRef<LoggerImpl>> = new Map()
	private initialized = false
	private sampler: Sampler | null = null

	constructor(config?: LoggerConfig) {
		this.config = mergeConfig(config)

		// Initialize sampler if configured
		if (this.config.sampling) {
			this.sampler = createSampler(this.config.sampling)
		}

		// Add default console transport
		this.transports.push(
			new ConsoleTransport({
				structured: this.config.structured,
				colors: !this.config.structured,
			}),
		)
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
		// Note: sanitize() can return null/undefined for edge cases, so we fallback to empty object
		const sanitizedMetadata = this.config.sanitize
			? ((sanitize(metadata, this.config.sanitizeFields) as LogMetadata) ?? {})
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

		// Apply sampling if configured
		if (this.sampler && !this.sampler.shouldSample(entry)) {
			return
		}

		// Send to all enabled transports
		for (const transport of this.transports) {
			// Check if transport is enabled
			if (transport.config.enabled === false) continue

			// Check transport-level log level filter
			if (transport.config.level && !shouldLog(level, transport.config.level)) continue

			// Check transport-level custom filter
			if (transport.config.filter && !transport.config.filter(entry)) continue

			// Send to transport
			transport.log(entry)
		}
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

		// Check cache (WeakRef allows GC when not referenced elsewhere)
		const cachedRef = this.children.get(fullNamespace)
		if (cachedRef && !config) {
			const cached = cachedRef.deref()
			if (cached) {
				return cached
			}
			// WeakRef was collected, remove stale entry
			this.children.delete(fullNamespace)
		}

		// Create new child logger
		const child = new LoggerImpl({
			...this.config,
			...config,
			namespace: fullNamespace,
			context: { ...this.config.context, ...config?.context },
		})

		// Cache if no custom config (using WeakRef to allow GC)
		if (!config) {
			this.children.set(fullNamespace, new WeakRef(child))

			// Register for automatic cleanup when child is garbage collected
			childLoggerRegistry.register(child, {
				parent: new WeakRef(this),
				namespace: fullNamespace,
			})
		}

		return child
	}

	/**
	 * Internal method called by FinalizationRegistry to clean up stale entries
	 * @internal
	 */
	cleanupChild(namespace: string): void {
		this.children.delete(namespace)
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
	 * Flush any buffered logs from all transports
	 */
	async flush(): Promise<void> {
		await Promise.all(this.transports.map((t) => t.flush?.()))
	}

	/**
	 * Add a transport to the logger
	 */
	addTransport(transport: Transport): void {
		// Check for duplicate names
		if (this.transports.some((t) => t.name === transport.name)) {
			throw new Error(`Transport with name "${transport.name}" already exists`)
		}

		this.transports.push(transport)

		// Initialize if logger is already initialized
		if (this.initialized) {
			transport.init?.().catch((err) => {
				console.error(`Failed to initialize transport "${transport.name}":`, err)
			})
		}
	}

	/**
	 * Remove a transport by name
	 */
	removeTransport(name: string): boolean {
		const index = this.transports.findIndex((t) => t.name === name)
		if (index === -1) return false

		const removed = this.transports.splice(index, 1)
		const transport = removed[0]
		if (transport) {
			transport.destroy?.().catch((err) => {
				console.error(`Failed to destroy transport "${name}":`, err)
			})
		}

		return true
	}

	/**
	 * Get all registered transports
	 */
	getTransports(): readonly Transport[] {
		return this.transports
	}

	/**
	 * Initialize all transports
	 */
	async init(): Promise<void> {
		if (this.initialized) return

		await Promise.all(this.transports.map((t) => t.init?.()))
		this.initialized = true
	}

	/**
	 * Destroy all transports (call on shutdown)
	 */
	async destroy(): Promise<void> {
		await Promise.all(this.transports.map((t) => t.destroy?.()))
		this.transports = []
		this.initialized = false
	}

	/**
	 * Create and run a span for an async operation
	 *
	 * The span name will be prefixed with the logger's namespace if present.
	 * This provides automatic instrumentation context for your operations.
	 *
	 * @param name - Human-readable name for the operation
	 * @param fn - Async function to execute within the span
	 * @param options - Optional span configuration
	 * @returns The result of the function
	 *
	 * @example
	 * ```typescript
	 * const db = log.child('database')
	 * const result = await db.span('query', async (span) => {
	 *   span.setAttribute('table', 'users')
	 *   return await executeQuery()
	 * })
	 * // Span name will be 'database:query'
	 * ```
	 */
	async span<T>(name: string, fn: SpanCallback<T>, options?: SpanOptions): Promise<T> {
		const fullName = this.config.namespace ? `${this.config.namespace}:${name}` : name
		return spanFn(fullName, fn, options)
	}

	/**
	 * Create and run a span for a synchronous operation
	 *
	 * Similar to `span()` but for synchronous code.
	 *
	 * @param name - Human-readable name for the operation
	 * @param fn - Synchronous function to execute within the span
	 * @param options - Optional span configuration
	 * @returns The result of the function
	 *
	 * @example
	 * ```typescript
	 * const parser = log.child('parser')
	 * const data = parser.spanSync('parse-json', (span) => {
	 *   span.setAttribute('size', content.length)
	 *   return JSON.parse(content)
	 * })
	 * // Span name will be 'parser:parse-json'
	 * ```
	 */
	spanSync<T>(name: string, fn: SpanSyncCallback<T>, options?: SpanOptions): T {
		const fullName = this.config.namespace ? `${this.config.namespace}:${name}` : name
		return spanSyncFn(fullName, fn, options)
	}
}

/**
 * Create a new logger instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * const logger = createLogger({ level: 'info' })
 *
 * // With namespace
 * const dbLogger = createLogger({ namespace: 'db' })
 *
 * // For async initialization, see createLoggerAsync()
 * ```
 */
export function createLogger(config?: LoggerConfig): Logger {
	return new LoggerImpl(config)
}

/**
 * Create and initialize a logger instance asynchronously
 *
 * This function creates a logger and waits for all transports to initialize.
 * Use this when you have transports that require async setup (file handles,
 * database connections, HTTP clients with connection pooling, etc.).
 *
 * @param config - Logger configuration options
 * @returns A promise that resolves to the initialized logger
 *
 * @example
 * ```typescript
 * // Initialize logger with async transports
 * const logger = await createLoggerAsync({
 *   level: 'info',
 *   namespace: 'app'
 * })
 *
 * // Add transports that need async init
 * logger.addTransport(new FileTransport({ path: './logs/app.log' }))
 * logger.addTransport(new HTTPTransport({ url: 'https://logs.example.com' }))
 *
 * // Or create with transports added first
 * const logger = createLogger()
 * logger.addTransport(new FileTransport({ path: './logs/app.log' }))
 * const initializedLogger = await initLogger(logger)
 * ```
 */
export async function createLoggerAsync(config?: LoggerConfig): Promise<Logger> {
	const logger = new LoggerImpl(config)
	await logger.init()
	return logger
}

/**
 * Initialize an existing logger and its transports
 *
 * This is useful when you want to add transports first, then initialize them all.
 *
 * @param logger - The logger instance to initialize
 * @returns A promise that resolves to the same logger after initialization
 *
 * @example
 * ```typescript
 * const logger = createLogger({ namespace: 'api' })
 * logger.addTransport(new FileTransport({ path: './api.log' }))
 * logger.addTransport(new DatadogTransport({ apiKey: process.env.DD_API_KEY }))
 *
 * // Initialize all transports
 * await initLogger(logger)
 * ```
 */
export async function initLogger(logger: Logger): Promise<Logger> {
	// The Logger interface doesn't expose init(), so we cast to access it
	// This is safe because createLogger always returns a LoggerImpl
	const impl = logger as LoggerImpl
	await impl.init()
	return logger
}
