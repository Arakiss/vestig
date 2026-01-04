// Version
export { VERSION } from './version'

// Core exports
export { createLogger, createLoggerAsync, initLogger, LoggerImpl } from './logger'
export type {
	Logger,
	LoggerConfig,
	ResolvedLoggerConfig,
	LogLevel,
	LogEntry,
	LogMetadata,
	LogContext,
	Transport,
	TransportConfig,
	BatchTransportConfig,
	HTTPTransportConfig,
	FileTransportConfig,
	RotationInterval,
	DatadogTransportConfig,
	SerializedError,
	Runtime,
	// Sanitization types
	FieldMatcher,
	SanitizePattern,
	SanitizeConfig,
	SanitizePreset,
	// Deduplication types
	DedupeConfig,
	// Tracing types (re-exported from types.ts)
	Span,
	SpanCallback,
	SpanEvent,
	SpanOptions,
	SpanStatus,
	SpanSyncCallback,
	// Sampling types (re-exported from types.ts)
	Sampler,
	SamplerConfig,
	SamplingConfig,
	ProbabilitySamplerConfig,
	RateLimitSamplerConfig,
	NamespaceSamplerConfig,
} from './types'

// Runtime detection
export {
	RUNTIME,
	CAPABILITIES,
	IS_NODE,
	IS_BUN,
	IS_DENO,
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
	// W3C Trace Context tracestate support
	parseTracestate,
	createTracestate,
	getTracestateValue,
	setTracestateValue,
	deleteTracestateKey,
} from './context'
export type { TracestateEntry } from './context'

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
export { Deduplicator } from './utils/dedupe'
export type { DedupeResult } from './utils/dedupe'

// Transports
export { ConsoleTransport } from './transports/console'
export type { ConsoleTransportConfig } from './transports/console'
export { BatchTransport } from './transports/batch'
export { HTTPTransport, HTTPTransportError } from './transports/http'
export { FileTransport } from './transports/file'
export { DatadogTransport, DatadogTransportError } from './transports/datadog'

// Tracing - standalone functions and utilities
export {
	span,
	spanSync,
	startSpan,
	endSpan,
	getActiveSpan,
	withActiveSpan,
	SpanImpl,
	// Context utilities (for advanced use cases)
	clearActiveSpans,
	getActiveSpanStackDepth,
	withSpanContext,
	withSpanContextAsync,
} from './tracing'

// Sampling - factory functions for creating samplers
export {
	createSampler,
	createSamplerFromConfig,
	createProbabilitySampler,
	createRateLimitSampler,
	createNamespaceSampler,
	createCompositeSampler,
} from './sampling'

// Metrics - Prometheus format export
export { MetricsCollector, globalMetrics, createMetricsCollector } from './metrics'
export type { LoggerMetrics } from './metrics'

// Default logger instance (convenience)
import { createLogger } from './logger'

/**
 * Default logger instance with auto-configuration
 */
export const log = createLogger()
