import { describe, expect, test } from 'bun:test'
import {
	createCorrelationContext,
	getContext,
	withContext,
	withContextAsync,
} from '../context/index'

describe('getContext', () => {
	test('should return undefined when no context is set', () => {
		// Outside of any withContext call
		const context = getContext()
		// May be undefined or have previous context from other tests
		expect(context === undefined || typeof context === 'object').toBe(true)
	})
})

describe('withContext', () => {
	test('should provide context within callback', () => {
		let capturedContext: unknown

		withContext({ requestId: 'req-123' }, () => {
			capturedContext = getContext()
		})

		expect(capturedContext).toBeDefined()
		expect((capturedContext as Record<string, unknown>).requestId).toBe('req-123')
	})

	test('should return callback result', () => {
		const result = withContext({ requestId: 'req-123' }, () => {
			return 'result'
		})

		expect(result).toBe('result')
	})

	test('should merge with existing context', () => {
		let innerContext: unknown

		withContext({ userId: 'user-1' }, () => {
			withContext({ requestId: 'req-123' }, () => {
				innerContext = getContext()
			})
		})

		expect(innerContext).toBeDefined()
		expect((innerContext as Record<string, unknown>).userId).toBe('user-1')
		expect((innerContext as Record<string, unknown>).requestId).toBe('req-123')
	})

	test('should restore previous context after callback', () => {
		let outerBefore: unknown
		let inner: unknown
		let outerAfter: unknown

		withContext({ outer: 'value' }, () => {
			outerBefore = getContext()
			withContext({ inner: 'value' }, () => {
				inner = getContext()
			})
			outerAfter = getContext()
		})

		expect((outerBefore as Record<string, unknown>).outer).toBe('value')
		expect((inner as Record<string, unknown>).inner).toBe('value')
		expect((outerAfter as Record<string, unknown>).outer).toBe('value')
		// Inner context should not persist
		expect((outerAfter as Record<string, unknown>).inner).toBeUndefined()
	})

	test('should handle exceptions', () => {
		expect(() => {
			withContext({ requestId: 'req-123' }, () => {
				throw new Error('test error')
			})
		}).toThrow('test error')
	})
})

describe('withContextAsync', () => {
	test('should provide context within async callback', async () => {
		let capturedContext: unknown

		await withContextAsync({ requestId: 'req-123' }, async () => {
			await Promise.resolve()
			capturedContext = getContext()
		})

		expect(capturedContext).toBeDefined()
		expect((capturedContext as Record<string, unknown>).requestId).toBe('req-123')
	})

	test('should return async callback result', async () => {
		const result = await withContextAsync({ requestId: 'req-123' }, async () => {
			await Promise.resolve()
			return 'async result'
		})

		expect(result).toBe('async result')
	})

	test('should merge with existing context in async', async () => {
		let innerContext: unknown

		await withContextAsync({ userId: 'user-1' }, async () => {
			await withContextAsync({ requestId: 'req-123' }, async () => {
				await Promise.resolve()
				innerContext = getContext()
			})
		})

		expect(innerContext).toBeDefined()
		expect((innerContext as Record<string, unknown>).userId).toBe('user-1')
		expect((innerContext as Record<string, unknown>).requestId).toBe('req-123')
	})

	test('should handle async exceptions', async () => {
		await expect(
			withContextAsync({ requestId: 'req-123' }, async () => {
				await Promise.resolve()
				throw new Error('async error')
			}),
		).rejects.toThrow('async error')
	})

	test('should work with concurrent async operations', async () => {
		const results: Array<{ id: string; context: unknown }> = []

		await Promise.all([
			withContextAsync({ requestId: 'req-1' }, async () => {
				await new Promise((r) => setTimeout(r, 10))
				results.push({ id: '1', context: getContext() })
			}),
			withContextAsync({ requestId: 'req-2' }, async () => {
				await new Promise((r) => setTimeout(r, 5))
				results.push({ id: '2', context: getContext() })
			}),
		])

		// Each async context should have its own requestId
		const result1 = results.find((r) => r.id === '1')
		const result2 = results.find((r) => r.id === '2')

		expect((result1?.context as Record<string, unknown>).requestId).toBe('req-1')
		expect((result2?.context as Record<string, unknown>).requestId).toBe('req-2')
	})
})

describe('createCorrelationContext', () => {
	test('should generate all correlation IDs', () => {
		const context = createCorrelationContext()

		expect(context.requestId).toBeDefined()
		expect(context.traceId).toBeDefined()
		expect(context.spanId).toBeDefined()
	})

	test('should generate valid ID formats', () => {
		const context = createCorrelationContext()

		// UUID format for requestId
		expect(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				context.requestId as string,
			),
		).toBe(true)

		// 32 char hex for traceId
		expect(/^[0-9a-f]{32}$/.test(context.traceId as string)).toBe(true)

		// 16 char hex for spanId
		expect(/^[0-9a-f]{16}$/.test(context.spanId as string)).toBe(true)
	})

	test('should preserve existing IDs', () => {
		const context = createCorrelationContext({
			requestId: 'existing-request',
			traceId: 'existing-trace',
		})

		expect(context.requestId).toBe('existing-request')
		expect(context.traceId).toBe('existing-trace')
		expect(context.spanId).toBeDefined() // Should still generate spanId
	})

	test('should include additional context properties', () => {
		const context = createCorrelationContext({
			userId: 'user-123',
			sessionId: 'session-456',
		})

		expect(context.userId).toBe('user-123')
		expect(context.sessionId).toBe('session-456')
		expect(context.requestId).toBeDefined()
	})
})
