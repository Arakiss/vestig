import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import {
	instrumentFetch,
	isFetchInstrumented,
	uninstrumentFetch,
} from '../../instrumentation/fetch'
import { getSpanProcessors, registerSpanProcessor, unregisterSpanProcessor } from '../../otlp'
import type { SpanProcessor } from '../../otlp/processor'
import type { Span } from '../../tracing/types'

describe('instrumentFetch', () => {
	// Store original fetch
	let originalFetch: typeof fetch

	// Captured spans for testing
	let capturedSpans: Span[] = []

	// Test processor to capture spans
	const testProcessor: SpanProcessor = {
		onStart: () => {},
		onEnd: (span: Span) => {
			capturedSpans.push(span)
		},
	}

	beforeEach(() => {
		// Store original
		originalFetch = globalThis.fetch

		// Clear captured spans
		capturedSpans = []

		// Register test processor
		registerSpanProcessor(testProcessor)

		// Ensure fetch is not instrumented
		if (isFetchInstrumented()) {
			uninstrumentFetch()
		}
	})

	afterEach(() => {
		// Cleanup
		uninstrumentFetch()
		unregisterSpanProcessor(testProcessor)

		// Restore original fetch if needed
		globalThis.fetch = originalFetch
	})

	test('should instrument fetch and create spans', async () => {
		// Mock fetch
		globalThis.fetch = mock(async () => new Response('{"ok":true}', { status: 200 }))

		instrumentFetch()

		expect(isFetchInstrumented()).toBe(true)

		// Make a request
		await fetch('https://api.example.com/users')

		// Should have captured a span
		expect(capturedSpans.length).toBe(1)

		const span = capturedSpans[0]
		expect(span.name).toContain('http.client')
		expect(span.name).toContain('GET')
		expect(span.name).toContain('api.example.com')
		expect(span.attributes['http.request.method']).toBe('GET')
		expect(span.attributes['url.full']).toBe('https://api.example.com/users')
		expect(span.attributes['server.address']).toBe('api.example.com')
		expect(span.attributes['http.response.status_code']).toBe(200)
		expect(span.status).toBe('ok')
	})

	test('should ignore URLs matching patterns', async () => {
		// Mock fetch
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch({
			ignoreUrls: ['/health', /^https:\/\/metrics\./],
		})

		// These should NOT create spans
		await fetch('https://api.example.com/health')
		await fetch('https://metrics.example.com/data')

		expect(capturedSpans.length).toBe(0)

		// This SHOULD create a span
		await fetch('https://api.example.com/users')
		expect(capturedSpans.length).toBe(1)
	})

	test('should capture request headers', async () => {
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch({
			captureHeaders: ['content-type', 'x-request-id'],
		})

		await fetch('https://api.example.com/users', {
			headers: {
				'Content-Type': 'application/json',
				'X-Request-ID': 'test-123',
			},
		})

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.attributes['http.request.header.content-type']).toBe('application/json')
		expect(span.attributes['http.request.header.x-request-id']).toBe('test-123')
	})

	test('should set error status on HTTP errors', async () => {
		globalThis.fetch = mock(async () => new Response('Not Found', { status: 404 }))

		instrumentFetch()

		await fetch('https://api.example.com/missing')

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.attributes['http.response.status_code']).toBe(404)
		expect(span.status).toBe('error')
		expect(span.statusMessage).toContain('404')
	})

	test('should set error status on network errors', async () => {
		globalThis.fetch = mock(async () => {
			throw new Error('Network error')
		})

		instrumentFetch()

		await expect(fetch('https://api.example.com/timeout')).rejects.toThrow('Network error')

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.status).toBe('error')
		expect(span.statusMessage).toContain('Network error')
		expect(span.attributes['error.type']).toBe('Error')
	})

	test('should use custom span name prefix', async () => {
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch({
			spanNamePrefix: 'fetch.outgoing',
		})

		await fetch('https://api.example.com/users')

		expect(capturedSpans.length).toBe(1)
		expect(capturedSpans[0].name).toContain('fetch.outgoing')
	})

	test('should use custom span name generator', async () => {
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch({
			spanNameGenerator: (method, url) => `custom-${method}-${url.pathname}`,
		})

		await fetch('https://api.example.com/users')

		expect(capturedSpans.length).toBe(1)
		expect(capturedSpans[0].name).toBe('custom-GET-/users')
	})

	test('should add default attributes', async () => {
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch({
			defaultAttributes: {
				'app.version': '1.0.0',
				'service.name': 'test-app',
			},
		})

		await fetch('https://api.example.com/users')

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.attributes['app.version']).toBe('1.0.0')
		expect(span.attributes['service.name']).toBe('test-app')
	})

	test('should handle POST requests with method', async () => {
		globalThis.fetch = mock(async () => new Response('{"id":1}', { status: 201 }))

		instrumentFetch()

		await fetch('https://api.example.com/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Test' }),
		})

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.name).toContain('POST')
		expect(span.attributes['http.request.method']).toBe('POST')
		expect(span.attributes['http.response.status_code']).toBe(201)
	})

	test('should propagate trace context via traceparent header', async () => {
		let capturedHeaders: Headers | null = null
		globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
			capturedHeaders = new Headers(init?.headers)
			return new Response('ok', { status: 200 })
		})

		instrumentFetch({
			propagateContext: true,
		})

		await fetch('https://api.example.com/users')

		expect(capturedHeaders).not.toBeNull()
		expect(capturedHeaders!.has('traceparent')).toBe(true)

		// Verify traceparent format: 00-traceId-spanId-flags
		const traceparent = capturedHeaders!.get('traceparent')!
		expect(traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-0[01]$/)
	})

	test('should not propagate context when disabled', async () => {
		let capturedHeaders: Headers | null = null
		globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
			capturedHeaders = new Headers(init?.headers)
			return new Response('ok', { status: 200 })
		})

		instrumentFetch({
			propagateContext: false,
		})

		await fetch('https://api.example.com/users')

		expect(capturedHeaders).not.toBeNull()
		expect(capturedHeaders!.has('traceparent')).toBe(false)
	})

	test('should uninstrument fetch', async () => {
		const mockFn = mock(async () => new Response('ok', { status: 200 }))
		globalThis.fetch = mockFn

		instrumentFetch()
		expect(isFetchInstrumented()).toBe(true)

		uninstrumentFetch()
		expect(isFetchInstrumented()).toBe(false)

		// After uninstrumentation, fetch should be the mock (not wrapped)
		await fetch('https://api.example.com/users')

		// No spans should be captured
		expect(capturedSpans.length).toBe(0)
	})

	test('should handle Request objects', async () => {
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch()

		const request = new Request('https://api.example.com/users', {
			method: 'PUT',
		})

		await fetch(request)

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.attributes['http.request.method']).toBe('PUT')
		expect(span.attributes['server.address']).toBe('api.example.com')
	})

	test('should handle URL objects', async () => {
		globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

		instrumentFetch()

		const url = new URL('https://api.example.com/users?page=1')

		await fetch(url)

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.attributes['url.path']).toBe('/users')
		expect(span.attributes['url.query']).toBe('page=1')
	})

	test('should record duration', async () => {
		globalThis.fetch = mock(async () => {
			// Simulate some latency
			await new Promise((resolve) => setTimeout(resolve, 10))
			return new Response('ok', { status: 200 })
		})

		instrumentFetch()

		await fetch('https://api.example.com/users')

		expect(capturedSpans.length).toBe(1)
		const span = capturedSpans[0]
		expect(span.attributes['http.response.duration_ms']).toBeGreaterThanOrEqual(10)
	})

	test('should warn on double instrumentation', async () => {
		const warnSpy = mock(() => {})
		const originalWarn = console.warn
		console.warn = warnSpy

		try {
			globalThis.fetch = mock(async () => new Response('ok', { status: 200 }))

			instrumentFetch()
			instrumentFetch() // Second call

			expect(warnSpy).toHaveBeenCalled()
		} finally {
			console.warn = originalWarn
		}
	})
})
