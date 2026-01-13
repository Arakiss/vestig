import { getContext } from '../context'
import { generateSpanId, generateTraceId } from '../context/correlation'
import { spanProcessors } from '../otlp/processor'
import { getActiveSpan } from './context'
import type { Span, SpanEvent, SpanOptions, SpanStatus } from './types'

/**
 * Internal implementation of the Span interface
 */
export class SpanImpl implements Span {
	// Identity (readonly)
	readonly spanId: string
	readonly traceId: string
	readonly parentSpanId?: string
	readonly name: string
	readonly startTime: number

	// Mutable state (private backing fields)
	private _status: SpanStatus = 'unset'
	private _statusMessage?: string
	private _endTime?: number
	private _ended = false

	// Collections
	private _attributes: Record<string, unknown> = {}
	private _events: SpanEvent[] = []

	constructor(name: string, options?: SpanOptions) {
		this.name = name
		this.startTime = performance.now()

		// Determine parent span: explicit > active > none
		const parent = options?.parentSpan ?? getActiveSpan()

		// Get trace context: parent > async context > generate new
		const ctx = getContext()
		this.traceId = parent?.traceId ?? ctx?.traceId ?? generateTraceId()
		this.spanId = generateSpanId()
		this.parentSpanId = parent?.spanId

		// Apply initial attributes if provided
		if (options?.attributes) {
			this._attributes = { ...options.attributes }
		}

		// Notify all registered span processors
		spanProcessors.notifyStart(this)
	}

	// === Status accessors ===

	get status(): SpanStatus {
		return this._status
	}

	set status(value: SpanStatus) {
		if (!this._ended) {
			this._status = value
		}
	}

	get statusMessage(): string | undefined {
		return this._statusMessage
	}

	set statusMessage(value: string | undefined) {
		if (!this._ended) {
			this._statusMessage = value
		}
	}

	get endTime(): number | undefined {
		return this._endTime
	}

	get duration(): number | undefined {
		if (this._endTime === undefined) return undefined
		return this._endTime - this.startTime
	}

	get ended(): boolean {
		return this._ended
	}

	// === Collections accessors ===

	get attributes(): Record<string, unknown> {
		return { ...this._attributes }
	}

	get events(): readonly SpanEvent[] {
		return [...this._events]
	}

	// === API Methods ===

	setAttribute(key: string, value: unknown): void {
		if (this._ended) return
		this._attributes[key] = value
	}

	setAttributes(attrs: Record<string, unknown>): void {
		if (this._ended) return
		Object.assign(this._attributes, attrs)
	}

	addEvent(name: string, attributes?: Record<string, unknown>): void {
		if (this._ended) return

		const event: SpanEvent = {
			name,
			timestamp: new Date().toISOString(),
		}

		if (attributes && Object.keys(attributes).length > 0) {
			event.attributes = { ...attributes }
		}

		this._events.push(event)
	}

	setStatus(status: SpanStatus, message?: string): void {
		if (this._ended) return

		this._status = status
		this._statusMessage = message
	}

	end(): void {
		if (this._ended) return

		this._endTime = performance.now()
		this._ended = true

		// Notify all registered span processors
		spanProcessors.notifyEnd(this)
	}

	// === Serialization ===

	/**
	 * Convert span to a plain object for logging/export
	 */
	toJSON(): Record<string, unknown> {
		return {
			spanId: this.spanId,
			traceId: this.traceId,
			parentSpanId: this.parentSpanId,
			name: this.name,
			startTime: this.startTime,
			endTime: this._endTime,
			duration: this.duration,
			status: this._status,
			statusMessage: this._statusMessage,
			attributes: this._attributes,
			events: this._events,
		}
	}
}
