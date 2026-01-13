/**
 * OpenTelemetry Protocol (OTLP) types for vestig
 *
 * These types follow the OTLP/JSON specification for traces and logs.
 * @see https://opentelemetry.io/docs/specs/otlp/
 */

import type { Span, SpanStatus } from '../tracing/types'

/**
 * OTLP attribute value types
 */
export type OTLPAttributeValue =
	| { stringValue: string }
	| { intValue: string } // OTLP uses string for int64
	| { doubleValue: number }
	| { boolValue: boolean }
	| { arrayValue: { values: OTLPAttributeValue[] } }
	| { kvlistValue: { values: OTLPKeyValue[] } }

/**
 * OTLP key-value pair for attributes
 */
export interface OTLPKeyValue {
	key: string
	value: OTLPAttributeValue
}

/**
 * OTLP Resource represents the entity producing telemetry
 */
export interface OTLPResource {
	attributes: OTLPKeyValue[]
	droppedAttributesCount?: number
}

/**
 * OTLP InstrumentationScope identifies the instrumentation library
 */
export interface OTLPInstrumentationScope {
	name: string
	version?: string
	attributes?: OTLPKeyValue[]
}

/**
 * OTLP Span status codes
 * @see https://opentelemetry.io/docs/specs/otel/trace/api/#set-status
 */
export enum OTLPStatusCode {
	/** Default status */
	UNSET = 0,
	/** Operation completed successfully */
	OK = 1,
	/** Operation failed */
	ERROR = 2,
}

/**
 * OTLP Span Kind
 * @see https://opentelemetry.io/docs/specs/otel/trace/api/#spankind
 */
export enum OTLPSpanKind {
	/** Default, internal operation */
	INTERNAL = 1,
	/** Server handling a request */
	SERVER = 2,
	/** Client making a request */
	CLIENT = 3,
	/** Producer sending a message */
	PRODUCER = 4,
	/** Consumer receiving a message */
	CONSUMER = 5,
}

/**
 * OTLP Span status
 */
export interface OTLPSpanStatus {
	code: OTLPStatusCode
	message?: string
}

/**
 * OTLP Span event
 */
export interface OTLPSpanEvent {
	timeUnixNano: string
	name: string
	attributes?: OTLPKeyValue[]
	droppedAttributesCount?: number
}

/**
 * OTLP Span link (for distributed traces)
 */
export interface OTLPSpanLink {
	traceId: string
	spanId: string
	traceState?: string
	attributes?: OTLPKeyValue[]
	droppedAttributesCount?: number
}

/**
 * OTLP Span representation
 */
export interface OTLPSpan {
	traceId: string
	spanId: string
	traceState?: string
	parentSpanId?: string
	name: string
	kind: OTLPSpanKind
	startTimeUnixNano: string
	endTimeUnixNano: string
	attributes?: OTLPKeyValue[]
	droppedAttributesCount?: number
	events?: OTLPSpanEvent[]
	droppedEventsCount?: number
	links?: OTLPSpanLink[]
	droppedLinksCount?: number
	status?: OTLPSpanStatus
}

/**
 * OTLP ScopeSpans groups spans by instrumentation scope
 */
export interface OTLPScopeSpans {
	scope?: OTLPInstrumentationScope
	spans: OTLPSpan[]
	schemaUrl?: string
}

/**
 * OTLP ResourceSpans groups spans by resource
 */
export interface OTLPResourceSpans {
	resource?: OTLPResource
	scopeSpans: OTLPScopeSpans[]
	schemaUrl?: string
}

/**
 * OTLP ExportTraceServiceRequest - the payload sent to /v1/traces
 */
export interface OTLPExportTraceServiceRequest {
	resourceSpans: OTLPResourceSpans[]
}

/**
 * OTLP Log Severity Number
 * @see https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber
 */
export enum OTLPSeverityNumber {
	TRACE = 1,
	TRACE2 = 2,
	TRACE3 = 3,
	TRACE4 = 4,
	DEBUG = 5,
	DEBUG2 = 6,
	DEBUG3 = 7,
	DEBUG4 = 8,
	INFO = 9,
	INFO2 = 10,
	INFO3 = 11,
	INFO4 = 12,
	WARN = 13,
	WARN2 = 14,
	WARN3 = 15,
	WARN4 = 16,
	ERROR = 17,
	ERROR2 = 18,
	ERROR3 = 19,
	ERROR4 = 20,
	FATAL = 21,
	FATAL2 = 22,
	FATAL3 = 23,
	FATAL4 = 24,
}

/**
 * OTLP Log Record
 */
export interface OTLPLogRecord {
	timeUnixNano: string
	observedTimeUnixNano?: string
	severityNumber?: OTLPSeverityNumber
	severityText?: string
	body?: OTLPAttributeValue
	attributes?: OTLPKeyValue[]
	droppedAttributesCount?: number
	flags?: number
	traceId?: string
	spanId?: string
}

/**
 * OTLP ScopeLogs groups logs by instrumentation scope
 */
export interface OTLPScopeLogs {
	scope?: OTLPInstrumentationScope
	logRecords: OTLPLogRecord[]
	schemaUrl?: string
}

/**
 * OTLP ResourceLogs groups logs by resource
 */
export interface OTLPResourceLogs {
	resource?: OTLPResource
	scopeLogs: OTLPScopeLogs[]
	schemaUrl?: string
}

/**
 * OTLP ExportLogsServiceRequest - the payload sent to /v1/logs
 */
export interface OTLPExportLogsServiceRequest {
	resourceLogs: OTLPResourceLogs[]
}

/**
 * Convert vestig SpanStatus to OTLP StatusCode
 */
export function toOTLPStatusCode(status: SpanStatus): OTLPStatusCode {
	switch (status) {
		case 'ok':
			return OTLPStatusCode.OK
		case 'error':
			return OTLPStatusCode.ERROR
		case 'unset':
		default:
			return OTLPStatusCode.UNSET
	}
}

/**
 * Convert a value to an OTLP attribute value
 */
export function toOTLPAttributeValue(value: unknown): OTLPAttributeValue {
	if (value === null || value === undefined) {
		return { stringValue: '' }
	}

	if (typeof value === 'string') {
		return { stringValue: value }
	}

	if (typeof value === 'number') {
		if (Number.isInteger(value)) {
			return { intValue: String(value) }
		}
		return { doubleValue: value }
	}

	if (typeof value === 'boolean') {
		return { boolValue: value }
	}

	if (Array.isArray(value)) {
		return {
			arrayValue: {
				values: value.map(toOTLPAttributeValue),
			},
		}
	}

	if (typeof value === 'object') {
		const kvList: OTLPKeyValue[] = []
		for (const [k, v] of Object.entries(value)) {
			kvList.push({
				key: k,
				value: toOTLPAttributeValue(v),
			})
		}
		return { kvlistValue: { values: kvList } }
	}

	// Fallback: stringify
	return { stringValue: String(value) }
}

/**
 * Convert a Record to OTLP key-value pairs
 */
export function toOTLPAttributes(attrs: Record<string, unknown>): OTLPKeyValue[] {
	const result: OTLPKeyValue[] = []
	for (const [key, value] of Object.entries(attrs)) {
		if (value !== undefined) {
			result.push({
				key,
				value: toOTLPAttributeValue(value),
			})
		}
	}
	return result
}

/**
 * Convert milliseconds timestamp to nanoseconds string (OTLP format)
 */
export function msToNano(ms: number): string {
	// Convert ms to nanoseconds (ms * 1_000_000)
	// Use BigInt for precision with large numbers
	return String(BigInt(Math.round(ms)) * BigInt(1_000_000))
}

/**
 * Convert ISO date string to nanoseconds string
 */
export function isoToNano(isoString: string): string {
	const ms = new Date(isoString).getTime()
	return msToNano(ms)
}

/**
 * Convert vestig Span to OTLP Span format
 */
export function toOTLPSpan(span: Span, epochStartMs: number): OTLPSpan {
	// Calculate absolute timestamps from performance.now() offsets
	const startTimeMs = epochStartMs + span.startTime
	const endTimeMs = span.endTime !== undefined ? epochStartMs + span.endTime : Date.now()

	const otlpSpan: OTLPSpan = {
		traceId: span.traceId,
		spanId: span.spanId,
		name: span.name,
		kind: OTLPSpanKind.INTERNAL,
		startTimeUnixNano: msToNano(startTimeMs),
		endTimeUnixNano: msToNano(endTimeMs),
		status: {
			code: toOTLPStatusCode(span.status),
			message: span.statusMessage,
		},
	}

	// Add parent span ID if present
	if (span.parentSpanId) {
		otlpSpan.parentSpanId = span.parentSpanId
	}

	// Add attributes
	const attrs = span.attributes
	if (Object.keys(attrs).length > 0) {
		otlpSpan.attributes = toOTLPAttributes(attrs)
	}

	// Add events
	const events = span.events
	if (events.length > 0) {
		otlpSpan.events = events.map((e) => ({
			timeUnixNano: isoToNano(e.timestamp),
			name: e.name,
			attributes: e.attributes ? toOTLPAttributes(e.attributes) : undefined,
		}))
	}

	return otlpSpan
}
