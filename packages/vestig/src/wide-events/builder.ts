import type { LogMetadata, SerializedError } from '../types'
import { RUNTIME } from '../runtime'
import { serializeError } from '../utils/error'
import type {
	WideEvent,
	WideEventBuilder,
	WideEventConfig,
	WideEventContext,
	WideEventEndOptions,
	WideEventFields,
	WideEventStatus,
} from './types'

/**
 * Get high-resolution timestamp for duration measurement
 */
function now(): number {
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		return performance.now()
	}
	return Date.now()
}

/**
 * Implementation of WideEventBuilder.
 *
 * Accumulates context throughout a request lifecycle and
 * produces a single comprehensive event at the end.
 */
export class WideEventBuilderImpl implements WideEventBuilder {
	private readonly _type: string
	private readonly _startTime: number
	private readonly _startedAt: Date
	private _context: WideEventContext
	private _fields: WideEventFields
	private _ended: boolean = false

	constructor(config: WideEventConfig) {
		this._type = config.type
		this._startTime = now()
		this._startedAt = new Date()
		this._context = { ...config.context }
		this._fields = config.fields ? this._deepClone(config.fields) : {}
	}

	get type(): string {
		return this._type
	}

	get startTime(): number {
		return this._startTime
	}

	get ended(): boolean {
		return this._ended
	}

	set(category: string, key: string, value: unknown): this {
		this._assertNotEnded()
		if (!this._fields[category]) {
			this._fields[category] = {}
		}
		this._fields[category][key] = value
		return this
	}

	get(category: string, key: string): unknown {
		return this._fields[category]?.[key]
	}

	merge(category: string, fields: Record<string, unknown>): this {
		this._assertNotEnded()
		if (!this._fields[category]) {
			this._fields[category] = {}
		}
		Object.assign(this._fields[category], fields)
		return this
	}

	mergeAll(fields: WideEventFields): this {
		this._assertNotEnded()
		for (const [category, categoryFields] of Object.entries(fields)) {
			this.merge(category, categoryFields)
		}
		return this
	}

	setContext(context: Partial<WideEventContext>): this {
		this._assertNotEnded()
		Object.assign(this._context, context)
		return this
	}

	getContext(): WideEventContext {
		return { ...this._context }
	}

	getFields(): Readonly<WideEventFields> {
		return this._deepClone(this._fields)
	}

	end(options: WideEventEndOptions = {}): WideEvent {
		this._assertNotEnded()
		this._ended = true

		const endedAt = new Date()
		const durationMs = now() - this._startTime

		// Merge final fields if provided
		if (options.fields) {
			this.mergeAll(options.fields)
		}

		// Determine status
		let status: WideEventStatus = options.status ?? 'success'
		let error: SerializedError | undefined

		if (options.error) {
			status = options.status ?? 'error'
			error =
				'name' in options.error && 'message' in options.error
					? (options.error as SerializedError)
					: serializeError(options.error)
		}

		// Determine log level
		const level = options.level ?? (status === 'error' ? 'error' : 'info')

		return {
			started_at: this._startedAt.toISOString(),
			ended_at: endedAt.toISOString(),
			duration_ms: Math.round(durationMs * 100) / 100, // 2 decimal places
			event_type: this._type,
			status,
			context: this._context,
			runtime: RUNTIME,
			fields: this._fields,
			error,
			level,
		}
	}

	toMetadata(): LogMetadata {
		const metadata: LogMetadata = {
			event_type: this._type,
			started_at: this._startedAt.toISOString(),
			duration_ms: Math.round((now() - this._startTime) * 100) / 100,
		}

		// Flatten context
		for (const [key, value] of Object.entries(this._context)) {
			if (value !== undefined) {
				metadata[`context.${key}`] = value
			}
		}

		// Flatten fields with category prefix
		for (const [category, categoryFields] of Object.entries(this._fields)) {
			for (const [key, value] of Object.entries(categoryFields)) {
				metadata[`${category}.${key}`] = value
			}
		}

		return metadata
	}

	private _assertNotEnded(): void {
		if (this._ended) {
			throw new Error('[vestig] Cannot modify wide event after end() has been called')
		}
	}

	private _deepClone<T extends Record<string, unknown>>(obj: T): T {
		const result: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				result[key] = this._deepClone(value as Record<string, unknown>)
			} else {
				result[key] = value
			}
		}
		return result as T
	}
}

/**
 * Create a new wide event builder.
 *
 * @param config - Event configuration (type is required)
 * @returns A new WideEventBuilder instance
 *
 * @example
 * ```typescript
 * const event = createWideEvent({ type: 'http.request' });
 *
 * event.set('http', 'method', 'POST');
 * event.set('http', 'path', '/api/checkout');
 * event.set('user', 'id', userId);
 *
 * const wideEvent = event.end({ status: 'success' });
 * logger.info('Request completed', wideEvent);
 * ```
 */
export function createWideEvent(config: WideEventConfig): WideEventBuilder {
	return new WideEventBuilderImpl(config)
}
