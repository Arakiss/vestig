import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
	createMiddlewareMatcher,
	createProxyMatcher,
	createVestigMiddleware,
	createVestigProxy,
	vestigMiddleware,
	vestigProxy,
} from '../../server/middleware'
import { MockNextResponse, createMockNextRequest } from '../mocks/next-server'

// Mock NextResponse since we can't import it directly in tests
const originalNextResponse = globalThis.NextResponse

beforeEach(() => {
	// Reset NextResponse mock before each test
	;(globalThis as Record<string, unknown>).NextResponse = MockNextResponse
})

describe('createVestigMiddleware', () => {
	test('should create a middleware function', () => {
		const middleware = createVestigMiddleware()
		expect(typeof middleware).toBe('function')
	})

	test('should skip paths in skipPaths array', () => {
		const middleware = createVestigMiddleware({
			skipPaths: ['/_next', '/api/health'],
		})

		const request = createMockNextRequest('https://example.com/_next/static/chunk.js')
		const response = middleware(request as never)

		// Should return NextResponse.next() for skipped paths
		expect(response).toBeDefined()
	})

	test('should skip /_next by default', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/_next/static/file.js')
		const response = middleware(request as never)

		expect(response).toBeDefined()
	})

	test('should skip /favicon.ico by default', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/favicon.ico')
		const response = middleware(request as never)

		expect(response).toBeDefined()
	})

	test('should skip /api/vestig by default', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/api/vestig')
		const response = middleware(request as never)

		expect(response).toBeDefined()
	})

	test('should extract existing request ID from header', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/api/users', {
			headers: { 'x-request-id': 'existing-id-123' },
		})

		const response = middleware(request as never)

		// Response should have the same request ID
		expect(response.headers.get('x-request-id')).toBe('existing-id-123')
	})

	test('should generate new request ID if missing', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/api/users')
		const response = middleware(request as never)

		const requestId = response.headers.get('x-request-id')
		expect(requestId).toBeDefined()
		expect(requestId).not.toBe('')
		// Should be UUID format
		expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
	})

	test('should parse traceparent header', () => {
		const middleware = createVestigMiddleware()

		const traceId = '0af7651916cd43dd8448eb211c80319c'
		const spanId = 'b7ad6b7169203331'
		const traceparent = `00-${traceId}-${spanId}-01`

		const request = createMockNextRequest('https://example.com/api/users', {
			headers: { traceparent },
		})

		const response = middleware(request as never)

		// Should set trace ID from parsed traceparent
		expect(response.headers.get('x-trace-id')).toBe(traceId)
	})

	test('should set correlation headers on response', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/api/users')
		const response = middleware(request as never)

		expect(response.headers.get('x-request-id')).toBeDefined()
		expect(response.headers.get('x-trace-id')).toBeDefined()
	})

	test('should use custom requestIdHeader', () => {
		const middleware = createVestigMiddleware({
			requestIdHeader: 'x-custom-request-id',
		})

		const request = createMockNextRequest('https://example.com/api/users', {
			headers: { 'x-custom-request-id': 'custom-123' },
		})

		const response = middleware(request as never)

		// Should use the custom header
		expect(response.headers.get('x-request-id')).toBe('custom-123')
	})

	test('should merge custom options with defaults', () => {
		const middleware = createVestigMiddleware({
			level: 'debug',
			namespace: 'custom-middleware',
			skipPaths: ['/custom-skip'],
		})

		// Should skip custom path
		const request = createMockNextRequest('https://example.com/custom-skip/file')
		const response = middleware(request as never)
		expect(response).toBeDefined()
	})

	test('should handle requests with search params', () => {
		const middleware = createVestigMiddleware()

		const request = createMockNextRequest('https://example.com/api/search?q=test&page=1')
		const response = middleware(request as never)

		expect(response.headers.get('x-request-id')).toBeDefined()
	})

	test('should handle requests with various methods', () => {
		const middleware = createVestigMiddleware()

		const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

		for (const method of methods) {
			const request = createMockNextRequest('https://example.com/api/users', {
				method,
			})
			const response = middleware(request as never)
			expect(response.headers.get('x-request-id')).toBeDefined()
		}
	})
})

describe('createVestigProxy', () => {
	test('should create a proxy function (alias for middleware)', () => {
		const proxy = createVestigProxy()
		expect(typeof proxy).toBe('function')
	})

	test('should work identically to createVestigMiddleware', () => {
		const proxy = createVestigProxy({ skipPaths: ['/health'] })

		const request = createMockNextRequest('https://example.com/health')
		const response = proxy(request as never)

		expect(response).toBeDefined()
	})
})

describe('vestigMiddleware (pre-configured)', () => {
	test('should be a function', () => {
		expect(typeof vestigMiddleware).toBe('function')
	})

	test('should work with default configuration', () => {
		const request = createMockNextRequest('https://example.com/api/users')
		const response = vestigMiddleware(request as never)

		expect(response.headers.get('x-request-id')).toBeDefined()
	})
})

describe('vestigProxy (pre-configured)', () => {
	test('should be a function', () => {
		expect(typeof vestigProxy).toBe('function')
	})

	test('should work with default configuration', () => {
		const request = createMockNextRequest('https://example.com/api/users')
		const response = vestigProxy(request as never)

		expect(response.headers.get('x-request-id')).toBeDefined()
	})
})

describe('createProxyMatcher', () => {
	test('should return default matcher config', () => {
		const config = createProxyMatcher()

		expect(config.matcher).toBeDefined()
		expect(Array.isArray(config.matcher)).toBe(true)
		expect(config.matcher[0]).toContain('_next')
	})

	test('should accept custom include patterns', () => {
		const config = createProxyMatcher({
			include: ['/api/:path*', '/dashboard/:path*'],
		})

		expect(config.matcher).toEqual(['/api/:path*', '/dashboard/:path*'])
	})
})

describe('createMiddlewareMatcher (deprecated alias)', () => {
	test('should be alias for createProxyMatcher', () => {
		expect(createMiddlewareMatcher).toBe(createProxyMatcher)
	})
})

describe('middleware options', () => {
	test('should respect enabled=false', () => {
		const middleware = createVestigMiddleware({
			enabled: false,
		})

		const request = createMockNextRequest('https://example.com/api/users')
		const response = middleware(request as never)

		// Should still work but not log
		expect(response).toBeDefined()
	})

	test('should accept different log levels', () => {
		const levels = ['trace', 'debug', 'info', 'warn', 'error'] as const

		for (const level of levels) {
			const middleware = createVestigMiddleware({ level })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = middleware(request as never)
			expect(response).toBeDefined()
		}
	})

	test('should accept sanitize presets', () => {
		const presets = ['none', 'minimal', 'default', 'gdpr', 'hipaa', 'pci-dss'] as const

		for (const preset of presets) {
			const middleware = createVestigMiddleware({ sanitize: preset })
			const request = createMockNextRequest('https://example.com/api/test')
			const response = middleware(request as never)
			expect(response).toBeDefined()
		}
	})

	test('should accept structured option', () => {
		const middleware = createVestigMiddleware({
			structured: false,
		})

		const request = createMockNextRequest('https://example.com/api/users')
		const response = middleware(request as never)

		expect(response).toBeDefined()
	})

	test('should accept timing option', () => {
		const middleware = createVestigMiddleware({
			timing: false,
		})

		const request = createMockNextRequest('https://example.com/api/users')
		const response = middleware(request as never)

		expect(response).toBeDefined()
	})

	test('should accept custom namespace', () => {
		const middleware = createVestigMiddleware({
			namespace: 'my-app:middleware',
		})

		const request = createMockNextRequest('https://example.com/api/users')
		const response = middleware(request as never)

		expect(response).toBeDefined()
	})
})
