/**
 * Log levels from least to most severe
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

/**
 * Runtime environment detection
 */
export type Runtime = 'node' | 'bun' | 'deno' | 'edge' | 'browser' | 'worker' | 'unknown'

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
 * Field matcher for flexible field matching in sanitization
 */
export interface FieldMatcher {
	/** Match type */
	type: 'exact' | 'prefix' | 'suffix' | 'contains' | 'regex'
	/** Pattern or field name to match */
	value: string
	/** Case sensitive matching (default: false) */
	caseSensitive?: boolean
}

/**
 * Pattern definition for sanitizing string content
 */
export interface SanitizePattern {
	/** Pattern identifier */
	name: string
	/** Regular expression to match */
	pattern: RegExp
	/** Replacement string or function (default: '[REDACTED]') */
	replacement?: string | ((match: string) => string)
}

/**
 * Sanitization configuration
 */
export interface SanitizeConfig {
	/** Enable/disable sanitization (default: true) */
	enabled?: boolean
	/** Fields to sanitize (can be strings or FieldMatchers) */
	fields?: (string | FieldMatcher)[]
	/** Patterns to apply to string values */
	patterns?: SanitizePattern[]
	/** Default replacement string (default: '[REDACTED]') */
	replacement?: string
	/** Maximum recursion depth (default: 10) */
	depth?: number
}

/**
 * Available sanitization presets
 */
export type SanitizePreset = 'none' | 'minimal' | 'default' | 'gdpr' | 'hipaa' | 'pci-dss'

// Re-export sampling types for convenience
export type {
	NamespaceSamplerConfig,
	ProbabilitySamplerConfig,
	RateLimitSamplerConfig,
	Sampler,
	SamplerConfig,
	SamplingConfig,
} from './sampling/types'

/**
 * Duplicate log suppression configuration
 *
 * When enabled, identical logs within a time window are suppressed.
 * A summary log is emitted when the window expires showing how many
 * duplicates were suppressed.
 */
export interface DedupeConfig {
	/**
	 * Enable duplicate suppression (default: true when config provided)
	 */
	enabled?: boolean

	/**
	 * Time window in milliseconds for suppression (default: 1000)
	 *
	 * Logs with the same signature within this window are deduplicated.
	 */
	windowMs?: number

	/**
	 * Maximum unique log signatures to track (default: 1000)
	 *
	 * When exceeded, oldest entries are evicted. This prevents
	 * unbounded memory growth from unique log messages.
	 */
	maxSize?: number

	/**
	 * Include level in deduplication key (default: true)
	 *
	 * When true, same message at different levels are treated as different.
	 */
	includeLevel?: boolean

	/**
	 * Include namespace in deduplication key (default: true)
	 *
	 * When true, same message from different namespaces are treated as different.
	 */
	includeNamespace?: boolean
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
	/** Sanitization configuration: boolean, preset name, or full config */
	sanitize?: boolean | SanitizePreset | SanitizeConfig
	/** @deprecated Use sanitize config instead */
	sanitizeFields?: string[]
	/** Static context added to all logs */
	context?: LogContext
	/** Logger namespace for child loggers */
	namespace?: string
	/**
	 * Sampling configuration to reduce log volume in production.
	 *
	 * @example
	 * ```typescript
	 * // Sample 10% of logs
	 * createLogger({ sampling: { enabled: true, sampler: 0.1 } })
	 *
	 * // Rate limit to 100 logs/second
	 * createLogger({ sampling: { enabled: true, sampler: { maxPerSecond: 100 } } })
	 *
	 * // Different rates per namespace
	 * createLogger({
	 *   sampling: {
	 *     enabled: true,
	 *     sampler: {
	 *       default: { probability: 0.1 },
	 *       namespaces: {
	 *         'auth.*': 1, // 100% for auth
	 *         'db.*': { maxPerSecond: 50 }
	 *       }
	 *     }
	 *   }
	 * })
	 * ```
	 */
	sampling?: import('./sampling/types').SamplingConfig

	/**
	 * Duplicate log suppression configuration.
	 *
	 * Prevents flooding from identical repeated log messages.
	 *
	 * @example
	 * ```typescript
	 * // Suppress duplicates within 1 second (default)
	 * createLogger({ dedupe: { enabled: true } })
	 *
	 * // Custom window and size
	 * createLogger({
	 *   dedupe: {
	 *     enabled: true,
	 *     windowMs: 5000,  // 5 second window
	 *     maxSize: 500     // Track up to 500 unique messages
	 *   }
	 * })
	 * ```
	 */
	dedupe?: DedupeConfig
}

/**
 * Resolved logger configuration with all required fields populated.
 * Note: `sampling` and `dedupe` remain optional as they're disabled by default.
 */
export type ResolvedLoggerConfig = Required<Omit<LoggerConfig, 'sampling' | 'dedupe'>> & {
	sampling?: import('./sampling/types').SamplingConfig
	dedupe?: DedupeConfig
}

/**
 * Base transport configuration
 */
export interface TransportConfig {
	/** Transport name for identification */
	name: string
	/** Enable/disable this transport (default: true) */
	enabled?: boolean
	/** Minimum log level for this transport */
	level?: LogLevel
	/** Filter function for entries */
	filter?: (entry: LogEntry) => boolean
}

/**
 * Transport interface for log output
 */
export interface Transport {
	/** Transport identifier */
	readonly name: string
	/** Transport configuration */
	readonly config: TransportConfig
	/** Initialize transport (called once on startup) */
	init?(): Promise<void>
	/** Log a single entry */
	log(entry: LogEntry): void | Promise<void>
	/** Flush any buffered entries */
	flush?(): Promise<void>
	/** Cleanup resources (called on shutdown) */
	destroy?(): Promise<void>
}

/**
 * Configuration for batch transports
 */
export interface BatchTransportConfig extends TransportConfig {
	/** Maximum entries before auto-flush (default: 100) */
	batchSize?: number
	/** Interval in ms between auto-flushes (default: 5000) */
	flushInterval?: number
	/** Maximum retry attempts on failure (default: 3) */
	maxRetries?: number
	/** Delay between retries in ms (default: 1000) */
	retryDelay?: number
}

/**
 * HTTP transport configuration
 */
export interface HTTPTransportConfig extends BatchTransportConfig {
	/** Destination URL for log entries */
	url: string
	/** HTTP method (default: POST) */
	method?: 'POST' | 'PUT'
	/** Custom headers */
	headers?: Record<string, string>
	/** Request timeout in ms (default: 30000) */
	timeout?: number
	/** Transform entries before sending */
	transform?: (entries: LogEntry[]) => unknown
	/**
	 * Enable keep-alive connections (default: true).
	 * When true, adds Connection: keep-alive header and enables
	 * the fetch keepalive option for browser page-unload scenarios.
	 */
	keepAlive?: boolean
}

/**
 * Rotation interval for time-based log rotation
 */
export type RotationInterval = 'hourly' | 'daily' | 'weekly' | 'none'

/**
 * File transport configuration
 */
export interface FileTransportConfig extends BatchTransportConfig {
	/** Log file path */
	path: string
	/** Maximum file size in bytes before rotation (default: 10MB) */
	maxSize?: number
	/** Maximum number of rotated files to keep (default: 5) */
	maxFiles?: number
	/** Compress rotated files with gzip (default: false) */
	compress?: boolean
	/** Time-based rotation interval (default: 'none' - only size-based rotation) */
	rotateInterval?: RotationInterval
}

/**
 * Datadog transport configuration
 */
export interface DatadogTransportConfig extends BatchTransportConfig {
	/** Datadog API key */
	apiKey: string
	/** Datadog site (default: datadoghq.com) */
	site?: 'datadoghq.com' | 'datadoghq.eu' | 'us3.datadoghq.com' | 'us5.datadoghq.com'
	/** Service name for logs */
	service?: string
	/** Log source identifier */
	source?: string
	/** Additional tags */
	tags?: string[]
}

// Re-export tracing types for convenience
export type {
	Span,
	SpanCallback,
	SpanEvent,
	SpanOptions,
	SpanStatus,
	SpanSyncCallback,
} from './tracing/types'

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

	/** Add a transport to the logger */
	addTransport(transport: Transport): void
	/** Remove a transport by name */
	removeTransport(name: string): boolean
	/** Get all registered transports */
	getTransports(): readonly Transport[]
	/** Destroy all transports (call on shutdown) */
	destroy(): Promise<void>

	/**
	 * Create and run a span for an async operation
	 *
	 * The span name will be prefixed with the logger's namespace if present.
	 *
	 * @param name - Human-readable name for the operation
	 * @param fn - Async function to execute within the span
	 * @param options - Optional span configuration
	 * @returns The result of the function
	 */
	span<T>(
		name: string,
		fn: import('./tracing/types').SpanCallback<T>,
		options?: import('./tracing/types').SpanOptions,
	): Promise<T>

	/**
	 * Create and run a span for a synchronous operation
	 *
	 * @param name - Human-readable name for the operation
	 * @param fn - Synchronous function to execute within the span
	 * @param options - Optional span configuration
	 * @returns The result of the function
	 */
	spanSync<T>(
		name: string,
		fn: import('./tracing/types').SpanSyncCallback<T>,
		options?: import('./tracing/types').SpanOptions,
	): T
}
