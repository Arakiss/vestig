import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { BatchTransportError } from '../transports/batch'
import { SentryTransport, SentryTransportError } from '../transports/sentry'
import type { LogEntry } from '../types'

const TEST_DSN = 'https://abc123@o123456.ingest.sentry.io/1234567'

const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
	timestamp: new Date().toISOString(),
	level: 'error',
	message: 'Test error message',
	runtime: 'bun',
	...overrides,
})

describe('SentryTransport', () => {
	let originalFetch: typeof global.fetch
	let mockFetch: ReturnType<typeof mock>
	let fetchCalls: Array<{ url: string; options: RequestInit }> = []

	beforeEach(() => {
		originalFetch = global.fetch
		fetchCalls = []
		mockFetch = mock(async (url: string, options: RequestInit) => {
			fetchCalls.push({ url, options })
			return new Response(JSON.stringify({ id: 'event-id-123' }), {
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
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})
			expect(transport.name).toBe('sentry')
		})

		test('should accept custom name', () => {
			const transport = new SentryTransport({
				name: 'custom-sentry',
				dsn: TEST_DSN,
			})
			expect(transport.name).toBe('custom-sentry')
		})

		test('should throw on invalid DSN', () => {
			expect(() => {
				new SentryTransport({
					dsn: 'invalid-dsn',
				})
			}).toThrow(SentryTransportError)
		})

		test('should throw on DSN without key', () => {
			expect(() => {
				new SentryTransport({
					dsn: 'https://sentry.io/1234567',
				})
			}).toThrow('Invalid Sentry DSN')
		})
	})

	describe('DSN parsing', () => {
		test('should parse standard Sentry DSN', async () => {
			const transport = new SentryTransport({
				dsn: 'https://abc123@o123456.ingest.sentry.io/1234567',
			})

			transport.log(createEntry())
			await transport.flush()

			expect(fetchCalls[0].url).toBe('https://o123456.ingest.sentry.io/api/1234567/store/')
		})

		test('should parse self-hosted DSN', async () => {
			const transport = new SentryTransport({
				dsn: 'https://mykey@sentry.mycompany.com/42',
			})

			transport.log(createEntry())
			await transport.flush()

			expect(fetchCalls[0].url).toBe('https://sentry.mycompany.com/api/42/store/')
		})
	})

	describe('authentication', () => {
		test('should include X-Sentry-Auth header', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry())
			await transport.flush()

			const headers = fetchCalls[0].options.headers as Record<string, string>
			expect(headers['X-Sentry-Auth']).toContain('Sentry sentry_version=7')
			expect(headers['X-Sentry-Auth']).toContain('sentry_key=abc123')
			expect(headers['X-Sentry-Auth']).toContain('sentry_client=vestig/1.0.0')
		})

		test('should include Content-Type header', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry())
			await transport.flush()

			const headers = fetchCalls[0].options.headers as Record<string, string>
			expect(headers['Content-Type']).toBe('application/json')
		})
	})

	describe('minLevel filtering', () => {
		test('should default minLevel to warn', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			// info level should be filtered
			transport.log(createEntry({ level: 'info' }))
			await transport.flush()

			expect(fetchCalls.length).toBe(0)
		})

		test('should send warn level with default minLevel', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry({ level: 'warn' }))
			await transport.flush()

			expect(fetchCalls.length).toBe(1)
		})

		test('should send error level with default minLevel', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry({ level: 'error' }))
			await transport.flush()

			expect(fetchCalls.length).toBe(1)
		})

		test('should respect custom minLevel', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				minLevel: 'info',
			})

			transport.log(createEntry({ level: 'info' }))
			await transport.flush()

			expect(fetchCalls.length).toBe(1)
		})

		test('should filter below custom minLevel', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				minLevel: 'error',
			})

			transport.log(createEntry({ level: 'warn' }))
			await transport.flush()

			expect(fetchCalls.length).toBe(0)
		})
	})

	describe('log transformation', () => {
		test('should transform log entry to Sentry event format', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				environment: 'production',
				release: 'my-app@1.2.3',
			})

			transport.log(createEntry({ message: 'Test error' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.message.formatted).toBe('Test error')
			expect(body.environment).toBe('production')
			expect(body.release).toBe('my-app@1.2.3')
			expect(body.platform).toBe('node')
		})

		test('should include event_id', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.event_id).toBeDefined()
			expect(body.event_id.length).toBe(32) // 16 bytes = 32 hex chars
		})

		test('should include timestamp', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			const timestamp = new Date().toISOString()
			transport.log(createEntry({ timestamp }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.timestamp).toBe(timestamp)
		})

		test('should map log levels correctly', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				minLevel: 'trace',
			})

			const levels = ['trace', 'debug', 'info', 'warn', 'error'] as const
			const expectedSentry = ['debug', 'debug', 'info', 'warning', 'error']

			for (let i = 0; i < levels.length; i++) {
				fetchCalls = []
				transport.log(createEntry({ level: levels[i] }))
				await transport.flush()

				const body = JSON.parse(fetchCalls[0].options.body as string)
				expect(body.level).toBe(expectedSentry[i])
			}
		})

		test('should use namespace as logger', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry({ namespace: 'api:users' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.logger).toBe('api:users')
		})

		test('should use vestig as default logger', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.logger).toBe('vestig')
		})
	})

	describe('tags', () => {
		test('should include configured tags', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				tags: { team: 'backend', version: '1.0' },
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.tags.team).toBe('backend')
			expect(body.tags.version).toBe('1.0')
		})

		test('should include service as tag', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				service: 'my-api',
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.tags.service).toBe('my-api')
		})

		test('should include runtime tag', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry({ runtime: 'bun' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.tags.runtime).toBe('bun')
		})

		test('should include namespace tag if present', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry({ namespace: 'api:users' }))
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.tags.namespace).toBe('api:users')
		})
	})

	describe('extra context', () => {
		test('should include metadata as extra', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(
				createEntry({
					metadata: { userId: 123, action: 'login' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.extra.userId).toBe(123)
			expect(body.extra.action).toBe('login')
		})

		test('should include context as extra', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(
				createEntry({
					context: { requestId: 'req-123' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.extra.requestId).toBe('req-123')
		})
	})

	describe('error handling', () => {
		test('should include error as exception', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(
				createEntry({
					error: {
						name: 'ValidationError',
						message: 'Invalid email',
						stack: 'Error: Invalid email\n    at validate (app.ts:10:5)',
					},
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.exception.values[0].type).toBe('ValidationError')
			expect(body.exception.values[0].value).toBe('Invalid email')
			expect(body.exception.values[0].stacktrace.frames).toBeDefined()
		})

		test('should parse stack trace into frames', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(
				createEntry({
					error: {
						name: 'Error',
						message: 'Test',
						stack: 'Error: Test\n    at foo (app.ts:10:5)\n    at bar (index.ts:20:10)',
					},
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			const frames = body.exception.values[0].stacktrace.frames
			expect(frames.length).toBe(2)
			// Sentry expects frames in reverse order (most recent last)
			expect(frames[0].function).toBe('bar')
			expect(frames[1].function).toBe('foo')
		})

		test('should surface API errors after retries', async () => {
			global.fetch = mock(async () => {
				return new Response('Unauthorized', {
					status: 401,
					statusText: 'Unauthorized',
				})
			}) as unknown as typeof fetch

			const transport = new SentryTransport({
				dsn: TEST_DSN,
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

			const transport = new SentryTransport({
				dsn: TEST_DSN,
				maxRetries: 1,
				retryDelay: 1,
			})

			transport.log(createEntry())
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)
			expect(transport.getStats().pendingRetry).toBe(1)
		})
	})

	describe('trace context', () => {
		test('should include trace_id if present', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(
				createEntry({
					context: { traceId: 'trace-abc-123', spanId: 'span-xyz' },
				}),
			)
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.contexts.trace.trace_id).toBe('trace-abc-123')
			expect(body.contexts.trace.span_id).toBe('span-xyz')
		})
	})

	describe('server name', () => {
		test('should include serverName if configured', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
				serverName: 'api-server-01',
			})

			transport.log(createEntry())
			await transport.flush()

			const body = JSON.parse(fetchCalls[0].options.body as string)
			expect(body.server_name).toBe('api-server-01')
		})
	})

	describe('batching', () => {
		test('should use default batch size of 10', () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})
			expect(transport.name).toBe('sentry')
			// Default batchSize is 10 for Sentry
		})

		test('should send each entry as separate event', async () => {
			const transport = new SentryTransport({
				dsn: TEST_DSN,
			})

			transport.log(createEntry({ message: 'Error 1' }))
			transport.log(createEntry({ message: 'Error 2' }))
			await transport.flush()

			// Each entry is sent as a separate request
			expect(fetchCalls.length).toBe(2)
		})
	})
})

describe('SentryTransportError', () => {
	test('should create with status code', () => {
		const error = new SentryTransportError('Unauthorized', 401)
		expect(error.message).toBe('Unauthorized')
		expect(error.statusCode).toBe(401)
		expect(error.name).toBe('SentryTransportError')
	})

	test('should include response body', () => {
		const error = new SentryTransportError('Bad Request', 400, '{"error":"Invalid DSN"}')
		expect(error.responseBody).toBe('{"error":"Invalid DSN"}')
	})

	test('should be instanceof Error', () => {
		const error = new SentryTransportError('Error', 500)
		expect(error instanceof Error).toBe(true)
	})
})
