import { beforeEach, describe, expect, test } from 'bun:test'
import { WideEventBuilderImpl, createWideEvent } from '../../wide-events/builder'
import type { WideEventBuilder } from '../../wide-events/types'

describe('createWideEvent', () => {
	test('should create a WideEventBuilderImpl instance', () => {
		const event = createWideEvent({ type: 'http.request' })
		expect(event).toBeInstanceOf(WideEventBuilderImpl)
	})

	test('should set the event type', () => {
		const event = createWideEvent({ type: 'http.request' })
		expect(event.type).toBe('http.request')
	})

	test('should initialize with start time', () => {
		const before = performance.now()
		const event = createWideEvent({ type: 'test' })
		const after = performance.now()

		expect(event.startTime).toBeGreaterThanOrEqual(before)
		expect(event.startTime).toBeLessThanOrEqual(after)
	})

	test('should initialize with initial context', () => {
		const event = createWideEvent({
			type: 'http.request',
			context: { requestId: 'req-123', userId: 'user-456' },
		})

		expect(event.getContext().requestId).toBe('req-123')
		expect(event.getContext().userId).toBe('user-456')
	})

	test('should initialize with initial fields', () => {
		const event = createWideEvent({
			type: 'http.request',
			fields: {
				http: { method: 'GET', path: '/api/users' },
			},
		})

		expect(event.get('http', 'method')).toBe('GET')
		expect(event.get('http', 'path')).toBe('/api/users')
	})
})

describe('WideEventBuilder', () => {
	let event: WideEventBuilder

	beforeEach(() => {
		event = createWideEvent({ type: 'test.event' })
	})

	describe('set and get', () => {
		test('should set and get a single field', () => {
			event.set('user', 'id', 'user-123')
			expect(event.get('user', 'id')).toBe('user-123')
		})

		test('should set multiple fields in same category', () => {
			event.set('http', 'method', 'POST')
			event.set('http', 'path', '/api/checkout')
			event.set('http', 'status', 200)

			expect(event.get('http', 'method')).toBe('POST')
			expect(event.get('http', 'path')).toBe('/api/checkout')
			expect(event.get('http', 'status')).toBe(200)
		})

		test('should set fields in different categories', () => {
			event.set('user', 'id', 'user-123')
			event.set('http', 'method', 'GET')
			event.set('performance', 'db_queries', 5)

			expect(event.get('user', 'id')).toBe('user-123')
			expect(event.get('http', 'method')).toBe('GET')
			expect(event.get('performance', 'db_queries')).toBe(5)
		})

		test('should overwrite existing field', () => {
			event.set('user', 'id', 'user-123')
			event.set('user', 'id', 'user-456')

			expect(event.get('user', 'id')).toBe('user-456')
		})

		test('should return undefined for non-existent field', () => {
			expect(event.get('nonexistent', 'field')).toBeUndefined()
		})

		test('should support chaining', () => {
			const result = event
				.set('user', 'id', 'user-123')
				.set('user', 'name', 'Test')
				.set('http', 'method', 'GET')

			expect(result).toBe(event)
			expect(event.get('user', 'id')).toBe('user-123')
		})
	})

	describe('merge', () => {
		test('should merge fields into a category', () => {
			event.merge('user', { id: 'user-123', name: 'Test User', tier: 'premium' })

			expect(event.get('user', 'id')).toBe('user-123')
			expect(event.get('user', 'name')).toBe('Test User')
			expect(event.get('user', 'tier')).toBe('premium')
		})

		test('should merge with existing fields', () => {
			event.set('user', 'id', 'user-123')
			event.merge('user', { name: 'Test', email: 'test@example.com' })

			expect(event.get('user', 'id')).toBe('user-123')
			expect(event.get('user', 'name')).toBe('Test')
			expect(event.get('user', 'email')).toBe('test@example.com')
		})

		test('should support chaining', () => {
			const result = event.merge('user', { id: 'user-123' }).merge('http', { method: 'GET' })

			expect(result).toBe(event)
		})
	})

	describe('mergeAll', () => {
		test('should merge multiple categories at once', () => {
			event.mergeAll({
				user: { id: 'user-123', tier: 'premium' },
				http: { method: 'POST', path: '/checkout' },
				cart: { items: 3, total: 99.99 },
			})

			expect(event.get('user', 'id')).toBe('user-123')
			expect(event.get('http', 'method')).toBe('POST')
			expect(event.get('cart', 'total')).toBe(99.99)
		})
	})

	describe('context', () => {
		test('should set context', () => {
			event.setContext({ requestId: 'req-123', traceId: 'trace-456' })

			const ctx = event.getContext()
			expect(ctx.requestId).toBe('req-123')
			expect(ctx.traceId).toBe('trace-456')
		})

		test('should merge context', () => {
			event.setContext({ requestId: 'req-123' })
			event.setContext({ userId: 'user-456' })

			const ctx = event.getContext()
			expect(ctx.requestId).toBe('req-123')
			expect(ctx.userId).toBe('user-456')
		})

		test('should return a copy of context', () => {
			event.setContext({ requestId: 'req-123' })
			const ctx1 = event.getContext()
			const ctx2 = event.getContext()

			expect(ctx1).not.toBe(ctx2)
			expect(ctx1).toEqual(ctx2)
		})
	})

	describe('getFields', () => {
		test('should return all fields', () => {
			event.set('user', 'id', 'user-123')
			event.set('http', 'method', 'GET')

			const fields = event.getFields()
			expect(fields.user?.id).toBe('user-123')
			expect(fields.http?.method).toBe('GET')
		})

		test('should return a deep copy', () => {
			event.set('user', 'id', 'user-123')

			const fields1 = event.getFields()
			const fields2 = event.getFields()

			expect(fields1).not.toBe(fields2)
			expect(fields1.user).not.toBe(fields2.user)
		})
	})

	describe('end', () => {
		test('should return a WideEvent', () => {
			event.set('http', 'method', 'GET')

			const wideEvent = event.end()

			expect(wideEvent.event_type).toBe('test.event')
			expect(wideEvent.status).toBe('success')
			expect(wideEvent.level).toBe('info')
		})

		test('should include timing information', () => {
			const wideEvent = event.end()

			expect(wideEvent.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
			expect(wideEvent.ended_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
			expect(wideEvent.duration_ms).toBeGreaterThanOrEqual(0)
		})

		test('should include all fields', () => {
			event.set('user', 'id', 'user-123')
			event.set('http', 'method', 'POST')

			const wideEvent = event.end()

			expect(wideEvent.fields.user?.id).toBe('user-123')
			expect(wideEvent.fields.http?.method).toBe('POST')
		})

		test('should include context', () => {
			event.setContext({ requestId: 'req-123' })

			const wideEvent = event.end()

			expect(wideEvent.context.requestId).toBe('req-123')
		})

		test('should set error status when error provided', () => {
			const error = new Error('Something went wrong')
			const wideEvent = event.end({ error })

			expect(wideEvent.status).toBe('error')
			expect(wideEvent.level).toBe('error')
			expect(wideEvent.error?.name).toBe('Error')
			expect(wideEvent.error?.message).toBe('Something went wrong')
		})

		test('should allow status override', () => {
			const wideEvent = event.end({ status: 'timeout' })
			expect(wideEvent.status).toBe('timeout')
		})

		test('should allow level override', () => {
			const wideEvent = event.end({ level: 'warn' })
			expect(wideEvent.level).toBe('warn')
		})

		test('should merge final fields', () => {
			event.set('http', 'method', 'POST')

			const wideEvent = event.end({
				fields: {
					http: { status: 200 },
					performance: { db_queries: 3 },
				},
			})

			expect(wideEvent.fields.http?.method).toBe('POST')
			expect(wideEvent.fields.http?.status).toBe(200)
			expect(wideEvent.fields.performance?.db_queries).toBe(3)
		})

		test('should mark event as ended', () => {
			expect(event.ended).toBe(false)
			event.end()
			expect(event.ended).toBe(true)
		})

		test('should throw if modified after end', () => {
			event.end()

			expect(() => event.set('user', 'id', 'test')).toThrow()
			expect(() => event.merge('user', {})).toThrow()
			expect(() => event.mergeAll({})).toThrow()
			expect(() => event.setContext({})).toThrow()
			expect(() => event.end()).toThrow()
		})
	})

	describe('toMetadata', () => {
		test('should flatten fields to dot notation', () => {
			event.set('user', 'id', 'user-123')
			event.set('http', 'method', 'GET')

			const metadata = event.toMetadata()

			expect(metadata['user.id']).toBe('user-123')
			expect(metadata['http.method']).toBe('GET')
		})

		test('should include event type and timing', () => {
			const metadata = event.toMetadata()

			expect(metadata.event_type).toBe('test.event')
			expect(metadata.started_at).toBeDefined()
			expect(metadata.duration_ms).toBeGreaterThanOrEqual(0)
		})

		test('should include context with prefix', () => {
			event.setContext({ requestId: 'req-123' })

			const metadata = event.toMetadata()

			expect(metadata['context.requestId']).toBe('req-123')
		})
	})
})

describe('WideEventBuilder context integration', () => {
	test('should preserve initial context through lifecycle', () => {
		const event = createWideEvent({
			type: 'http.request',
			context: { requestId: 'req-123' },
		})

		event.setContext({ userId: 'user-456' })
		event.set('http', 'method', 'GET')

		const wideEvent = event.end()

		expect(wideEvent.context.requestId).toBe('req-123')
		expect(wideEvent.context.userId).toBe('user-456')
	})
})
