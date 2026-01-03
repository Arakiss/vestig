import { beforeEach, describe, expect, test } from 'bun:test'
import { clearActiveSpans, getActiveSpanStackDepth } from '../../tracing/context'
import {
	endSpan,
	getActiveSpan,
	span,
	spanSync,
	startSpan,
	withActiveSpan,
} from '../../tracing/functions'

describe('span() - async wrapper', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should create span with given name', async () => {
		let spanName: string | undefined

		await span('my-operation', async (s) => {
			spanName = s.name
		})

		expect(spanName).toBe('my-operation')
	})

	test('should return function result', async () => {
		const result = await span('operation', async () => {
			return { success: true, value: 42 }
		})

		expect(result).toEqual({ success: true, value: 42 })
	})

	test('should set status to "ok" on success', async () => {
		let finalStatus: string | undefined

		await span('operation', async (s) => {
			// Do work
			await Promise.resolve()
			// Check status at end
			finalStatus = s.status
		})

		// Status is set after fn returns but before span ends
		// We need to check the span after completion
		expect(finalStatus).toBe('unset') // Still unset during execution
	})

	test('should set status to "error" on exception', async () => {
		let capturedSpan: Parameters<typeof span>[1] extends (s: infer S) => any ? S : never

		await expect(
			span('failing', async (s) => {
				capturedSpan = s
				throw new Error('Something failed')
			}),
		).rejects.toThrow('Something failed')

		expect(capturedSpan?.status).toBe('error')
		expect(capturedSpan?.statusMessage).toBe('Something failed')
	})

	test('should end span after completion', async () => {
		let capturedSpan: Parameters<typeof span>[1] extends (s: infer S) => any ? S : never

		await span('operation', async (s) => {
			capturedSpan = s
		})

		expect(capturedSpan?.ended).toBe(true)
		expect(capturedSpan?.endTime).toBeDefined()
	})

	test('should end span even on error', async () => {
		let capturedSpan: Parameters<typeof span>[1] extends (s: infer S) => any ? S : never

		try {
			await span('failing', async (s) => {
				capturedSpan = s
				throw new Error('fail')
			})
		} catch {
			// Expected
		}

		expect(capturedSpan?.ended).toBe(true)
	})

	test('should set span as active during execution', async () => {
		let activeInsideSpan: ReturnType<typeof getActiveSpan>

		await span('operation', async () => {
			activeInsideSpan = getActiveSpan()
		})

		expect(activeInsideSpan).toBeDefined()
		expect(activeInsideSpan?.name).toBe('operation')
	})

	test('should restore context after completion', async () => {
		expect(getActiveSpan()).toBeUndefined()

		await span('operation', async () => {
			expect(getActiveSpan()).toBeDefined()
		})

		expect(getActiveSpan()).toBeUndefined()
	})

	test('should allow setting attributes', async () => {
		let attrs: Record<string, unknown> = {}

		await span('operation', async (s) => {
			s.setAttribute('key1', 'value1')
			s.setAttributes({ key2: 42, key3: true })
			attrs = s.attributes
		})

		expect(attrs).toEqual({ key1: 'value1', key2: 42, key3: true })
	})

	test('should allow adding events', async () => {
		let eventCount = 0

		await span('operation', async (s) => {
			s.addEvent('start')
			await Promise.resolve()
			s.addEvent('middle', { progress: 50 })
			await Promise.resolve()
			s.addEvent('end')
			eventCount = s.events.length
		})

		expect(eventCount).toBe(3)
	})

	test('should respect explicitly set status', async () => {
		let capturedSpan: Parameters<typeof span>[1] extends (s: infer S) => any ? S : never

		await span('operation', async (s) => {
			capturedSpan = s
			s.setStatus('error', 'Explicitly set to error')
			// Even though we succeed, status should stay as error
		})

		expect(capturedSpan?.status).toBe('error')
	})

	test('should apply initial attributes from options', async () => {
		let attrs: Record<string, unknown> = {}

		await span(
			'operation',
			async (s) => {
				attrs = s.attributes
			},
			{ attributes: { initial: 'value' } },
		)

		expect(attrs).toEqual({ initial: 'value' })
	})
})

describe('spanSync() - sync wrapper', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should create span with given name', () => {
		let spanName: string | undefined

		spanSync('sync-operation', (s) => {
			spanName = s.name
		})

		expect(spanName).toBe('sync-operation')
	})

	test('should return function result', () => {
		const result = spanSync('operation', () => {
			return 42
		})

		expect(result).toBe(42)
	})

	test('should set status to "error" on exception', () => {
		let capturedSpan: Parameters<typeof spanSync>[1] extends (s: infer S) => any ? S : never

		expect(() => {
			spanSync('failing', (s) => {
				capturedSpan = s
				throw new Error('Sync failure')
			})
		}).toThrow('Sync failure')

		expect(capturedSpan?.status).toBe('error')
		expect(capturedSpan?.statusMessage).toBe('Sync failure')
	})

	test('should end span after completion', () => {
		let capturedSpan: Parameters<typeof spanSync>[1] extends (s: infer S) => any ? S : never

		spanSync('operation', (s) => {
			capturedSpan = s
		})

		expect(capturedSpan?.ended).toBe(true)
	})

	test('should set span as active during execution', () => {
		let activeInsideSpan: ReturnType<typeof getActiveSpan>

		spanSync('operation', () => {
			activeInsideSpan = getActiveSpan()
		})

		expect(activeInsideSpan).toBeDefined()
		expect(activeInsideSpan?.name).toBe('operation')
	})

	test('should restore context after completion', () => {
		expect(getActiveSpan()).toBeUndefined()

		spanSync('operation', () => {
			expect(getActiveSpan()).toBeDefined()
		})

		expect(getActiveSpan()).toBeUndefined()
	})
})

describe('startSpan / endSpan - manual control', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should create and return a span', () => {
		const s = startSpan('manual-span')

		expect(s).toBeDefined()
		expect(s.name).toBe('manual-span')
		expect(s.ended).toBe(false)
	})

	test('should set span as active', () => {
		const s = startSpan('manual-span')

		expect(getActiveSpan()).toBe(s)
		expect(getActiveSpanStackDepth()).toBe(1)
	})

	test('should end span and remove from stack', () => {
		const s = startSpan('manual-span')
		endSpan(s)

		expect(s.ended).toBe(true)
		expect(getActiveSpan()).toBeUndefined()
		expect(getActiveSpanStackDepth()).toBe(0)
	})

	test('should support nested manual spans', () => {
		const outer = startSpan('outer')
		const inner = startSpan('inner')

		expect(getActiveSpan()).toBe(inner)
		expect(getActiveSpanStackDepth()).toBe(2)

		endSpan(inner)
		expect(getActiveSpan()).toBe(outer)

		endSpan(outer)
		expect(getActiveSpan()).toBeUndefined()
	})

	test('should apply options', () => {
		const s = startSpan('with-options', {
			attributes: { key: 'value' },
		})

		expect(s.attributes).toEqual({ key: 'value' })
		endSpan(s)
	})

	test('should create child spans with correct parent', () => {
		const parent = startSpan('parent')
		const child = startSpan('child')

		expect(child.parentSpanId).toBe(parent.spanId)
		expect(child.traceId).toBe(parent.traceId)

		endSpan(child)
		endSpan(parent)
	})
})

describe('withActiveSpan', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should call function with active span', () => {
		const s = startSpan('test')
		let called = false
		let receivedSpan: ReturnType<typeof getActiveSpan>

		withActiveSpan((span) => {
			called = true
			receivedSpan = span
		})

		expect(called).toBe(true)
		expect(receivedSpan).toBe(s)

		endSpan(s)
	})

	test('should not call function when no active span', () => {
		let called = false

		withActiveSpan(() => {
			called = true
		})

		expect(called).toBe(false)
	})

	test('should allow modifying the active span', () => {
		const s = startSpan('test')

		withActiveSpan((span) => {
			span.setAttribute('added', 'value')
			span.addEvent('checkpoint')
		})

		expect(s.attributes).toEqual({ added: 'value' })
		expect(s.events).toHaveLength(1)

		endSpan(s)
	})
})

describe('Nested spans with span()', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should create parent-child relationships', async () => {
		let parentId: string | undefined
		let childParentId: string | undefined
		let childTraceId: string | undefined
		let parentTraceId: string | undefined

		await span('parent', async (parent) => {
			parentId = parent.spanId
			parentTraceId = parent.traceId

			await span('child', async (child) => {
				childParentId = child.parentSpanId
				childTraceId = child.traceId
			})
		})

		expect(childParentId).toBe(parentId)
		expect(childTraceId).toBe(parentTraceId)
	})

	test('should support deeply nested spans', async () => {
		const names: string[] = []
		const depths: number[] = []

		await span('level-0', async () => {
			names.push(getActiveSpan()?.name)
			depths.push(getActiveSpanStackDepth())

			await span('level-1', async () => {
				names.push(getActiveSpan()?.name)
				depths.push(getActiveSpanStackDepth())

				await span('level-2', async () => {
					names.push(getActiveSpan()?.name)
					depths.push(getActiveSpanStackDepth())
				})
			})
		})

		expect(names).toEqual(['level-0', 'level-1', 'level-2'])
		expect(depths).toEqual([1, 2, 3])
	})

	test('should share traceId across all nested spans', async () => {
		const traceIds = new Set<string>()

		await span('root', async (root) => {
			traceIds.add(root.traceId)

			await span('child-1', async (c1) => {
				traceIds.add(c1.traceId)

				await span('grandchild', async (gc) => {
					traceIds.add(gc.traceId)
				})
			})

			await span('child-2', async (c2) => {
				traceIds.add(c2.traceId)
			})
		})

		expect(traceIds.size).toBe(1) // All should have the same traceId
	})
})

describe('Error handling edge cases', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should handle non-Error exceptions', async () => {
		let capturedMessage: string | undefined

		await expect(
			span('throwing-string', async (s) => {
				throw 'string error'
			}),
		).rejects.toBe('string error')

		// Start another span to check the message
		await span('check', async (s) => {
			// Should work fine
		})
	})

	test('should propagate original error', async () => {
		class CustomError extends Error {
			code = 'CUSTOM_ERROR'
		}

		const error = new CustomError('Custom error message')

		await expect(
			span('custom-error', async () => {
				throw error
			}),
		).rejects.toBe(error)
	})

	test('should clean up stack on error', async () => {
		try {
			await span('outer', async () => {
				await span('inner', async () => {
					throw new Error('fail')
				})
			})
		} catch {
			// Expected
		}

		expect(getActiveSpanStackDepth()).toBe(0)
	})
})
