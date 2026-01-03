import { beforeEach, describe, expect, test } from 'bun:test'
import { getContext } from '../../context'
import { createLogger } from '../../logger'
import { clearActiveSpans, getActiveSpan, span } from '../../tracing'

describe('Logger.span() integration', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should prefix span name with logger namespace', async () => {
		const log = createLogger({ namespace: 'api' })
		let spanName: string | undefined

		await log.span('request', async (s) => {
			spanName = s.name
		})

		expect(spanName).toBe('api:request')
	})

	test('should prefix span name with nested namespace', async () => {
		const log = createLogger({ namespace: 'api' })
		const dbLog = log.child('database')
		let spanName: string | undefined

		await dbLog.span('query', async (s) => {
			spanName = s.name
		})

		expect(spanName).toBe('api:database:query')
	})

	test('should not prefix when no namespace', async () => {
		const log = createLogger()
		let spanName: string | undefined

		await log.span('operation', async (s) => {
			spanName = s.name
		})

		expect(spanName).toBe('operation')
	})

	test('should return function result', async () => {
		const log = createLogger()

		const result = await log.span('operation', async () => {
			return { data: 'test' }
		})

		expect(result).toEqual({ data: 'test' })
	})

	test('should handle errors correctly', async () => {
		const log = createLogger()

		await expect(
			log.span('failing', async () => {
				throw new Error('Span failed')
			}),
		).rejects.toThrow('Span failed')
	})
})

describe('Logger.spanSync() integration', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should prefix span name with logger namespace', () => {
		const log = createLogger({ namespace: 'parser' })
		let spanName: string | undefined

		log.spanSync('parse', (s) => {
			spanName = s.name
		})

		expect(spanName).toBe('parser:parse')
	})

	test('should return function result', () => {
		const log = createLogger()

		const result = log.spanSync('compute', () => {
			return 42
		})

		expect(result).toBe(42)
	})
})

describe('Tracing and Logging context correlation', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should propagate traceId to logging context', async () => {
		let contextInsideSpan: ReturnType<typeof getContext>

		await span('operation', async (s) => {
			contextInsideSpan = getContext()
		})

		expect(contextInsideSpan!).toBeDefined()
		expect(contextInsideSpan?.traceId).toBeDefined()
		expect(contextInsideSpan?.spanId).toBeDefined()
	})

	test('should update spanId for nested spans', async () => {
		const spanIds: string[] = []

		await span('outer', async (outer) => {
			const outerContext = getContext()
			spanIds.push(outerContext?.spanId!)

			await span('inner', async (inner) => {
				const innerContext = getContext()
				spanIds.push(innerContext?.spanId!)
			})
		})

		expect(spanIds).toHaveLength(2)
		expect(spanIds[0]).not.toBe(spanIds[1])
	})

	test('should maintain same traceId for nested spans in context', async () => {
		const traceIds: string[] = []

		await span('outer', async () => {
			traceIds.push(getContext()?.traceId!)

			await span('inner', async () => {
				traceIds.push(getContext()?.traceId!)
			})
		})

		expect(traceIds).toHaveLength(2)
		expect(traceIds[0]).toBe(traceIds[1])
	})
})

describe('Standalone span() and Logger.span() interop', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('should share trace context between standalone and logger spans', async () => {
		const log = createLogger({ namespace: 'service' })
		let standaloneTraceId: string | undefined
		let loggerTraceId: string | undefined

		await span('standalone-root', async (root) => {
			standaloneTraceId = root.traceId

			await log.span('nested', async (nested) => {
				loggerTraceId = nested.traceId
			})
		})

		expect(standaloneTraceId).toBe(loggerTraceId)
	})

	test('should create proper parent-child relationship', async () => {
		const log = createLogger({ namespace: 'service' })
		let standaloneSpanId: string | undefined
		let loggerParentSpanId: string | undefined

		await span('parent', async (parent) => {
			standaloneSpanId = parent.spanId

			await log.span('child', async (child) => {
				loggerParentSpanId = child.parentSpanId
			})
		})

		expect(loggerParentSpanId).toBe(standaloneSpanId)
	})

	test('should work with mixed nesting', async () => {
		const api = createLogger({ namespace: 'api' })
		const db = createLogger({ namespace: 'db' })
		const spanNames: string[] = []

		await span('request', async () => {
			spanNames.push(getActiveSpan()?.name)

			await api.span('handler', async () => {
				spanNames.push(getActiveSpan()?.name)

				await db.span('query', async () => {
					spanNames.push(getActiveSpan()?.name)
				})
			})
		})

		expect(spanNames).toEqual(['request', 'api:handler', 'db:query'])
	})
})

describe('Real-world scenarios', () => {
	beforeEach(() => {
		clearActiveSpans()
	})

	test('HTTP request handling pattern', async () => {
		const log = createLogger({ namespace: 'http' })
		const events: string[] = []

		await log.span('request', async (req) => {
			req.setAttribute('method', 'POST')
			req.setAttribute('path', '/api/users')
			events.push('request-start')

			// Auth
			await log.span('auth', async (auth) => {
				auth.setAttribute('type', 'jwt')
				events.push('auth')
			})

			// Business logic
			await log.span('handler', async (handler) => {
				events.push('handler-start')

				// Database
				await log.span('db:insert', async (db) => {
					db.setAttribute('table', 'users')
					events.push('db-insert')
				})

				events.push('handler-end')
			})

			events.push('request-end')
		})

		expect(events).toEqual([
			'request-start',
			'auth',
			'handler-start',
			'db-insert',
			'handler-end',
			'request-end',
		])
	})

	test('Parallel operations within span', async () => {
		const log = createLogger()
		const results: number[] = []

		await log.span('batch-process', async (batch) => {
			batch.setAttribute('count', 3)

			// Parallel operations
			await Promise.all([
				log.span('task-1', async () => {
					await delay(10)
					results.push(1)
					return 1
				}),
				log.span('task-2', async () => {
					await delay(5)
					results.push(2)
					return 2
				}),
				log.span('task-3', async () => {
					await delay(1)
					results.push(3)
					return 3
				}),
			])
		})

		// All tasks completed (order may vary due to timing)
		expect(results.sort()).toEqual([1, 2, 3])
	})

	test('Error recovery pattern', async () => {
		const log = createLogger()
		let recovered = false

		await log.span('resilient-operation', async (op) => {
			op.setAttribute('attempt', 1)

			try {
				await log.span('risky-operation', async () => {
					throw new Error('First attempt failed')
				})
			} catch (error) {
				op.addEvent('retry', { reason: (error as Error).message })
				op.setAttribute('attempt', 2)

				// Retry succeeds
				await log.span('risky-operation', async () => {
					recovered = true
				})
			}

			op.setStatus('ok', 'Recovered after retry')
		})

		expect(recovered).toBe(true)
	})
})

// Helper
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
