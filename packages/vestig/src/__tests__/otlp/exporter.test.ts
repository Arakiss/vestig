import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { OTLPExporter, OTLPExportError } from '../../otlp/exporter'
import { spanProcessors } from '../../otlp/processor'
import { SpanImpl } from '../../tracing/span'
import type { OTLPExportTraceServiceRequest } from '../../otlp/types'

describe('OTLPExporter', () => {
	let originalFetch: typeof global.fetch
	let mockFetch: ReturnType<typeof mock>
	let fetchCalls: Array<{ url: string; options: RequestInit }> = []

	beforeEach(() => {
		originalFetch = global.fetch
		fetchCalls = []
		mockFetch = mock(async (url: string, options: RequestInit) => {
			fetchCalls.push({ url, options })
			return new Response(JSON.stringify({}), { status: 200, statusText: 'OK' })
		})
		global.fetch = mockFetch as unknown as typeof fetch

		// Clear processors
		spanProcessors.clearProcessors()
	})

	afterEach(() => {
		global.fetch = originalFetch
		spanProcessors.clearProcessors()
	})

	describe('constructor', () => {
		test('should create with minimal config', () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			expect(exporter).toBeDefined()
			expect(exporter.getStats().isShutdown).toBe(false)
		})

		test('should accept all config options', () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'my-service',
				serviceVersion: '1.0.0',
				environment: 'production',
				headers: { Authorization: 'Bearer token' },
				resourceAttributes: { 'host.name': 'server-1' },
				batchSize: 50,
				flushInterval: 10000,
				timeout: 60000,
				maxRetries: 5,
				retryDelay: 2000,
				enabled: true,
			})

			expect(exporter.getStats().isShutdown).toBe(false)
		})
	})

	describe('onEnd', () => {
		test('should buffer spans', () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
				batchSize: 100,
			})

			const span = new SpanImpl('test-span')
			span.end()

			exporter.onEnd(span)

			expect(exporter.getStats().buffered).toBe(1)
		})

		test('should not buffer when disabled', () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
				enabled: false,
			})

			const span = new SpanImpl('test-span')
			span.end()

			exporter.onEnd(span)

			expect(exporter.getStats().buffered).toBe(0)
		})

		test('should auto-flush when batch size reached', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
				batchSize: 2,
			})

			const span1 = new SpanImpl('span-1')
			span1.end()
			exporter.onEnd(span1)

			const span2 = new SpanImpl('span-2')
			span2.end()
			exporter.onEnd(span2)

			// Wait for auto-flush
			await new Promise((r) => setTimeout(r, 50))

			expect(fetchCalls.length).toBe(1)
			expect(exporter.getStats().buffered).toBe(0)
		})
	})

	describe('forceFlush', () => {
		test('should send buffered spans', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			const span = new SpanImpl('test-span')
			span.setAttribute('http.method', 'GET')
			span.end()

			exporter.onEnd(span)
			await exporter.forceFlush()

			expect(fetchCalls.length).toBe(1)
			expect(fetchCalls[0].url).toBe('https://otel.example.com/v1/traces')
		})

		test('should send correct OTLP payload', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'my-service',
				serviceVersion: '1.0.0',
				environment: 'test',
			})

			const span = new SpanImpl('database:query')
			span.setAttribute('db.type', 'postgres')
			span.setStatus('ok')
			span.end()

			exporter.onEnd(span)
			await exporter.forceFlush()

			const body = JSON.parse(fetchCalls[0].options.body as string) as OTLPExportTraceServiceRequest

			// Check structure
			expect(body.resourceSpans).toBeDefined()
			expect(body.resourceSpans.length).toBe(1)

			const resourceSpan = body.resourceSpans[0]
			expect(resourceSpan.resource?.attributes).toBeDefined()

			// Check resource attributes include service.name
			const serviceNameAttr = resourceSpan.resource?.attributes.find(
				(a) => a.key === 'service.name',
			)
			expect(serviceNameAttr?.value).toEqual({ stringValue: 'my-service' })

			// Check spans
			expect(resourceSpan.scopeSpans.length).toBe(1)
			expect(resourceSpan.scopeSpans[0].spans.length).toBe(1)

			const otlpSpan = resourceSpan.scopeSpans[0].spans[0]
			expect(otlpSpan.name).toBe('database:query')
			expect(otlpSpan.traceId).toBe(span.traceId)
			expect(otlpSpan.spanId).toBe(span.spanId)
		})

		test('should include custom headers', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
				headers: {
					Authorization: 'Bearer my-token',
					'x-custom-header': 'custom-value',
				},
			})

			const span = new SpanImpl('test')
			span.end()
			exporter.onEnd(span)
			await exporter.forceFlush()

			const headers = fetchCalls[0].options.headers as Record<string, string>
			expect(headers.Authorization).toBe('Bearer my-token')
			expect(headers['x-custom-header']).toBe('custom-value')
		})

		test('should include Content-Type header', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			const span = new SpanImpl('test')
			span.end()
			exporter.onEnd(span)
			await exporter.forceFlush()

			const headers = fetchCalls[0].options.headers as Record<string, string>
			expect(headers['Content-Type']).toBe('application/json')
		})

		test('should not flush when buffer is empty', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			await exporter.forceFlush()

			expect(fetchCalls.length).toBe(0)
		})
	})

	describe('shutdown', () => {
		test('should flush remaining spans', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			const span = new SpanImpl('final-span')
			span.end()
			exporter.onEnd(span)

			await exporter.shutdown()

			expect(fetchCalls.length).toBe(1)
		})

		test('should prevent further buffering after shutdown', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			await exporter.shutdown()

			const span = new SpanImpl('post-shutdown')
			span.end()
			exporter.onEnd(span)

			expect(exporter.getStats().buffered).toBe(0)
			expect(exporter.getStats().isShutdown).toBe(true)
		})
	})

	describe('error handling', () => {
		test('should retry on server error', async () => {
			let attempts = 0
			global.fetch = mock(async () => {
				attempts++
				if (attempts < 3) {
					return new Response('Server Error', { status: 500, statusText: 'Server Error' })
				}
				return new Response('{}', { status: 200, statusText: 'OK' })
			}) as unknown as typeof fetch

			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
				maxRetries: 3,
				retryDelay: 1, // Fast for testing
			})

			const span = new SpanImpl('test')
			span.end()
			exporter.onEnd(span)
			await exporter.forceFlush()

			expect(attempts).toBe(3)
		})

		test('should not retry on client error', async () => {
			let attempts = 0
			global.fetch = mock(async () => {
				attempts++
				return new Response('Bad Request', { status: 400, statusText: 'Bad Request' })
			}) as unknown as typeof fetch

			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
				maxRetries: 3,
				retryDelay: 1,
			})

			const span = new SpanImpl('test')
			span.end()
			exporter.onEnd(span)
			await exporter.forceFlush()

			// Should only try once for client errors
			expect(attempts).toBe(1)
		})
	})

	describe('getStats', () => {
		test('should return current stats', () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			const stats = exporter.getStats()

			expect(stats.buffered).toBe(0)
			expect(stats.isFlushing).toBe(false)
			expect(stats.isShutdown).toBe(false)
		})

		test('should track buffered spans', () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			const span = new SpanImpl('test')
			span.end()
			exporter.onEnd(span)

			expect(exporter.getStats().buffered).toBe(1)
		})
	})

	describe('integration with span lifecycle', () => {
		test('should receive spans automatically when registered', async () => {
			const exporter = new OTLPExporter({
				endpoint: 'https://otel.example.com/v1/traces',
				serviceName: 'test-service',
			})

			// Register the exporter as a span processor
			spanProcessors.addProcessor(exporter)

			// Create and end a span - exporter should receive it automatically
			const span = new SpanImpl('auto-captured')
			span.setAttribute('test', true)
			span.end()

			await exporter.forceFlush()

			expect(fetchCalls.length).toBe(1)

			const body = JSON.parse(fetchCalls[0].options.body as string) as OTLPExportTraceServiceRequest
			expect(body.resourceSpans[0].scopeSpans[0].spans[0].name).toBe('auto-captured')
		})
	})
})

describe('OTLPExportError', () => {
	test('should create with status code', () => {
		const error = new OTLPExportError('Export failed', 500)
		expect(error.message).toBe('Export failed')
		expect(error.statusCode).toBe(500)
		expect(error.name).toBe('OTLPExportError')
	})

	test('should include response body', () => {
		const error = new OTLPExportError('Bad Request', 400, '{"error":"Invalid format"}')
		expect(error.responseBody).toBe('{"error":"Invalid format"}')
	})

	describe('isNetworkError', () => {
		test('should return true for status 0', () => {
			expect(new OTLPExportError('Network error', 0).isNetworkError).toBe(true)
		})

		test('should return false for non-zero status', () => {
			expect(new OTLPExportError('Server error', 500).isNetworkError).toBe(false)
		})
	})

	describe('isTimeout', () => {
		test('should return true for status 408', () => {
			expect(new OTLPExportError('Timeout', 408).isTimeout).toBe(true)
		})
	})

	describe('isClientError', () => {
		test('should return true for 4xx status codes', () => {
			expect(new OTLPExportError('Bad Request', 400).isClientError).toBe(true)
			expect(new OTLPExportError('Unauthorized', 401).isClientError).toBe(true)
			expect(new OTLPExportError('Not Found', 404).isClientError).toBe(true)
		})
	})

	describe('isServerError', () => {
		test('should return true for 5xx status codes', () => {
			expect(new OTLPExportError('Server Error', 500).isServerError).toBe(true)
			expect(new OTLPExportError('Bad Gateway', 502).isServerError).toBe(true)
		})
	})

	describe('isRetryable', () => {
		test('should return true for network errors, timeouts, and server errors', () => {
			expect(new OTLPExportError('Network', 0).isRetryable).toBe(true)
			expect(new OTLPExportError('Timeout', 408).isRetryable).toBe(true)
			expect(new OTLPExportError('Server Error', 500).isRetryable).toBe(true)
		})

		test('should return false for client errors', () => {
			expect(new OTLPExportError('Bad Request', 400).isRetryable).toBe(false)
		})
	})
})
