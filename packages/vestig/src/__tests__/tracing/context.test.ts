import { beforeEach, describe, expect, test } from 'bun:test'
import { getContext } from '../../context'
import {
	clearActiveSpans,
	getActiveSpan,
	getActiveSpanStackDepth,
	popSpan,
	pushSpan,
	withSpanContext,
	withSpanContextAsync,
} from '../../tracing/context'
import { SpanImpl } from '../../tracing/span'

describe('Span Context Management', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	describe('pushSpan / popSpan', () => {
		test('should push span onto stack', () => {
			const span = new SpanImpl('test')
			expect(getActiveSpanStackDepth()).toBe(0)

			pushSpan(span)
			expect(getActiveSpanStackDepth()).toBe(1)
		})

		test('should pop span from stack', () => {
			const span = new SpanImpl('test')
			pushSpan(span)

			const popped = popSpan()
			expect(popped).toBe(span)
			expect(getActiveSpanStackDepth()).toBe(0)
		})

		test('should pop in LIFO order', () => {
			const span1 = new SpanImpl('first')
			const span2 = new SpanImpl('second')
			const span3 = new SpanImpl('third')

			pushSpan(span1)
			pushSpan(span2)
			pushSpan(span3)

			expect(popSpan()).toBe(span3)
			expect(popSpan()).toBe(span2)
			expect(popSpan()).toBe(span1)
		})

		test('should return undefined when popping empty stack', () => {
			expect(popSpan()).toBeUndefined()
		})
	})

	describe('getActiveSpan', () => {
		test('should return undefined when no active span', () => {
			expect(getActiveSpan()).toBeUndefined()
		})

		test('should return current active span', () => {
			const span = new SpanImpl('test')
			pushSpan(span)

			expect(getActiveSpan()).toBe(span)
		})

		test('should return most recently pushed span', () => {
			const span1 = new SpanImpl('first')
			const span2 = new SpanImpl('second')

			pushSpan(span1)
			pushSpan(span2)

			expect(getActiveSpan()).toBe(span2)
		})

		test('should update when spans are popped', () => {
			const span1 = new SpanImpl('first')
			const span2 = new SpanImpl('second')

			pushSpan(span1)
			pushSpan(span2)

			popSpan()
			expect(getActiveSpan()).toBe(span1)

			popSpan()
			expect(getActiveSpan()).toBeUndefined()
		})
	})

	describe('clearActiveSpans', () => {
		test('should clear all active spans', () => {
			pushSpan(new SpanImpl('a'))
			pushSpan(new SpanImpl('b'))
			pushSpan(new SpanImpl('c'))

			expect(getActiveSpanStackDepth()).toBe(3)

			clearActiveSpans()

			expect(getActiveSpanStackDepth()).toBe(0)
			expect(getActiveSpan()).toBeUndefined()
		})
	})

	describe('getActiveSpanStackDepth', () => {
		test('should return 0 for empty stack', () => {
			expect(getActiveSpanStackDepth()).toBe(0)
		})

		test('should return correct depth', () => {
			pushSpan(new SpanImpl('a'))
			expect(getActiveSpanStackDepth()).toBe(1)

			pushSpan(new SpanImpl('b'))
			expect(getActiveSpanStackDepth()).toBe(2)

			popSpan()
			expect(getActiveSpanStackDepth()).toBe(1)
		})
	})

	describe('withSpanContext (sync)', () => {
		test('should set span as active during execution', () => {
			const span = new SpanImpl('test')
			let activeInside: typeof span | undefined

			withSpanContext(span, () => {
				activeInside = getActiveSpan()
			})

			expect(activeInside).toBe(span)
		})

		test('should restore previous active span after execution', () => {
			const outer = new SpanImpl('outer')
			const inner = new SpanImpl('inner')

			pushSpan(outer)

			withSpanContext(inner, () => {
				expect(getActiveSpan()).toBe(inner)
			})

			expect(getActiveSpan()).toBe(outer)
		})

		test('should return function result', () => {
			const span = new SpanImpl('test')

			const result = withSpanContext(span, () => 42)
			expect(result).toBe(42)
		})

		test('should propagate errors and still restore context', () => {
			const span = new SpanImpl('test')
			const error = new Error('test error')

			expect(() => {
				withSpanContext(span, () => {
					throw error
				})
			}).toThrow(error)

			expect(getActiveSpan()).toBeUndefined()
		})

		test('should propagate trace context to getContext()', () => {
			const span = new SpanImpl('test')
			let contextInside: ReturnType<typeof getContext>

			withSpanContext(span, () => {
				contextInside = getContext()
			})

			expect(contextInside!).toEqual({
				traceId: span.traceId,
				spanId: span.spanId,
			})
		})
	})

	describe('withSpanContextAsync (async)', () => {
		test('should set span as active during async execution', async () => {
			const span = new SpanImpl('test')
			let activeInside: typeof span | undefined

			await withSpanContextAsync(span, async () => {
				await Promise.resolve()
				activeInside = getActiveSpan()
			})

			expect(activeInside).toBe(span)
		})

		test('should restore previous active span after async execution', async () => {
			const outer = new SpanImpl('outer')
			const inner = new SpanImpl('inner')

			pushSpan(outer)

			await withSpanContextAsync(inner, async () => {
				await Promise.resolve()
				expect(getActiveSpan()).toBe(inner)
			})

			expect(getActiveSpan()).toBe(outer)
		})

		test('should return async function result', async () => {
			const span = new SpanImpl('test')

			const result = await withSpanContextAsync(span, async () => {
				await Promise.resolve()
				return 42
			})

			expect(result).toBe(42)
		})

		test('should propagate async errors and still restore context', async () => {
			const span = new SpanImpl('test')
			const error = new Error('async error')

			await expect(
				withSpanContextAsync(span, async () => {
					await Promise.resolve()
					throw error
				}),
			).rejects.toThrow(error)

			expect(getActiveSpan()).toBeUndefined()
		})

		test('should propagate trace context to getContext() in async', async () => {
			const span = new SpanImpl('test')
			let contextInside: ReturnType<typeof getContext>

			await withSpanContextAsync(span, async () => {
				await Promise.resolve()
				contextInside = getContext()
			})

			expect(contextInside!).toEqual({
				traceId: span.traceId,
				spanId: span.spanId,
			})
		})

		test('should handle nested async contexts', async () => {
			const outer = new SpanImpl('outer')
			const inner = new SpanImpl('inner')

			const results: string[] = []

			await withSpanContextAsync(outer, async () => {
				results.push(`outer-start: ${getActiveSpan()?.name}`)

				await withSpanContextAsync(inner, async () => {
					results.push(`inner: ${getActiveSpan()?.name}`)
				})

				results.push(`outer-end: ${getActiveSpan()?.name}`)
			})

			expect(results).toEqual(['outer-start: outer', 'inner: inner', 'outer-end: outer'])
		})
	})
})
