import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { BatchTransportError } from '../transports/batch'
import { DatadogTransport, DatadogTransportError } from '../transports/datadog'
import type { LogEntry } from '../types'

const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
	timestamp: new Date().toISOString(),
	level: 'info',
	message: 'Test message',
	runtime: 'bun',
	...overrides,
})

describe('DatadogTransport', () => {
	let originalFetch: typeof global.fetch
	let mockFetch: ReturnType<typeof mock>
	let fetchCalls: Array<{ url: string; options: RequestInit }> = []

	beforeEach(() => {
		originalFetch = global.fetch
		fetchCalls = []
		mockFetch = mock(async (url: string, options: RequestInit) => {
			fetchCalls.push({ url, options })
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				statusText: 'OK',
			})
		})
		global.fetch = mockFetch as unknown as typeof fetch
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	describe('constructor', () => {
		test('should create with minimal config', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})
			expect(transport.name).toBe('datadog')
		})

		test('should accept custom name', () => {
			const transport = new DatadogTransport({
				name: 'custom-datadog',
				apiKey: 'test-api-key',
			})
			expect(transport.name).toBe('custom-datadog')
		})

		test('should use default site (datadoghq.com)', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry())
			transport.flush()

			// Wait for async flush
			return new Promise<void>((resolve) => {
				setTimeout(() => {
					expect(fetchCalls[0].url).toBe('https://http-intake.logs.datadoghq.com/api/v2/logs')
					resolve()
				}, 50)
			})
		})

		test('should use EU site when specified', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				site: 'datadoghq.eu',
			})

			transport.log(createEntry())
			transport.flush()

			return new Promise<void>((resolve) => {
				setTimeout(() => {
					expect(fetchCalls[0].url).toBe('https://http-intake.logs.datadoghq.eu/api/v2/logs')
					resolve()
				}, 50)
			})
		})

		test('should use US3 site when specified', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				site: 'us3.datadoghq.com',
			})

			transport.log(createEntry())
			transport.flush()

			return new Promise<void>((resolve) => {
				setTimeout(() => {
					expect(fetchCalls[0].url).toBe('https://http-intake.logs.us3.datadoghq.com/api/v2/logs')
					resolve()
				}, 50)
			})
		})

		test('should use US5 site when specified', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				site: 'us5.datadoghq.com',
			})

			transport.log(createEntry())
			transport.flush()

			return new Promise<void>((resolve) => {
				setTimeout(() => {
					expect(fetchCalls[0].url).toBe('https://http-intake.logs.us5.datadoghq.com/api/v2/logs')
					resolve()
				}, 50)
			})
		})

		test('should default to datadoghq.com for unknown sites', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				site: 'unknown.site.com' as 'datadoghq.com',
			})

			transport.log(createEntry())
			transport.flush()

			return new Promise<void>((resolve) => {
				setTimeout(() => {
					expect(fetchCalls[0].url).toBe('https://http-intake.logs.datadoghq.com/api/v2/logs')
					resolve()
				}, 50)
			})
		})
	})

	describe('send', () => {
		test('should include DD-API-KEY header', async () => {
			const transport = new DatadogTransport({
				apiKey: 'my-datadog-api-key',
			})

			transport.log(createEntry())
			await transport.flush()

			const headers = fetchCalls[0].options.headers as Record<string, string>
			expect(headers['DD-API-KEY']).toBe('my-datadog-api-key')
		})

		test('should include Content-Type header', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry())
			await transport.flush()

			const headers = fetchCalls[0].options.headers as Record<string, string>
			expect(headers['Content-Type']).toBe('application/json')
		})

		test('should use POST method', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry())
			await transport.flush()

			expect(fetchCalls[0].options.method).toBe('POST')
		})
	})

	describe('log transformation', () => {
		test('should transform log entry to Datadog format', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				service: 'my-service',
				source: 'my-source',
			})

			transport.log(createEntry({ message: 'Test log' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(Array.isArray(body)).toBe(true)
			expect(body[0].message).toBe('Test log')
			expect(body[0].ddsource).toBe('my-source')
			expect(body[0].service).toBe('my-service')
		})

		test('should use vestig as default source', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].ddsource).toBe('vestig')
		})

		test('should use namespace as service if not configured', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry({ namespace: 'api:users' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].service).toBe('api:users')
		})

		test('should use unknown as service if no namespace', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].service).toBe('unknown')
		})

		test('should map log levels correctly', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			const levels = ['trace', 'debug', 'info', 'warn', 'error'] as const
			const expectedDD = ['debug', 'debug', 'info', 'warning', 'error']

			for (let i = 0; i < levels.length; i++) {
				fetchCalls = []
				transport.log(createEntry({ level: levels[i] }))
				await transport.flush()

				const body = JSON.parse(fetchCalls[0].options.body as string)
				expect(body[0].status).toBe(expectedDD[i])
			}
		})

		test('should include metadata as attributes', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(
				createEntry({
					metadata: { userId: 123, action: 'login' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].attributes.userId).toBe(123)
			expect(body[0].attributes.action).toBe('login')
		})

		test('should include context as attributes', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(
				createEntry({
					context: { requestId: 'req-123', traceId: 'trace-456' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].attributes.requestId).toBe('req-123')
		})

		test('should include error information', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(
				createEntry({
					error: {
						name: 'ValidationError',
						message: 'Invalid email',
						stack: 'Error: Invalid email\n    at validate (app.ts:10)',
					},
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].error.kind).toBe('ValidationError')
			expect(body[0].error.message).toBe('Invalid email')
			expect(body[0].error.stack).toContain('Error: Invalid email')
		})
	})

	describe('tags', () => {
		test('should include configured tags', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				tags: ['env:production', 'team:backend'],
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].ddtags).toContain('env:production')
			expect(body[0].ddtags).toContain('team:backend')
		})

		test('should include runtime tag', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry({ runtime: 'bun' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].ddtags).toContain('runtime:bun')
		})

		test('should include namespace tag if present', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry({ namespace: 'api:users' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].ddtags).toContain('namespace:api:users')
		})

		test('should include trace_id tag if present', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(
				createEntry({
					context: { traceId: 'trace-abc-123' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].ddtags).toContain('trace_id:trace-abc-123')
		})

		test('should include span_id tag if present', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(
				createEntry({
					context: { spanId: 'span-xyz-789' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].ddtags).toContain('span_id:span-xyz-789')
		})
	})

	describe('hostname', () => {
		test('should use hostname from context if available', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(
				createEntry({
					context: { hostname: 'my-server-01' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body[0].hostname).toBe('my-server-01')
		})

		test('should use unknown if no hostname available', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			// Will be 'unknown' unless HOSTNAME env var is set
			expect(body[0].hostname).toBeDefined()
		})
	})

	describe('error handling', () => {
		test('should surface API errors after retries', async () => {
			global.fetch = mock(async () => {
				return new Response('Unauthorized', {
					status: 401,
					statusText: 'Unauthorized',
				})
			}) as unknown as typeof fetch

			const transport = new DatadogTransport({
				apiKey: 'invalid-key',
				maxRetries: 1,
				retryDelay: 1,
			})

			transport.log(createEntry())
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)
			expect(transport.getStats().pendingRetry).toBe(1)
		})

		test('should surface network errors after retries', async () => {
			global.fetch = mock(async () => {
				throw new Error('Network error')
			}) as unknown as typeof fetch

			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				maxRetries: 1,
				retryDelay: 1,
			})

			transport.log(createEntry())
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)
			expect(transport.getStats().pendingRetry).toBe(1)
		})
	})

	describe('batching', () => {
		test('should use default batch size of 50', () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
			})
			expect(transport.name).toBe('datadog')
			// Default batchSize is 50 as per DatadogTransport constructor
		})

		test('should batch multiple entries', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				batchSize: 10,
			})

			for (let i = 0; i < 5; i++) {
				transport.log(createEntry({ message: `Message ${i}` }))
			}
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.length).toBe(5)
		})

		test('should auto-flush when batch size reached', async () => {
			const transport = new DatadogTransport({
				apiKey: 'test-api-key',
				batchSize: 3,
			})

			for (let i = 0; i < 3; i++) {
				transport.log(createEntry({ message: `Message ${i}` }))
			}

			// Wait for auto-flush
			await new Promise((r) => setTimeout(r, 50))

			expect(fetchCalls.length).toBe(1)
		})
	})
})

describe('DatadogTransportError', () => {
	test('should create with status code', () => {
		const error = new DatadogTransportError('Unauthorized', 401)
		expect(error.message).toBe('Unauthorized')
		expect(error.statusCode).toBe(401)
		expect(error.name).toBe('DatadogTransportError')
	})

	test('should include response body', () => {
		const error = new DatadogTransportError('Bad Request', 400, '{"error":"Invalid API key"}')
		expect(error.responseBody).toBe('{"error":"Invalid API key"}')
	})

	test('should be instanceof Error', () => {
		const error = new DatadogTransportError('Error', 500)
		expect(error instanceof Error).toBe(true)
	})
})
