import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { Span } from 'vestig'
import { createVestigAction, vestigAction } from '../../server/server-action'
import { clearMockHeaders, headers as mockHeaders, setMockHeaders } from '../mocks/next-headers'

// Mock next/headers module
mock.module('next/headers', () => ({
	headers: mockHeaders,
}))

describe('vestigAction', () => {
	beforeEach(() => {
		clearMockHeaders()
	})

	afterEach(() => {
		clearMockHeaders()
	})

	describe('basic functionality', () => {
		test('should wrap an action and return a function', () => {
			const action = async (input: string) => input.toUpperCase()
			const wrapped = vestigAction(action)

			expect(typeof wrapped).toBe('function')
		})

		test('should call the action and return its result', async () => {
			const action = async (input: string) => input.toUpperCase()
			const wrapped = vestigAction(action)

			const result = await wrapped('hello')

			expect(result).toBe('HELLO')
		})

		test('should pass input to the action', async () => {
			let receivedInput = ''
			const action = async (input: string) => {
				receivedInput = input
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped('test-input')

			expect(receivedInput).toBe('test-input')
		})

		test('should provide action context with log, ctx, and span', async () => {
			let contextReceived = false
			const action = async (_input: string, ctx: any) => {
				expect(ctx).toHaveProperty('log')
				expect(ctx).toHaveProperty('ctx')
				expect(ctx).toHaveProperty('span')
				contextReceived = true
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped('test')

			expect(contextReceived).toBe(true)
		})
	})

	describe('correlation context from headers', () => {
		test('should extract requestId from headers', async () => {
			setMockHeaders({ 'x-request-id': 'action-req-123' })

			let receivedRequestId = ''
			const action = async (_input: unknown, { ctx }: any) => {
				receivedRequestId = ctx.requestId
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedRequestId).toBe('action-req-123')
		})

		test('should extract traceId from headers', async () => {
			setMockHeaders({ 'x-trace-id': 'trace-abc-456' })

			let receivedTraceId = ''
			const action = async (_input: unknown, { ctx }: any) => {
				receivedTraceId = ctx.traceId
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedTraceId).toBe('trace-abc-456')
		})

		test('should extract spanId from headers', async () => {
			setMockHeaders({ 'x-span-id': 'span-xyz-789' })

			let receivedSpanId = ''
			const action = async (_input: unknown, { ctx }: any) => {
				receivedSpanId = ctx.spanId
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedSpanId).toBe('span-xyz-789')
		})

		test('should generate new requestId if not in headers', async () => {
			setMockHeaders({})

			let receivedRequestId = ''
			const action = async (_input: unknown, { ctx }: any) => {
				receivedRequestId = ctx.requestId
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedRequestId).toBeDefined()
			expect(receivedRequestId).not.toBe('')
		})
	})

	describe('logger configuration', () => {
		test('should provide a logger with child namespace', async () => {
			let loggerReceived = false
			const action = async (_input: unknown, { log }: any) => {
				expect(typeof log.info).toBe('function')
				expect(typeof log.debug).toBe('function')
				expect(typeof log.warn).toBe('function')
				expect(typeof log.error).toBe('function')
				loggerReceived = true
				return 'done'
			}

			const wrapped = vestigAction(action, { namespace: 'actions:test' })
			await wrapped(null)

			expect(loggerReceived).toBe(true)
		})

		test('should use default namespace when not provided', async () => {
			let loggerReceived = false
			const action = async (_input: unknown, { log }: any) => {
				expect(log).toBeDefined()
				loggerReceived = true
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(loggerReceived).toBe(true)
		})
	})

	describe('options', () => {
		test('should accept level option', async () => {
			const action = async () => 'done'

			const wrapped = vestigAction(action, { level: 'debug' })
			const result = await wrapped(null)

			expect(result).toBe('done')
		})

		test('should accept enabled option', async () => {
			const action = async () => 'done'

			const wrapped = vestigAction(action, { enabled: false })
			const result = await wrapped(null)

			expect(result).toBe('done')
		})

		test('should accept sanitize option', async () => {
			const action = async () => 'done'

			const wrapped = vestigAction(action, { sanitize: 'gdpr' })
			const result = await wrapped(null)

			expect(result).toBe('done')
		})

		test('should accept structured option', async () => {
			const action = async () => 'done'

			const wrapped = vestigAction(action, { structured: false })
			const result = await wrapped(null)

			expect(result).toBe('done')
		})

		test('should accept context option', async () => {
			const action = async () => 'done'

			const wrapped = vestigAction(action, {
				context: { service: 'actions', version: '1.0.0' },
			})
			const result = await wrapped(null)

			expect(result).toBe('done')
		})

		test('should accept logInput option (defaults to false)', async () => {
			const action = async (input: string) => input.toUpperCase()

			// With logInput enabled
			const wrapped = vestigAction(action, { logInput: true })
			const result = await wrapped('hello')

			expect(result).toBe('HELLO')
		})

		test('should accept logOutput option (defaults to false)', async () => {
			const action = async (input: string) => input.toUpperCase()

			// With logOutput enabled
			const wrapped = vestigAction(action, { logOutput: true })
			const result = await wrapped('hello')

			expect(result).toBe('HELLO')
		})
	})

	describe('error handling', () => {
		test('should rethrow errors from action', async () => {
			const action = async () => {
				throw new Error('Action error')
			}

			const wrapped = vestigAction(action)

			await expect(wrapped(null)).rejects.toThrow('Action error')
		})

		test('should log errors before rethrowing', async () => {
			const action = async () => {
				throw new Error('Test error for logging')
			}

			const wrapped = vestigAction(action)

			// Error should be thrown (logging happens internally)
			await expect(wrapped(null)).rejects.toThrow('Test error for logging')
		})
	})

	describe('input types', () => {
		test('should handle object input', async () => {
			const action = async (input: { name: string; age: number }) => {
				return `${input.name} is ${input.age} years old`
			}

			const wrapped = vestigAction(action)
			const result = await wrapped({ name: 'John', age: 30 })

			expect(result).toBe('John is 30 years old')
		})

		test('should handle array input', async () => {
			const action = async (input: number[]) => {
				return input.reduce((a, b) => a + b, 0)
			}

			const wrapped = vestigAction(action)
			const result = await wrapped([1, 2, 3, 4, 5])

			expect(result).toBe(15)
		})

		test('should handle FormData-like input', async () => {
			const action = async (formData: { get: (key: string) => string | null }) => {
				return formData.get('name') ?? 'unknown'
			}

			const mockFormData = {
				get: (key: string) => (key === 'name' ? 'Test User' : null),
			}

			const wrapped = vestigAction(action)
			const result = await wrapped(mockFormData)

			expect(result).toBe('Test User')
		})

		test('should handle null input', async () => {
			const action = async (input: null) => {
				return input === null ? 'is null' : 'not null'
			}

			const wrapped = vestigAction(action)
			const result = await wrapped(null)

			expect(result).toBe('is null')
		})

		test('should handle undefined input', async () => {
			const action = async (input: undefined) => {
				return input === undefined ? 'is undefined' : 'not undefined'
			}

			const wrapped = vestigAction(action)
			const result = await wrapped(undefined)

			expect(result).toBe('is undefined')
		})
	})

	describe('output types', () => {
		test('should handle object output', async () => {
			const action = async () => ({ success: true, data: { id: 1 } })

			const wrapped = vestigAction(action)
			const result = await wrapped(null)

			expect(result).toEqual({ success: true, data: { id: 1 } })
		})

		test('should handle array output', async () => {
			const action = async () => [1, 2, 3]

			const wrapped = vestigAction(action)
			const result = await wrapped(null)

			expect(result).toEqual([1, 2, 3])
		})

		test('should handle void output', async () => {
			const action = async () => {
				// Side effect only, no return
			}

			const wrapped = vestigAction(action)
			const result = await wrapped(null)

			expect(result).toBeUndefined()
		})
	})

	describe('async behavior', () => {
		test('should handle async operations', async () => {
			const action = async (delay: number) => {
				await new Promise((r) => setTimeout(r, delay))
				return 'completed'
			}

			const wrapped = vestigAction(action)
			const result = await wrapped(10)

			expect(result).toBe('completed')
		})

		test('should handle multiple sequential calls', async () => {
			let callCount = 0
			const action = async (input: number) => {
				callCount++
				return input * 2
			}

			const wrapped = vestigAction(action)

			const result1 = await wrapped(5)
			const result2 = await wrapped(10)
			const result3 = await wrapped(15)

			expect(result1).toBe(10)
			expect(result2).toBe(20)
			expect(result3).toBe(30)
			expect(callCount).toBe(3)
		})
	})
})

describe('createVestigAction', () => {
	beforeEach(() => {
		clearMockHeaders()
	})

	test('should create an action with config object', async () => {
		const action = createVestigAction({
			namespace: 'users:create',
			action: async (input: { name: string }) => {
				return { id: 1, name: input.name }
			},
		})

		expect(typeof action).toBe('function')
	})

	test('should work with namespace config', async () => {
		const action = createVestigAction({
			namespace: 'users:update',
			action: async (input: { id: number; name: string }) => {
				return { ...input, updated: true }
			},
		})

		const result = await action({ id: 1, name: 'Updated Name' })

		expect(result).toEqual({ id: 1, name: 'Updated Name', updated: true })
	})

	test('should work with logInput config', async () => {
		const action = createVestigAction({
			namespace: 'test:logInput',
			logInput: true,
			action: async (input: string) => input.toUpperCase(),
		})

		const result = await action('hello')

		expect(result).toBe('HELLO')
	})

	test('should work with logOutput config', async () => {
		const action = createVestigAction({
			namespace: 'test:logOutput',
			logOutput: true,
			action: async (input: string) => input.toUpperCase(),
		})

		const result = await action('world')

		expect(result).toBe('WORLD')
	})

	test('should work with level config', async () => {
		const action = createVestigAction({
			level: 'debug',
			action: async () => 'done',
		})

		const result = await action(null)

		expect(result).toBe('done')
	})

	test('should work with sanitize config', async () => {
		const action = createVestigAction({
			sanitize: 'hipaa',
			action: async () => 'done',
		})

		const result = await action(null)

		expect(result).toBe('done')
	})

	test('should infer input and output types', async () => {
		// This test verifies TypeScript inference works correctly
		const action = createVestigAction({
			namespace: 'typed:action',
			action: async (input: { email: string; password: string }) => {
				return {
					success: true,
					userId: 123,
					email: input.email,
				}
			},
		})

		const result = await action({ email: 'test@example.com', password: 'secret' })

		expect(result.success).toBe(true)
		expect(result.userId).toBe(123)
		expect(result.email).toBe('test@example.com')
	})
})

describe('tracing', () => {
	beforeEach(() => {
		clearMockHeaders()
	})

	afterEach(() => {
		clearMockHeaders()
	})

	describe('span creation', () => {
		test('should provide a span in action context', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedSpan).toBeDefined()
			expect(typeof receivedSpan?.spanId).toBe('string')
			expect(typeof receivedSpan?.traceId).toBe('string')
		})

		test('span should have correct name with namespace', async () => {
			let spanName = ''
			const action = async (_input: unknown, { span }: { span: Span }) => {
				spanName = span.name
				return 'done'
			}

			const wrapped = vestigAction(action, { namespace: 'users:create' })
			await wrapped(null)

			expect(spanName).toBe('action:users:create')
		})

		test('span should have default name when no namespace', async () => {
			let spanName = ''
			const action = async (_input: unknown, { span }: { span: Span }) => {
				spanName = span.name
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(spanName).toBe('action:action')
		})
	})

	describe('span attributes', () => {
		test('should set action.namespace attribute', async () => {
			let namespace: unknown
			const action = async (_input: unknown, { span }: { span: Span }) => {
				namespace = span.attributes['action.namespace']
				return 'done'
			}

			const wrapped = vestigAction(action, { namespace: 'test:action' })
			await wrapped(null)

			expect(namespace).toBe('test:action')
		})

		test('should set action.input_type attribute', async () => {
			let inputType: unknown
			const action = async (_input: unknown, { span }: { span: Span }) => {
				inputType = span.attributes['action.input_type']
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped({ name: 'test' })

			expect(inputType).toBe('object')
		})

		test('should set action.request_id attribute', async () => {
			setMockHeaders({ 'x-request-id': 'req-123' })

			let requestId: unknown
			const action = async (_input: unknown, { span }: { span: Span }) => {
				requestId = span.attributes['action.request_id']
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(requestId).toBe('req-123')
		})

		test('should set action.duration_ms on completion', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				await new Promise((r) => setTimeout(r, 10))
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedSpan?.attributes['action.duration_ms']).toBeGreaterThan(0)
		})
	})

	describe('span events', () => {
		test('should add action-start event', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			const startEvent = receivedSpan?.events.find((e) => e.name === 'action-start')
			expect(startEvent).toBeDefined()
		})

		test('should add action-complete event on success', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			const completeEvent = receivedSpan?.events.find((e) => e.name === 'action-complete')
			expect(completeEvent).toBeDefined()
		})

		test('should add action-error event on failure', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				receivedSpan = span
				throw new Error('Test error')
			}

			const wrapped = vestigAction(action)

			try {
				await wrapped(null)
			} catch {
				// Expected
			}

			const errorEvent = receivedSpan?.events.find((e) => e.name === 'action-error')
			expect(errorEvent).toBeDefined()
			expect(errorEvent?.attributes?.error).toBe('Test error')
		})
	})

	describe('span status', () => {
		test('should set status to ok on success', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedSpan?.status).toBe('ok')
		})

		test('should set status to error on exception', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				receivedSpan = span
				throw new Error('Action failed')
			}

			const wrapped = vestigAction(action)

			try {
				await wrapped(null)
			} catch {
				// Expected
			}

			expect(receivedSpan?.status).toBe('error')
			expect(receivedSpan?.statusMessage).toBe('Action failed')
		})
	})

	describe('custom span operations', () => {
		test('should allow adding custom attributes', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				span.setAttribute('user.id', 'user-456')
				span.setAttribute('operation.type', 'create')
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			expect(receivedSpan?.attributes['user.id']).toBe('user-456')
			expect(receivedSpan?.attributes['operation.type']).toBe('create')
		})

		test('should allow adding custom events', async () => {
			let receivedSpan: Span | undefined
			const action = async (_input: unknown, { span }: { span: Span }) => {
				span.addEvent('validation-start')
				span.addEvent('validation-complete', { valid: true })
				receivedSpan = span
				return 'done'
			}

			const wrapped = vestigAction(action)
			await wrapped(null)

			const validationStart = receivedSpan?.events.find((e) => e.name === 'validation-start')
			const validationComplete = receivedSpan?.events.find((e) => e.name === 'validation-complete')

			expect(validationStart).toBeDefined()
			expect(validationComplete).toBeDefined()
			expect(validationComplete?.attributes?.valid).toBe(true)
		})
	})
})

describe('integration scenarios', () => {
	beforeEach(() => {
		clearMockHeaders()
	})

	test('form submission simulation', async () => {
		setMockHeaders({ 'x-request-id': 'form-submit-123' })

		const submitForm = vestigAction(
			async (data: { email: string; password: string }, { log, ctx }) => {
				log.debug('Validating form data')

				if (!data.email.includes('@')) {
					throw new Error('Invalid email')
				}

				log.info('Form validated', { requestId: ctx.requestId })

				return { success: true, userId: 'user-123' }
			},
			{ namespace: 'forms:login' },
		)

		const result = await submitForm({
			email: 'user@example.com',
			password: 'secure123',
		})

		expect(result.success).toBe(true)
		expect(result.userId).toBe('user-123')
	})

	test('database mutation simulation', async () => {
		const items: { id: string; name: string }[] = []

		const createItem = vestigAction(
			async (name: string, { log }) => {
				const id = `item-${items.length + 1}`
				log.debug('Creating item', { id, name })
				items.push({ id, name })
				return { id, name }
			},
			{ namespace: 'db:createItem' },
		)

		const deleteItem = vestigAction(
			async (id: string, { log }) => {
				const index = items.findIndex((i) => i.id === id)
				if (index === -1) {
					log.warn('Item not found', { id })
					throw new Error('Item not found')
				}
				log.debug('Deleting item', { id })
				items.splice(index, 1)
				return { deleted: true }
			},
			{ namespace: 'db:deleteItem' },
		)

		// Create items
		const item1 = await createItem('Item 1')
		const item2 = await createItem('Item 2')

		expect(items.length).toBe(2)
		expect(item1.name).toBe('Item 1')
		expect(item2.name).toBe('Item 2')

		// Delete first item
		await deleteItem(item1.id)
		expect(items.length).toBe(1)
		expect(items[0].name).toBe('Item 2')

		// Try to delete non-existent
		await expect(deleteItem('non-existent')).rejects.toThrow('Item not found')
	})

	test('chained actions with shared context', async () => {
		setMockHeaders({
			'x-request-id': 'chain-req-123',
			'x-trace-id': 'chain-trace-456',
		})

		const results: string[] = []

		const step1 = vestigAction(
			async (input: string, { ctx }) => {
				results.push(`step1: ${ctx.requestId}`)
				return `${input}-step1`
			},
			{ namespace: 'chain:step1' },
		)

		const step2 = vestigAction(
			async (input: string, { ctx }) => {
				results.push(`step2: ${ctx.requestId}`)
				return `${input}-step2`
			},
			{ namespace: 'chain:step2' },
		)

		const result1 = await step1('start')
		const result2 = await step2(result1)

		expect(result2).toBe('start-step1-step2')
		expect(results).toEqual(['step1: chain-req-123', 'step2: chain-req-123'])
	})
})
