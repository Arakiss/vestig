/**
 * OTLP (OpenTelemetry Protocol) support for vestig
 *
 * This module provides OTLP-compatible export of spans to any
 * OpenTelemetry backend (Jaeger, Honeycomb, Grafana, Vercel, etc.)
 *
 * @example
 * ```typescript
 * import { span, registerSpanProcessor } from 'vestig'
 * import { OTLPExporter } from 'vestig/otlp'
 *
 * // Create and register the exporter
 * const exporter = new OTLPExporter({
 *   endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
 *   serviceName: 'my-service',
 *   serviceVersion: '1.0.0',
 *   environment: process.env.NODE_ENV,
 *   headers: {
 *     'Authorization': `Bearer ${process.env.OTEL_TOKEN}`,
 *   },
 * })
 *
 * registerSpanProcessor(exporter)
 *
 * // Now your spans are exported to the OTLP endpoint
 * await span('http:request', async (s) => {
 *   s.setAttribute('http.method', 'GET')
 *   s.setAttribute('http.url', '/api/users')
 *   const response = await fetch('/api/users')
 *   s.setAttribute('http.status_code', response.status)
 *   return response.json()
 * })
 *
 * // Graceful shutdown
 * process.on('SIGTERM', async () => {
 *   await shutdownSpanProcessors()
 *   process.exit(0)
 * })
 * ```
 */

// Exporter
export { OTLPExporter, OTLPExportError } from './exporter'
export type { OTLPExporterConfig } from './exporter'

// Span Processor
export {
	spanProcessors,
	registerSpanProcessor,
	unregisterSpanProcessor,
	getSpanProcessors,
	flushSpanProcessors,
	shutdownSpanProcessors,
} from './processor'
export type { SpanProcessor } from './processor'

// Types (for advanced use cases)
export {
	// Conversion utilities
	toOTLPSpan,
	toOTLPAttributes,
	toOTLPAttributeValue,
	toOTLPStatusCode,
	msToNano,
	isoToNano,
	// Enums
	OTLPStatusCode,
	OTLPSpanKind,
	OTLPSeverityNumber,
} from './types'

export type {
	// Span types
	OTLPSpan,
	OTLPSpanEvent,
	OTLPSpanLink,
	OTLPSpanStatus,
	// Resource types
	OTLPResource,
	OTLPInstrumentationScope,
	// Attribute types
	OTLPAttributeValue,
	OTLPKeyValue,
	// Request types
	OTLPExportTraceServiceRequest,
	OTLPResourceSpans,
	OTLPScopeSpans,
	// Log types (for future use)
	OTLPLogRecord,
	OTLPExportLogsServiceRequest,
	OTLPResourceLogs,
	OTLPScopeLogs,
} from './types'
