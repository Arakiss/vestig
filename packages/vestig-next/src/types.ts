/**
 * Shared types for @vestig/next
 */

import type {
	LogContext,
	LogEntry,
	LogLevel,
	LogMetadata,
	Logger,
	LoggerConfig,
	SanitizeConfig,
	SanitizePreset,
	Transport,
} from 'vestig'

// Re-export core types for convenience
export type {
	Logger,
	LoggerConfig,
	LogLevel,
	LogEntry,
	LogMetadata,
	LogContext,
	Transport,
	SanitizePreset,
	SanitizeConfig,
}

// Re-export config types
export type {
	VestigNextConfig,
	VestigNextOptions,
	VestigNextMiddlewareConfig,
	VestigNextServerConfig,
	VestigNextClientConfig,
	VestigNextDevToolsConfig,
} from './config'

/**
 * Context provided to route handlers wrapped with withVestig
 */
export interface RouteHandlerContext {
	/** Logger instance with request correlation */
	log: Logger
	/** Correlation context (requestId, traceId, spanId) */
	ctx: LogContext
	/** Route params from Next.js */
	params: Record<string, string>
	/** Request timing utilities */
	timing: {
		/** Start time in ms */
		start: number
		/** Get elapsed time in ms */
		elapsed: () => number
		/** Mark a checkpoint */
		mark: (name: string) => void
	}
}

/**
 * Route handler function type
 */
export type RouteHandler<T = Response> = (
	request: Request,
	context: RouteHandlerContext,
) => Promise<T> | T

/**
 * Options for withVestig wrapper
 */
export interface WithVestigOptions {
	/** Logger namespace (e.g., 'api:users') */
	namespace?: string
	/** Log incoming request (default: true) */
	logRequest?: boolean
	/** Log outgoing response (default: true) */
	logResponse?: boolean
}

/**
 * Context provided to server actions wrapped with vestigAction
 */
export interface ActionContext {
	/** Logger instance with request correlation */
	log: Logger
	/** Correlation context */
	ctx: LogContext
}

/**
 * Server action function type
 */
export type ServerAction<TInput, TOutput> = (
	input: TInput,
	context: ActionContext,
) => Promise<TOutput>

/**
 * Options for vestigAction wrapper
 */
export interface VestigActionOptions {
	/** Logger namespace */
	namespace?: string
	/** Log input data (default: false for security) */
	logInput?: boolean
	/** Log output data (default: false) */
	logOutput?: boolean
}

/**
 * Props for VestigProvider component
 */
export interface VestigProviderProps {
	children: React.ReactNode
	/** Initial correlation context (e.g., from server) */
	initialContext?: LogContext
	/** Override endpoint URL */
	endpoint?: string
	/** Logger namespace */
	namespace?: string
	/** Additional static context */
	context?: Record<string, unknown>
}
