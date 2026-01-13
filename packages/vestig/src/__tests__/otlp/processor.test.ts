import { afterEach, describe, expect, test } from 'bun:test'
import {
	flushSpanProcessors,
	getSpanProcessors,
	registerSpanProcessor,
	shutdownSpanProcessors,
	spanProcessors,
	unregisterSpanProcessor,
} from '../../otlp/processor'
import type { SpanProcessor } from '../../otlp/processor'
import type { Span } from '../../tracing/types'
import { SpanImpl } from '../../tracing/span'

describe('SpanProcessor Registry', () => {
	afterEach(async () => {
		// Clean up processors after each test
		spanProcessors.clearProcessors()
	})

	describe('registerSpanProcessor', () => {
		test('should add processor to registry', () => {
			const processor: SpanProcessor = {
				onEnd: () => {},
			}

			registerSpanProcessor(processor)

			expect(getSpanProcessors()).toContain(processor)
		})

		test('should allow multiple processors', () => {
			const processor1: SpanProcessor = { onEnd: () => {} }
			const processor2: SpanProcessor = { onEnd: () => {} }

			registerSpanProcessor(processor1)
			registerSpanProcessor(processor2)

			expect(getSpanProcessors().length).toBe(2)
		})
	})

	describe('unregisterSpanProcessor', () => {
		test('should remove processor from registry', () => {
			const processor: SpanProcessor = { onEnd: () => {} }

			registerSpanProcessor(processor)
			const removed = unregisterSpanProcessor(processor)

			expect(removed).toBe(true)
			expect(getSpanProcessors()).not.toContain(processor)
		})

		test('should return false for non-existent processor', () => {
			const processor: SpanProcessor = { onEnd: () => {} }

			const removed = unregisterSpanProcessor(processor)

			expect(removed).toBe(false)
		})
	})

	describe('notifyStart', () => {
		test('should notify all processors on span start', () => {
			const startedSpans: Span[] = []
			const processor: SpanProcessor = {
				onStart: (span) => startedSpans.push(span),
				onEnd: () => {},
			}

			registerSpanProcessor(processor)

			// Creating a span triggers notifyStart
			const span = new SpanImpl('test')

			expect(startedSpans.length).toBe(1)
			expect(startedSpans[0]).toBe(span)

			span.end()
		})

		test('should handle processor without onStart', () => {
			const processor: SpanProcessor = {
				onEnd: () => {},
			}

			registerSpanProcessor(processor)

			// Should not throw
			expect(() => new SpanImpl('test').end()).not.toThrow()
		})
	})

	describe('notifyEnd', () => {
		test('should notify all processors on span end', () => {
			const endedSpans: Span[] = []
			const processor: SpanProcessor = {
				onEnd: (span) => endedSpans.push(span),
			}

			registerSpanProcessor(processor)

			const span = new SpanImpl('test')
			span.end()

			expect(endedSpans.length).toBe(1)
			expect(endedSpans[0]).toBe(span)
		})

		test('should notify multiple processors', () => {
			let count = 0
			const processor1: SpanProcessor = { onEnd: () => count++ }
			const processor2: SpanProcessor = { onEnd: () => count++ }

			registerSpanProcessor(processor1)
			registerSpanProcessor(processor2)

			new SpanImpl('test').end()

			expect(count).toBe(2)
		})

		test('should continue notifying even if one processor throws', () => {
			const endedSpans: Span[] = []
			const processor1: SpanProcessor = {
				onEnd: () => {
					throw new Error('Processor error')
				},
			}
			const processor2: SpanProcessor = {
				onEnd: (span) => endedSpans.push(span),
			}

			registerSpanProcessor(processor1)
			registerSpanProcessor(processor2)

			// Should not throw, and processor2 should still be called
			const span = new SpanImpl('test')
			span.end()

			expect(endedSpans.length).toBe(1)
		})
	})

	describe('flushSpanProcessors', () => {
		test('should call forceFlush on all processors', async () => {
			let flushed = 0
			const processor: SpanProcessor = {
				onEnd: () => {},
				forceFlush: async () => {
					flushed++
				},
			}

			registerSpanProcessor(processor)
			await flushSpanProcessors()

			expect(flushed).toBe(1)
		})

		test('should handle processors without forceFlush', async () => {
			const processor: SpanProcessor = {
				onEnd: () => {},
			}

			registerSpanProcessor(processor)

			// Should not throw
			await expect(flushSpanProcessors()).resolves.toBeUndefined()
		})
	})

	describe('shutdownSpanProcessors', () => {
		test('should call shutdown on all processors', async () => {
			let shutdown = 0
			const processor: SpanProcessor = {
				onEnd: () => {},
				shutdown: async () => {
					shutdown++
				},
			}

			registerSpanProcessor(processor)
			await shutdownSpanProcessors()

			expect(shutdown).toBe(1)
		})

		test('should clear all processors after shutdown', async () => {
			const processor: SpanProcessor = {
				onEnd: () => {},
			}

			registerSpanProcessor(processor)
			await shutdownSpanProcessors()

			expect(getSpanProcessors().length).toBe(0)
		})
	})
})
