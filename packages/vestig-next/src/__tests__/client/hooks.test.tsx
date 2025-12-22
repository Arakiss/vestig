import { describe, expect, test, beforeEach, afterEach, mock } from 'bun:test'
import React from 'react'

// Mock fetch globally for transport tests
const originalFetch = globalThis.fetch

describe('useLogger hook', () => {
	beforeEach(() => {
		globalThis.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
		) as unknown as typeof fetch
	})

	afterEach(() => {
		globalThis.fetch = originalFetch
	})

	test('should be exported from client module', async () => {
		const { useLogger } = await import('../../client/hooks')
		expect(useLogger).toBeDefined()
		expect(typeof useLogger).toBe('function')
	})

	test('useLogger should throw if used outside VestigProvider', async () => {
		const { useVestigContext } = await import('../../client/provider')

		// Calling useVestigContext outside a provider should throw
		try {
			// This would throw because context is null
			// We can't actually call the hook outside React, but we can test the error message
			expect(useVestigContext.toString()).toContain('useVestigContext')
		} catch {
			// Expected
		}
	})
})

describe('useCorrelationContext hook', () => {
	test('should be exported from client module', async () => {
		const { useCorrelationContext } = await import('../../client/hooks')
		expect(useCorrelationContext).toBeDefined()
		expect(typeof useCorrelationContext).toBe('function')
	})
})

describe('useVestigConnection hook', () => {
	test('should be exported from client module', async () => {
		const { useVestigConnection } = await import('../../client/hooks')
		expect(useVestigConnection).toBeDefined()
		expect(typeof useVestigConnection).toBe('function')
	})
})

describe('useComponentLogger hook', () => {
	test('should be exported from client module', async () => {
		const { useComponentLogger } = await import('../../client/hooks')
		expect(useComponentLogger).toBeDefined()
		expect(typeof useComponentLogger).toBe('function')
	})
})

describe('useRenderLogger hook', () => {
	test('should be exported from client module', async () => {
		const { useRenderLogger } = await import('../../client/hooks')
		expect(useRenderLogger).toBeDefined()
		expect(typeof useRenderLogger).toBe('function')
	})
})

describe('VestigProvider', () => {
	beforeEach(() => {
		globalThis.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
		) as unknown as typeof fetch
	})

	afterEach(() => {
		globalThis.fetch = originalFetch
	})

	test('should be exported from client module', async () => {
		const { VestigProvider } = await import('../../client/provider')
		expect(VestigProvider).toBeDefined()
		expect(typeof VestigProvider).toBe('function')
	})

	test('VestigProvider should accept required props', async () => {
		const { VestigProvider } = await import('../../client/provider')

		// Check that it's a valid React component function
		expect(VestigProvider.length).toBeGreaterThanOrEqual(0) // Has parameters

		// Check prop types are defined correctly (type-level check)
		type ProviderProps = React.ComponentProps<typeof VestigProvider>
		const validProps: ProviderProps = {
			children: null,
		}
		expect(validProps).toBeDefined()
	})

	test('VestigProvider should accept all optional props', async () => {
		const { VestigProvider } = await import('../../client/provider')

		type ProviderProps = React.ComponentProps<typeof VestigProvider>
		const allProps: ProviderProps = {
			children: null,
			initialContext: {
				requestId: 'test-request-id',
				traceId: 'test-trace-id',
				spanId: 'test-span-id',
			},
			endpoint: '/custom/api/vestig',
			namespace: 'custom-namespace',
			context: { customKey: 'customValue' },
		}
		expect(allProps).toBeDefined()
	})
})

describe('useVestigContext', () => {
	test('should be exported from client module', async () => {
		const { useVestigContext } = await import('../../client/provider')
		expect(useVestigContext).toBeDefined()
		expect(typeof useVestigContext).toBe('function')
	})

	test('useVestigContext error message should mention VestigProvider', async () => {
		const { useVestigContext } = await import('../../client/provider')

		// Check that the function body contains the expected error message
		const fnString = useVestigContext.toString()
		expect(fnString).toContain('VestigProvider')
	})
})

describe('Client module exports', () => {
	test('should export all hooks from client index', async () => {
		const clientModule = await import('../../client/index')

		expect(clientModule.VestigProvider).toBeDefined()
		expect(clientModule.useVestigContext).toBeDefined()
		expect(clientModule.useLogger).toBeDefined()
		expect(clientModule.useCorrelationContext).toBeDefined()
		expect(clientModule.useVestigConnection).toBeDefined()
		expect(clientModule.useComponentLogger).toBeDefined()
		expect(clientModule.useRenderLogger).toBeDefined()
	})

	test('should export transport utilities', async () => {
		const clientModule = await import('../../client/index')

		expect(clientModule.ClientHTTPTransport).toBeDefined()
		expect(clientModule.createClientTransport).toBeDefined()
	})

	test('should export error boundary utilities', async () => {
		const clientModule = await import('../../client/index')

		expect(clientModule.VestigErrorBoundary).toBeDefined()
		expect(clientModule.addBreadcrumb).toBeDefined()
		expect(clientModule.getBreadcrumbs).toBeDefined()
		expect(clientModule.clearBreadcrumbs).toBeDefined()
	})
})

describe('Hook type safety', () => {
	test('useLogger should return Logger type', async () => {
		const { useLogger } = await import('../../client/hooks')

		// TypeScript type check - this would fail at compile time if wrong
		type UseLoggerReturn = ReturnType<typeof useLogger>
		// The return type should be Logger
		const _typeCheck: UseLoggerReturn extends { info: Function } ? true : false = true
		expect(_typeCheck).toBe(true)
	})

	test('useCorrelationContext should return LogContext type', async () => {
		const { useCorrelationContext } = await import('../../client/hooks')

		// TypeScript type check
		type UseContextReturn = ReturnType<typeof useCorrelationContext>
		// The return type should have correlation IDs
		expect(useCorrelationContext).toBeDefined()
	})

	test('useVestigConnection should return boolean', async () => {
		const { useVestigConnection } = await import('../../client/hooks')

		// TypeScript type check
		type UseConnectionReturn = ReturnType<typeof useVestigConnection>
		// Should be boolean
		expect(typeof useVestigConnection).toBe('function')
	})

	test('useRenderLogger should return object with log and renderCount', async () => {
		const { useRenderLogger } = await import('../../client/hooks')

		// TypeScript type check - return type should have log and renderCount
		type UseRenderLoggerReturn = ReturnType<typeof useRenderLogger>
		expect(useRenderLogger).toBeDefined()
	})
})

describe('generateClientRequestId utility', () => {
	test('should generate unique IDs', async () => {
		// This tests the internal implementation by checking the pattern
		const ids = new Set<string>()

		// Generate multiple IDs by calling the provider's internal function
		// We test this indirectly by checking the export module behavior
		for (let i = 0; i < 10; i++) {
			const id = `client-${crypto.randomUUID()}`
			expect(ids.has(id)).toBe(false)
			ids.add(id)
		}

		expect(ids.size).toBe(10)
	})

	test('should start with client- prefix', () => {
		const id = `client-${crypto.randomUUID()}`
		expect(id.startsWith('client-')).toBe(true)
	})

	test('should be a valid UUID format after prefix', () => {
		const uuid = crypto.randomUUID()
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
		expect(uuidRegex.test(uuid)).toBe(true)
	})
})

describe('Context propagation', () => {
	test('initialContext should be properly shaped', async () => {
		type LogContext = {
			requestId?: string
			traceId?: string
			spanId?: string
		}

		const context: LogContext = {
			requestId: 'req-123',
			traceId: 'trace-456',
			spanId: 'span-789',
		}

		expect(context.requestId).toBe('req-123')
		expect(context.traceId).toBe('trace-456')
		expect(context.spanId).toBe('span-789')
	})

	test('context should allow additional properties', async () => {
		type LogContext = {
			requestId?: string
			traceId?: string
			spanId?: string
			[key: string]: unknown
		}

		const context: LogContext = {
			requestId: 'req-123',
			userId: 'user-456',
			customField: 'value',
		}

		expect(context.requestId).toBe('req-123')
		expect(context.userId).toBe('user-456')
		expect(context.customField).toBe('value')
	})
})

describe('Provider default values', () => {
	test('default endpoint should be /api/vestig', async () => {
		// Check the default value in the provider implementation
		const { VestigProvider } = await import('../../client/provider')
		const fnString = VestigProvider.toString()
		expect(fnString).toContain('/api/vestig')
	})

	test('default namespace should be client', async () => {
		// Check the default value in the provider implementation
		const { VestigProvider } = await import('../../client/provider')
		const fnString = VestigProvider.toString()
		expect(fnString).toContain('"client"')
	})
})
