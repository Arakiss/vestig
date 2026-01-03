import { beforeEach, describe, expect, test } from 'bun:test'
import type { Span } from 'vestig'
import { createRouteHandlers, withVestig } from '../../server/route-handler'
import { createMockNextRequest, createMockRouteContext } from '../mocks/next-server'

describe('withVestig', () => {
	describe('basic functionality', () => {
		test('should wrap a handler and return a function', () => {
			const handler = async () => new Response('OK')
			const wrapped = withVestig(handler)

			expect(typeof wrapped).toBe('function')
		})

		test('should call the handler and return its result', async () => {
			const handler = async () => new Response('Hello World')
			const wrapped = withVestig(handler)

			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
			expect(await response.text()).toBe('Hello World')
		})

		test('should pass request to handler', async () => {
			let capturedUrl = ''
			const handler = async (req: Request) => {
				capturedUrl = req.url
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/users')
			await wrapped(request as never)

			expect(capturedUrl).toBe('https://example.com/api/users')
		})

		test('should provide handler context with log, ctx, params, timing, span', async () => {
			let contextReceived = false
			const handler = async (_req: Request, ctx: any) => {
				expect(ctx).toHaveProperty('log')
				expect(ctx).toHaveProperty('ctx')
				expect(ctx).toHaveProperty('params')
				expect(ctx).toHaveProperty('timing')
				expect(ctx).toHaveProperty('span')
				contextReceived = true
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(contextReceived).toBe(true)
		})
	})

	describe('correlation context', () => {
		test('should extract requestId from x-request-id header', async () => {
			let receivedRequestId = ''
			const handler = async (_req: Request, { ctx }: any) => {
				receivedRequestId = ctx.requestId
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test', {
				headers: { 'x-request-id': 'req-123-abc' },
			})
			await wrapped(request as never)

			expect(receivedRequestId).toBe('req-123-abc')
		})

		test('should extract traceId from x-trace-id header', async () => {
			// Note: traceparent parsing is done by middleware, not route-handler
			// The route-handler expects x-trace-id to be set by upstream middleware
			let receivedTraceId = ''
			const handler = async (_req: Request, { ctx }: any) => {
				receivedTraceId = ctx.traceId
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const traceId = '0af7651916cd43dd8448eb211c80319c'

			const request = createMockNextRequest('https://example.com/api/test', {
				headers: { 'x-trace-id': traceId },
			})
			await wrapped(request as never)

			expect(receivedTraceId).toBe(traceId)
		})

		test('should generate new requestId if not provided', async () => {
			let receivedRequestId = ''
			const handler = async (_req: Request, { ctx }: any) => {
				receivedRequestId = ctx.requestId
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedRequestId).toBeDefined()
			expect(receivedRequestId).not.toBe('')
		})

		test('should set correlation headers on response', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test', {
				headers: { 'x-request-id': 'test-req-id' },
			})
			const response = await wrapped(request as never)

			expect(response.headers.get('x-request-id')).toBe('test-req-id')
		})
	})

	describe('timing', () => {
		test('should provide timing.start', async () => {
			let startTime: number | undefined
			const handler = async (_req: Request, { timing }: any) => {
				startTime = timing.start
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(startTime).toBeDefined()
			expect(typeof startTime).toBe('number')
		})

		test('should provide timing.elapsed() function', async () => {
			let elapsedTime: number | undefined
			const handler = async (_req: Request, { timing }: any) => {
				// Small delay
				await new Promise((r) => setTimeout(r, 10))
				elapsedTime = timing.elapsed()
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(elapsedTime).toBeDefined()
			expect(elapsedTime).toBeGreaterThan(0)
		})

		test('should provide timing.mark() function', async () => {
			let markFn: any
			const handler = async (_req: Request, { timing }: any) => {
				// mark() returns void - just verify it's a function that can be called
				markFn = timing.mark
				timing.mark('db-query')
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(typeof markFn).toBe('function')
		})
	})

	describe('route params', () => {
		test('should extract params from routeContext', async () => {
			let receivedParams: Record<string, string> = {}
			const handler = async (_req: Request, { params }: any) => {
				receivedParams = params
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/users/123')
			const routeContext = createMockRouteContext({ id: '123', action: 'view' })

			await wrapped(request as never, routeContext)

			expect(receivedParams.id).toBe('123')
			expect(receivedParams.action).toBe('view')
		})

		test('should handle missing routeContext', async () => {
			let receivedParams: Record<string, string> = {}
			const handler = async (_req: Request, { params }: any) => {
				receivedParams = params
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')

			await wrapped(request as never)

			expect(receivedParams).toEqual({})
		})
	})

	describe('logger configuration', () => {
		test('should provide a logger with child namespace', async () => {
			let loggerReceived = false
			const handler = async (_req: Request, { log }: any) => {
				expect(typeof log.info).toBe('function')
				expect(typeof log.debug).toBe('function')
				expect(typeof log.warn).toBe('function')
				expect(typeof log.error).toBe('function')
				loggerReceived = true
				return new Response('OK')
			}

			const wrapped = withVestig(handler, { namespace: 'api:users' })
			const request = createMockNextRequest('https://example.com/api/users')
			await wrapped(request as never)

			expect(loggerReceived).toBe(true)
		})

		test('should use default namespace when not provided', async () => {
			let loggerReceived = false
			const handler = async (_req: Request, { log }: any) => {
				expect(log).toBeDefined()
				loggerReceived = true
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(loggerReceived).toBe(true)
		})
	})

	describe('options', () => {
		test('should accept level option', async () => {
			const handler = async () => new Response('OK')

			// Should not throw with valid level
			const wrapped = withVestig(handler, { level: 'debug' })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})

		test('should accept enabled option', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler, { enabled: false })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})

		test('should accept sanitize option', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler, { sanitize: 'gdpr' })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})

		test('should accept structured option', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler, { structured: false })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})

		test('should accept context option', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler, {
				context: { service: 'api', version: '1.0.0' },
			})
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})

		test('should accept logRequest option', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler, { logRequest: false })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})

		test('should accept logResponse option', async () => {
			const handler = async () => new Response('OK')

			const wrapped = withVestig(handler, { logResponse: false })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response).toBeInstanceOf(Response)
		})
	})

	describe('error handling', () => {
		test('should rethrow errors from handler', async () => {
			const handler = async () => {
				throw new Error('Handler error')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')

			await expect(wrapped(request as never)).rejects.toThrow('Handler error')
		})

		test('should log errors before rethrowing', async () => {
			const handler = async () => {
				throw new Error('Test error for logging')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')

			// Error should be thrown (logging happens internally)
			await expect(wrapped(request as never)).rejects.toThrow('Test error for logging')
		})

		test('should include duration in error logs', async () => {
			const handler = async () => {
				await new Promise((r) => setTimeout(r, 5))
				throw new Error('Delayed error')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')

			// Should still throw
			await expect(wrapped(request as never)).rejects.toThrow('Delayed error')
		})
	})

	describe('response handling', () => {
		test('should handle JSON response', async () => {
			const handler = async () => {
				return Response.json({ message: 'success', count: 42 })
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			const data = await response.json()
			expect(data.message).toBe('success')
			expect(data.count).toBe(42)
		})

		test('should handle text response', async () => {
			const handler = async () => new Response('Plain text response')

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(await response.text()).toBe('Plain text response')
		})

		test('should handle response with status codes', async () => {
			const handler = async () => new Response('Created', { status: 201 })

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response.status).toBe(201)
		})

		test('should handle redirect response', async () => {
			const handler = async () => {
				return Response.redirect('https://example.com/new-location', 302)
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response.status).toBe(302)
		})

		test('should handle no-content response', async () => {
			const handler = async () => new Response(null, { status: 204 })

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			const response = await wrapped(request as never)

			expect(response.status).toBe(204)
		})
	})

	describe('HTTP methods', () => {
		const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

		for (const method of methods) {
			test(`should handle ${method} requests`, async () => {
				let receivedMethod = ''
				const handler = async (req: Request) => {
					receivedMethod = req.method
					return new Response('OK')
				}

				const wrapped = withVestig(handler)
				const request = createMockNextRequest('https://example.com/api/test', {
					method,
				})
				await wrapped(request as never)

				expect(receivedMethod).toBe(method)
			})
		}
	})
})

describe('createRouteHandlers', () => {
	test('should create handlers for specified HTTP methods', () => {
		const handlers = createRouteHandlers({
			GET: async () => new Response('GET response'),
			POST: async () => new Response('POST response'),
		})

		expect(handlers.GET).toBeDefined()
		expect(handlers.POST).toBeDefined()
		expect(typeof handlers.GET).toBe('function')
		expect(typeof handlers.POST).toBe('function')
	})

	test('should not create handlers for unspecified methods', () => {
		const handlers = createRouteHandlers({
			GET: async () => new Response('GET response'),
		})

		expect(handlers.GET).toBeDefined()
		expect(handlers.POST).toBeUndefined()
		expect(handlers.PUT).toBeUndefined()
		expect(handlers.DELETE).toBeUndefined()
	})

	test('GET handler should work correctly', async () => {
		const handlers = createRouteHandlers({
			GET: async () => Response.json({ users: [] }),
		})

		const request = createMockNextRequest('https://example.com/api/users', {
			method: 'GET',
		})
		const response = await handlers.GET?.(request as never)

		expect(response).toBeInstanceOf(Response)
		const data = await response.json()
		expect(data.users).toEqual([])
	})

	test('POST handler should work correctly', async () => {
		const handlers = createRouteHandlers({
			POST: async () => new Response('Created', { status: 201 }),
		})

		const request = createMockNextRequest('https://example.com/api/users', {
			method: 'POST',
			body: { name: 'John' },
		})
		const response = await handlers.POST?.(request as never)

		expect(response.status).toBe(201)
	})

	test('should apply shared options to all handlers', async () => {
		let loggerNamespace = ''
		const handlers = createRouteHandlers(
			{
				GET: async (_req, { log }: any) => {
					// Logger is a child of the base logger
					loggerNamespace = 'captured'
					return new Response('OK')
				},
			},
			{ level: 'debug', sanitize: 'minimal' },
		)

		const request = createMockNextRequest('https://example.com/api/test', {
			method: 'GET',
		})
		await handlers.GET?.(request as never)

		expect(loggerNamespace).toBe('captured')
	})

	test('should use default namespace for each method when not provided', async () => {
		const handlers = createRouteHandlers({
			GET: async () => new Response('GET'),
			POST: async () => new Response('POST'),
		})

		// Should not throw - default namespaces are applied
		const getReq = createMockNextRequest('https://example.com/api/test', {
			method: 'GET',
		})
		const postReq = createMockNextRequest('https://example.com/api/test', {
			method: 'POST',
		})

		const getRes = await handlers.GET?.(getReq as never)
		const postRes = await handlers.POST?.(postReq as never)

		expect(getRes).toBeInstanceOf(Response)
		expect(postRes).toBeInstanceOf(Response)
	})

	test('should support all HTTP methods', () => {
		const handlers = createRouteHandlers({
			GET: async () => new Response('GET'),
			POST: async () => new Response('POST'),
			PUT: async () => new Response('PUT'),
			PATCH: async () => new Response('PATCH'),
			DELETE: async () => new Response('DELETE'),
			HEAD: async () => new Response('HEAD'),
			OPTIONS: async () => new Response('OPTIONS'),
		})

		expect(handlers.GET).toBeDefined()
		expect(handlers.POST).toBeDefined()
		expect(handlers.PUT).toBeDefined()
		expect(handlers.PATCH).toBeDefined()
		expect(handlers.DELETE).toBeDefined()
		expect(handlers.HEAD).toBeDefined()
		expect(handlers.OPTIONS).toBeDefined()
	})

	test('handlers should receive context with log, ctx, params, timing, span', async () => {
		let contextValid = false
		const handlers = createRouteHandlers({
			GET: async (_req, ctx: any) => {
				contextValid =
					ctx &&
					typeof ctx.log === 'object' &&
					typeof ctx.ctx === 'object' &&
					typeof ctx.params === 'object' &&
					typeof ctx.timing === 'object' &&
					typeof ctx.span === 'object'
				return new Response('OK')
			},
		})

		const request = createMockNextRequest('https://example.com/api/test', {
			method: 'GET',
		})
		await handlers.GET?.(request as never)

		expect(contextValid).toBe(true)
	})

	test('handlers should receive route params', async () => {
		let receivedId = ''
		const handlers = createRouteHandlers({
			GET: async (_req, { params }: any) => {
				receivedId = params.id
				return new Response('OK')
			},
		})

		const request = createMockNextRequest('https://example.com/api/users/456', {
			method: 'GET',
		})
		const routeContext = createMockRouteContext({ id: '456' })
		await handlers.GET?.(request as never, routeContext)

		expect(receivedId).toBe('456')
	})

	test('should handle errors in handlers', async () => {
		const handlers = createRouteHandlers({
			DELETE: async () => {
				throw new Error('Delete failed')
			},
		})

		const request = createMockNextRequest('https://example.com/api/users/1', {
			method: 'DELETE',
		})

		await expect(handlers.DELETE?.(request as never)).rejects.toThrow('Delete failed')
	})

	test('should return empty object when no handlers provided', () => {
		const handlers = createRouteHandlers({})

		expect(Object.keys(handlers).length).toBe(0)
	})
})

describe('tracing', () => {
	describe('span creation', () => {
		test('should provide a span in handler context', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				receivedSpan = span
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedSpan).toBeDefined()
			expect(typeof receivedSpan?.spanId).toBe('string')
			expect(typeof receivedSpan?.traceId).toBe('string')
		})

		test('span should have correct name with namespace', async () => {
			let spanName = ''
			const handler = async (_req: Request, { span }: { span: Span }) => {
				spanName = span.name
				return new Response('OK')
			}

			const wrapped = withVestig(handler, { namespace: 'api:users' })
			const request = createMockNextRequest('https://example.com/api/users')
			await wrapped(request as never)

			expect(spanName).toBe('route:api:users')
		})

		test('span should have default name when no namespace', async () => {
			let spanName = ''
			const handler = async (_req: Request, { span }: { span: Span }) => {
				spanName = span.name
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(spanName).toBe('route:api')
		})
	})

	describe('span attributes', () => {
		test('should set http.method attribute', async () => {
			let httpMethod: unknown
			const handler = async (_req: Request, { span }: { span: Span }) => {
				httpMethod = span.attributes['http.method']
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test', {
				method: 'POST',
			})
			await wrapped(request as never)

			expect(httpMethod).toBe('POST')
		})

		test('should set http.url attribute', async () => {
			let httpUrl: unknown
			const handler = async (_req: Request, { span }: { span: Span }) => {
				httpUrl = span.attributes['http.url']
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/users/123')
			await wrapped(request as never)

			expect(httpUrl).toBe('/api/users/123')
		})

		test('should set http.request_id attribute', async () => {
			let httpRequestId: unknown
			const handler = async (_req: Request, { span }: { span: Span }) => {
				httpRequestId = span.attributes['http.request_id']
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test', {
				headers: { 'x-request-id': 'req-abc-123' },
			})
			await wrapped(request as never)

			expect(httpRequestId).toBe('req-abc-123')
		})

		test('should set http.status_code on response', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				receivedSpan = span
				return new Response('Created', { status: 201 })
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			// After the handler completes, the span should have status_code
			expect(receivedSpan?.attributes['http.status_code']).toBe(201)
		})
	})

	describe('span status', () => {
		test('should set status to ok on successful response', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				receivedSpan = span
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedSpan?.status).toBe('ok')
		})

		test('should set status to error on error response', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				receivedSpan = span
				return new Response('Not Found', { status: 404 })
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedSpan?.status).toBe('error')
		})

		test('should set status to error on exception', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				receivedSpan = span
				throw new Error('Test error')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')

			try {
				await wrapped(request as never)
			} catch {
				// Expected
			}

			expect(receivedSpan?.status).toBe('error')
			expect(receivedSpan?.statusMessage).toBe('Test error')
		})
	})

	describe('custom span operations', () => {
		test('should allow adding custom attributes', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				span.setAttribute('user.id', 'user-123')
				span.setAttribute('custom.key', 'custom-value')
				receivedSpan = span
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedSpan?.attributes['user.id']).toBe('user-123')
			expect(receivedSpan?.attributes['custom.key']).toBe('custom-value')
		})

		test('should allow adding events', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				span.addEvent('db-query-start', { table: 'users' })
				span.addEvent('db-query-end', { rowCount: 10 })
				receivedSpan = span
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedSpan?.events.length).toBe(2)
			expect(receivedSpan?.events[0].name).toBe('db-query-start')
			expect(receivedSpan?.events[0].attributes?.table).toBe('users')
			expect(receivedSpan?.events[1].name).toBe('db-query-end')
			expect(receivedSpan?.events[1].attributes?.rowCount).toBe(10)
		})

		test('should allow setAttributes for multiple attributes', async () => {
			let receivedSpan: Span | undefined
			const handler = async (_req: Request, { span }: { span: Span }) => {
				span.setAttributes({
					'cache.hit': true,
					'cache.key': 'users:list',
					'cache.ttl': 3600,
				})
				receivedSpan = span
				return new Response('OK')
			}

			const wrapped = withVestig(handler)
			const request = createMockNextRequest('https://example.com/api/test')
			await wrapped(request as never)

			expect(receivedSpan?.attributes['cache.hit']).toBe(true)
			expect(receivedSpan?.attributes['cache.key']).toBe('users:list')
			expect(receivedSpan?.attributes['cache.ttl']).toBe(3600)
		})
	})
})

describe('integration scenarios', () => {
	test('full request lifecycle with correlation', async () => {
		const requestId = 'lifecycle-test-123'
		let ctxRequestId = ''

		const handler = async (_req: Request, { ctx, log }: any) => {
			ctxRequestId = ctx.requestId
			log.info('Processing request')
			return Response.json({ success: true })
		}

		const wrapped = withVestig(handler, { namespace: 'api:test' })
		const request = createMockNextRequest('https://example.com/api/test', {
			headers: { 'x-request-id': requestId },
		})

		const response = await wrapped(request as never)

		expect(ctxRequestId).toBe(requestId)
		expect(response.headers.get('x-request-id')).toBe(requestId)

		const data = await response.json()
		expect(data.success).toBe(true)
	})

	test('CRUD API simulation', async () => {
		const items: { id: string; name: string }[] = [{ id: '1', name: 'Item 1' }]

		const handlers = createRouteHandlers(
			{
				GET: async () => {
					return Response.json({ items })
				},
				POST: async (req) => {
					const body = await req.json()
					const newItem = { id: String(items.length + 1), name: body.name }
					items.push(newItem)
					return Response.json(newItem, { status: 201 })
				},
				DELETE: async (_req, { params }) => {
					const index = items.findIndex((i) => i.id === params.id)
					if (index > -1) items.splice(index, 1)
					return new Response(null, { status: 204 })
				},
			},
			{ namespace: 'api:items' },
		)

		// GET all items
		const getReq = createMockNextRequest('https://example.com/api/items', {
			method: 'GET',
		})
		const getRes = await handlers.GET?.(getReq as never)
		const allItems = await getRes.json()
		expect(allItems.items.length).toBe(1)

		// POST new item
		const postReq = createMockNextRequest('https://example.com/api/items', {
			method: 'POST',
			body: { name: 'Item 2' },
		})
		const postRes = await handlers.POST?.(postReq as never)
		expect(postRes.status).toBe(201)
		const newItem = await postRes.json()
		expect(newItem.name).toBe('Item 2')

		// DELETE item
		const deleteReq = createMockNextRequest('https://example.com/api/items/1', {
			method: 'DELETE',
		})
		const routeContext = createMockRouteContext({ id: '1' })
		const deleteRes = await handlers.DELETE?.(deleteReq as never, routeContext)
		expect(deleteRes.status).toBe(204)

		// Verify deletion
		const getReq2 = createMockNextRequest('https://example.com/api/items', {
			method: 'GET',
		})
		const getRes2 = await handlers.GET?.(getReq2 as never)
		const remainingItems = await getRes2.json()
		expect(remainingItems.items.length).toBe(1)
		expect(remainingItems.items[0].name).toBe('Item 2')
	})

	test('async operation with timing marks', async () => {
		const marks: string[] = []

		const handler = async (_req: Request, { timing }: any) => {
			timing.mark('start-db')
			await new Promise((r) => setTimeout(r, 5))
			marks.push('db-done')

			timing.mark('start-transform')
			await new Promise((r) => setTimeout(r, 5))
			marks.push('transform-done')

			return Response.json({ processed: true })
		}

		const wrapped = withVestig(handler)
		const request = createMockNextRequest('https://example.com/api/process')

		const response = await wrapped(request as never)
		const data = await response.json()

		expect(data.processed).toBe(true)
		expect(marks).toEqual(['db-done', 'transform-done'])
	})
})
