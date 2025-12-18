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
	TransportConfig,
	BatchTransportConfig,
	HTTPTransportConfig,
	FileTransportConfig,
	DatadogTransportConfig,
	SerializedError,
	Runtime,
	// Sanitization types
	FieldMatcher,
	SanitizePattern,
	SanitizeConfig,
	SanitizePreset,
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
export {
	Sanitizer,
	sanitize,
	createSanitizer,
	getPreset,
	mergeConfigs,
	COMMON_PATTERNS,
	PRESETS,
} from './utils/sanitize'
export { CircularBuffer } from './utils/buffer'
export type { CircularBufferConfig } from './utils/buffer'

// Transports
export { ConsoleTransport } from './transports/console'
export type { ConsoleTransportConfig } from './transports/console'
export { BatchTransport } from './transports/batch'
export { HTTPTransport, HTTPTransportError } from './transports/http'
export { FileTransport } from './transports/file'
export { DatadogTransport, DatadogTransportError } from './transports/datadog'

// Default logger instance (convenience)
import { createLogger } from './logger'

/**
 * Default logger instance with auto-configuration
 */
export const log = createLogger()
