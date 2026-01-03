import { beforeEach, describe, expect, test } from 'bun:test'
import { clearActiveSpans, pushSpan } from '../../tracing/context'
import { SpanImpl } from '../../tracing/span'

describe('SpanImpl', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	describe('constructor', () => {
		test('should create span with correct name', () => {
			const span = new SpanImpl('test-operation')
			expect(span.name).toBe('test-operation')
		})

		test('should generate valid spanId (16 hex chars)', () => {
			const span = new SpanImpl('test')
			expect(span.spanId).toHaveLength(16)
			expect(/^[0-9a-f]{16}$/.test(span.spanId)).toBe(true)
		})

		test('should generate valid traceId (32 hex chars)', () => {
			const span = new SpanImpl('test')
			expect(span.traceId).toHaveLength(32)
			expect(/^[0-9a-f]{32}$/.test(span.traceId)).toBe(true)
		})

		test('should generate unique spanIds', () => {
			const spans = Array.from({ length: 100 }, () => new SpanImpl('test'))
			const ids = new Set(spans.map((s) => s.spanId))
			expect(ids.size).toBe(100)
		})

		test('should set startTime from performance.now()', () => {
			const before = performance.now()
			const span = new SpanImpl('test')
			const after = performance.now()

			expect(span.startTime).toBeGreaterThanOrEqual(before)
			expect(span.startTime).toBeLessThanOrEqual(after)
		})

		test('should initialize with status "unset"', () => {
			const span = new SpanImpl('test')
			expect(span.status).toBe('unset')
		})

		test('should initialize with no parentSpanId', () => {
			const span = new SpanImpl('test')
			expect(span.parentSpanId).toBeUndefined()
		})

		test('should inherit traceId from parent span', () => {
			const parent = new SpanImpl('parent')
			pushSpan(parent)

			const child = new SpanImpl('child')
			expect(child.traceId).toBe(parent.traceId)
			expect(child.parentSpanId).toBe(parent.spanId)
		})

		test('should use explicit parentSpan from options', () => {
			const parent = new SpanImpl('parent')
			const child = new SpanImpl('child', { parentSpan: parent })

			expect(child.traceId).toBe(parent.traceId)
			expect(child.parentSpanId).toBe(parent.spanId)
		})

		test('should prefer explicit parentSpan over active span', () => {
			const activeParent = new SpanImpl('active-parent')
			pushSpan(activeParent)

			const explicitParent = new SpanImpl('explicit-parent')
			const child = new SpanImpl('child', { parentSpan: explicitParent })

			expect(child.parentSpanId).toBe(explicitParent.spanId)
			expect(child.parentSpanId).not.toBe(activeParent.spanId)
		})

		test('should apply initial attributes from options', () => {
			const span = new SpanImpl('test', {
				attributes: { key1: 'value1', key2: 42 },
			})

			expect(span.attributes).toEqual({ key1: 'value1', key2: 42 })
		})
	})

	describe('setAttribute / setAttributes', () => {
		test('should set single attribute', () => {
			const span = new SpanImpl('test')
			span.setAttribute('key', 'value')

			expect(span.attributes).toEqual({ key: 'value' })
		})

		test('should set multiple attributes at once', () => {
			const span = new SpanImpl('test')
			span.setAttributes({ key1: 'value1', key2: 42 })

			expect(span.attributes).toEqual({ key1: 'value1', key2: 42 })
		})

		test('should accumulate attributes', () => {
			const span = new SpanImpl('test')
			span.setAttribute('key1', 'value1')
			span.setAttributes({ key2: 'value2', key3: 'value3' })
			span.setAttribute('key4', 'value4')

			expect(span.attributes).toEqual({
				key1: 'value1',
				key2: 'value2',
				key3: 'value3',
				key4: 'value4',
			})
		})

		test('should overwrite existing attributes', () => {
			const span = new SpanImpl('test')
			span.setAttribute('key', 'original')
			span.setAttribute('key', 'updated')

			expect(span.attributes).toEqual({ key: 'updated' })
		})

		test('should not modify attributes after span ends', () => {
			const span = new SpanImpl('test')
			span.setAttribute('before', 'value')
			span.end()
			span.setAttribute('after', 'value')

			expect(span.attributes).toEqual({ before: 'value' })
			expect(span.attributes.after).toBeUndefined()
		})

		test('should return a copy of attributes (immutable)', () => {
			const span = new SpanImpl('test')
			span.setAttribute('key', 'value')

			const attrs = span.attributes
			attrs.newKey = 'newValue'

			expect(span.attributes.newKey).toBeUndefined()
		})
	})

	describe('addEvent', () => {
		test('should add event with name and timestamp', () => {
			const span = new SpanImpl('test')
			span.addEvent('event-name')

			expect(span.events).toHaveLength(1)
			expect(span.events[0]?.name).toBe('event-name')
			expect(span.events[0]?.timestamp).toBeDefined()
		})

		test('should add event with attributes', () => {
			const span = new SpanImpl('test')
			span.addEvent('event-name', { key: 'value' })

			expect(span.events[0]?.attributes).toEqual({ key: 'value' })
		})

		test('should not add attributes if empty object', () => {
			const span = new SpanImpl('test')
			span.addEvent('event-name', {})

			expect(span.events[0]?.attributes).toBeUndefined()
		})

		test('should generate ISO timestamp', () => {
			const span = new SpanImpl('test')
			span.addEvent('event')

			const timestamp = span.events[0]?.timestamp
			expect(() => new Date(timestamp)).not.toThrow()
			expect(new Date(timestamp).toISOString()).toBe(timestamp)
		})

		test('should accumulate multiple events', () => {
			const span = new SpanImpl('test')
			span.addEvent('event1')
			span.addEvent('event2')
			span.addEvent('event3')

			expect(span.events).toHaveLength(3)
			expect(span.events.map((e) => e.name)).toEqual(['event1', 'event2', 'event3'])
		})

		test('should not add events after span ends', () => {
			const span = new SpanImpl('test')
			span.addEvent('before')
			span.end()
			span.addEvent('after')

			expect(span.events).toHaveLength(1)
			expect(span.events[0]?.name).toBe('before')
		})

		test('should return a copy of events (immutable)', () => {
			const span = new SpanImpl('test')
			span.addEvent('event')

			const events = span.events
			// Even though we can mutate the copy, the original is unchanged
			;(events as any).push({ name: 'injected', timestamp: '' })

			expect(span.events).toHaveLength(1)
			expect(span.events[0]?.name).toBe('event')
		})
	})

	describe('setStatus', () => {
		test('should set status to ok', () => {
			const span = new SpanImpl('test')
			span.setStatus('ok')

			expect(span.status).toBe('ok')
		})

		test('should set status to error', () => {
			const span = new SpanImpl('test')
			span.setStatus('error')

			expect(span.status).toBe('error')
		})

		test('should set status with message', () => {
			const span = new SpanImpl('test')
			span.setStatus('error', 'Something went wrong')

			expect(span.status).toBe('error')
			expect(span.statusMessage).toBe('Something went wrong')
		})

		test('should allow updating status before end', () => {
			const span = new SpanImpl('test')
			span.setStatus('ok')
			span.setStatus('error', 'Changed')

			expect(span.status).toBe('error')
		})

		test('should not update status after span ends', () => {
			const span = new SpanImpl('test')
			span.setStatus('ok')
			span.end()
			span.setStatus('error')

			expect(span.status).toBe('ok')
		})
	})

	describe('end', () => {
		test('should set endTime', () => {
			const span = new SpanImpl('test')
			expect(span.endTime).toBeUndefined()

			span.end()
			expect(span.endTime).toBeDefined()
			expect(typeof span.endTime).toBe('number')
		})

		test('should calculate duration', () => {
			const span = new SpanImpl('test')
			expect(span.duration).toBeUndefined()

			// Small delay to ensure measurable duration
			const start = performance.now()
			while (performance.now() - start < 1) {
				// busy wait for at least 1ms
			}

			span.end()
			expect(span.duration).toBeDefined()
			expect(span.duration).toBeGreaterThanOrEqual(0)
		})

		test('should mark span as ended', () => {
			const span = new SpanImpl('test')
			expect(span.ended).toBe(false)

			span.end()
			expect(span.ended).toBe(true)
		})

		test('should only end once (idempotent)', () => {
			const span = new SpanImpl('test')
			span.end()
			const firstEndTime = span.endTime

			// Wait a bit
			const start = performance.now()
			while (performance.now() - start < 1) {
				// busy wait
			}

			span.end()
			expect(span.endTime).toBe(firstEndTime)
		})
	})

	describe('status setters', () => {
		test('should allow setting status via property', () => {
			const span = new SpanImpl('test')
			span.status = 'ok'

			expect(span.status).toBe('ok')
		})

		test('should allow setting statusMessage via property', () => {
			const span = new SpanImpl('test')
			span.statusMessage = 'test message'

			expect(span.statusMessage).toBe('test message')
		})

		test('should not set status via property after end', () => {
			const span = new SpanImpl('test')
			span.end()
			span.status = 'error'

			expect(span.status).toBe('unset')
		})
	})

	describe('toJSON', () => {
		test('should serialize all span data', () => {
			const span = new SpanImpl('test-op', { attributes: { initial: true } })
			span.setAttribute('added', 'value')
			span.addEvent('checkpoint')
			span.setStatus('ok', 'Success')
			span.end()

			const json = span.toJSON()

			expect(json).toEqual({
				spanId: span.spanId,
				traceId: span.traceId,
				parentSpanId: undefined,
				name: 'test-op',
				startTime: span.startTime,
				endTime: span.endTime,
				duration: span.duration,
				status: 'ok',
				statusMessage: 'Success',
				attributes: { initial: true, added: 'value' },
				events: span.events,
			})
		})

		test('should include parentSpanId when present', () => {
			const parent = new SpanImpl('parent')
			const child = new SpanImpl('child', { parentSpan: parent })

			const json = child.toJSON()
			expect(json.parentSpanId).toBe(parent.spanId)
		})
	})
})
