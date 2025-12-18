// Core exports
export { createLogger, LoggerImpl } from './logger'
export type {
	Logger,
	LoggerConfig,
	LogLevel,
	LogEntry,
	LogMetadata,
	LogContext,
	Transport,
	SerializedError,
	Runtime,
} from './types'

// Runtime detection
export {
	RUNTIME,
	CAPABILITIES,
	IS_NODE,
	IS_BUN,
	IS_EDGE,
	IS_BROWSER,
	IS_WORKER,
	IS_SERVER,
} from './runtime'
export type { RuntimeCapabilities } from './runtime'

// Log levels
export { LOG_LEVELS, shouldLog, parseLogLevel } from './levels'

// Configuration
export { getDefaultConfig, mergeConfig, ENV_VARS } from './config'

// Context management
export {
	getContext,
	withContext,
	withContextAsync,
	createCorrelationContext,
	generateRequestId,
	generateTraceId,
	generateSpanId,
	parseTraceparent,
	createTraceparent,
} from './context'

// Utilities
export { serializeError, isError, getErrorMessage } from './utils/error'
export { sanitize, createSanitizer } from './utils/sanitize'
export { CircularBuffer } from './utils/buffer'
export type { CircularBufferConfig } from './utils/buffer'

// Transports
export { ConsoleTransport } from './transports/console'
export type { ConsoleTransportConfig } from './transports/console'

// Default logger instance (convenience)
import { createLogger } from './logger'

/**
 * Default logger instance with auto-configuration
 */
export const log = createLogger()
