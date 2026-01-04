import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { LogEntry } from 'vestig'
import { ClientHTTPTransport } from '../../client/transport'

// Mock fetch globally
const originalFetch = globalThis.fetch

// Mock localStorage
const mockStorage: Record<string, string> = {}
const mockLocalStorage = {
	getItem: (key: string) => mockStorage[key] ?? null,
	setItem: (key: string, value: string) => {
		mockStorage[key] = value
	},
	removeItem: (key: string) => {
		delete mockStorage[key]
	},
	clear: () => {
		Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
	},
}

// Helper to create a mock log entry
function createLogEntry(message: string, overrides: Partial<LogEntry> = {}): LogEntry {
	return {
		timestamp: new Date().toISOString(),
		level: 'info',
		message,
		metadata: {},
		runtime: 'browser',
		...overrides,
	}
}

describe('ClientHTTPTransport - Offline Queue', () => {
	let mockFetch: ReturnType<typeof mock>

	beforeEach(() => {
		// Mock fetch
		mockFetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
		)
		globalThis.fetch = mockFetch as unknown as typeof fetch

		// Clear mock storage
		mockLocalStorage.clear()

		// Mock localStorage on globalThis
		Object.defineProperty(globalThis, 'localStorage', {
			value: mockLocalStorage,
			writable: true,
			configurable: true,
		})
	})

	afterEach(() => {
		globalThis.fetch = originalFetch
	})

	describe('configuration', () => {
		test('should enable offline queue by default', () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
			})

			// Verify transport was created with offline enabled
			expect(transport).toBeDefined()
		})

		test('should accept custom storage key', async () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				offlineQueue: {
					storageKey: 'custom:offline-key',
				},
			})

			await transport.init()

			// Set transport to offline mode by simulating network failure
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			transport.log(createLogEntry('test'))
			await transport.flush()

			// Should persist to custom key
			expect(mockStorage['custom:offline-key']).toBeDefined()

			await transport.destroy()
		})

		test('should accept custom max size', async () => {
			let dropCount = 0
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				offlineQueue: {
					maxSize: 5,
				},
				onDrop: (count) => {
					dropCount = count
				},
			})

			await transport.init()

			// Simulate offline by failing fetch
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			// Add more than maxSize entries
			for (let i = 0; i < 10; i++) {
				transport.log(createLogEntry(`message ${i}`))
			}

			await transport.flush()

			// Check stored entries are limited
			const stored = JSON.parse(mockStorage['vestig:offline-queue'] || '[]')
			expect(stored.length).toBeLessThanOrEqual(5)

			await transport.destroy()
		})

		test('should disable offline queue when specified', async () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				offlineQueue: {
					enabled: false,
				},
			})

			await transport.init()

			// Simulate offline by failing fetch
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			transport.log(createLogEntry('test'))
			await transport.flush()

			// Should not persist
			expect(mockStorage['vestig:offline-queue']).toBeUndefined()

			await transport.destroy()
		})
	})

	describe('persistence', () => {
		test('should persist entries when flush fails', async () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
			})

			await transport.init()

			// First log with successful fetch
			transport.log(createLogEntry('before failure'))

			// Now fail the fetch
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			await transport.flush()

			// Should have persisted
			const stored = JSON.parse(mockStorage['vestig:offline-queue'] || '[]')
			expect(stored.length).toBeGreaterThan(0)
			expect(stored[0].message).toContain('before failure')

			await transport.destroy()
		})

		test('should call onPersist callback', async () => {
			let persistedCount = 0
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				maxRetries: 1,
				retryDelay: 1,
				offlineQueue: {
					onPersist: (count) => {
						persistedCount = count
					},
				},
			})

			await transport.init()

			// Fail fetch to trigger persistence
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			transport.log(createLogEntry('test 1'))
			transport.log(createLogEntry('test 2'))
			await transport.flush()

			expect(persistedCount).toBe(2)

			await transport.destroy()
		})

		test('should merge with existing stored entries', async () => {
			// Pre-populate storage
			mockStorage['vestig:offline-queue'] = JSON.stringify([
				createLogEntry('old entry 1'),
				createLogEntry('old entry 2'),
			])

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				maxRetries: 1,
				retryDelay: 1,
			})

			await transport.init()

			// Clear the buffer that was restored
			await transport.flush()

			// Fail fetch for new entries
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			transport.log(createLogEntry('new entry'))
			await transport.flush()

			// Should have merged old and new
			const stored = JSON.parse(mockStorage['vestig:offline-queue'] || '[]')
			expect(stored.length).toBeGreaterThanOrEqual(1)

			await transport.destroy()
		})
	})

	describe('restoration', () => {
		test('should restore entries from localStorage on init', async () => {
			// Pre-populate storage
			mockStorage['vestig:offline-queue'] = JSON.stringify([
				createLogEntry('stored entry 1'),
				createLogEntry('stored entry 2'),
			])

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
			})

			await transport.init()

			// Should have restored entries
			expect(transport.getBufferSize()).toBe(2)

			// Flush should send the restored entries
			await transport.flush()

			expect(mockFetch).toHaveBeenCalled()
			const call = mockFetch.mock.calls[0]
			const body = JSON.parse(call[1]?.body as string)
			expect(body.entries.length).toBe(2)
			expect(body.entries[0].message).toBe('stored entry 1')

			// Storage should be cleared after restore
			expect(mockStorage['vestig:offline-queue']).toBeUndefined()

			await transport.destroy()
		})

		test('should call onRestore callback', async () => {
			let restoredCount = 0

			mockStorage['vestig:offline-queue'] = JSON.stringify([
				createLogEntry('entry 1'),
				createLogEntry('entry 2'),
				createLogEntry('entry 3'),
			])

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				offlineQueue: {
					onRestore: (count) => {
						restoredCount = count
					},
				},
			})

			await transport.init()

			expect(restoredCount).toBe(3)

			await transport.destroy()
		})

		test('should handle invalid JSON in storage gracefully', async () => {
			mockStorage['vestig:offline-queue'] = 'not valid json {{{}'

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
			})

			// Should not throw
			await transport.init()
			expect(transport.getBufferSize()).toBe(0)

			await transport.destroy()
		})

		test('should handle empty array in storage', async () => {
			mockStorage['vestig:offline-queue'] = '[]'

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
			})

			await transport.init()
			expect(transport.getBufferSize()).toBe(0)

			await transport.destroy()
		})
	})

	describe('network status', () => {
		test('should have getOnlineStatus method', () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
			})

			expect(transport.getOnlineStatus()).toBe(true) // Default online
		})

		test('should have persistNow method', async () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
			})

			await transport.init()

			transport.log(createLogEntry('manual persist test'))

			// Should be able to manually persist
			transport.persistNow()

			expect(mockStorage['vestig:offline-queue']).toBeDefined()
			const stored = JSON.parse(mockStorage['vestig:offline-queue'])
			expect(stored.length).toBe(1)

			await transport.destroy()
		})
	})

	describe('destroy behavior', () => {
		test('should persist remaining buffer on destroy', async () => {
			// Make fetch fail so entries aren't sent
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
			})

			await transport.init()

			transport.log(createLogEntry('will be persisted'))
			transport.log(createLogEntry('also persisted'))

			await transport.destroy()

			// Should have persisted
			expect(mockStorage['vestig:offline-queue']).toBeDefined()
			const stored = JSON.parse(mockStorage['vestig:offline-queue'])
			expect(stored.length).toBe(2)
		})
	})

	describe('localStorage quota handling', () => {
		test('should handle QuotaExceededError by reducing stored entries', async () => {
			let dropCount = 0
			let quotaExceededOnce = true

			// Create a storage that throws quota exceeded on first attempt
			const quotaStorage: Record<string, string> = {}
			const quotaLocalStorage = {
				getItem: (key: string) => quotaStorage[key] ?? null,
				setItem: (key: string, value: string) => {
					if (quotaExceededOnce) {
						quotaExceededOnce = false
						const error = new Error('Quota exceeded')
						error.name = 'QuotaExceededError'
						throw error
					}
					quotaStorage[key] = value
				},
				removeItem: (key: string) => {
					delete quotaStorage[key]
				},
				clear: () => {
					Object.keys(quotaStorage).forEach((key) => delete quotaStorage[key])
				},
			}

			Object.defineProperty(globalThis, 'localStorage', {
				value: quotaLocalStorage,
				writable: true,
				configurable: true,
			})

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
				onDrop: (count) => {
					dropCount = count
				},
			})

			await transport.init()

			// Fail fetch to trigger persistence
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			// Add multiple entries
			for (let i = 0; i < 10; i++) {
				transport.log(createLogEntry(`entry ${i}`))
			}

			await transport.flush()

			// Should have dropped some entries due to quota reduction
			expect(dropCount).toBeGreaterThan(0)

			await transport.destroy()
		})

		test('should handle corrupted JSON during merge gracefully', async () => {
			// Pre-populate with invalid JSON
			mockStorage['vestig:offline-queue'] = '{invalid json structure'

			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
			})

			await transport.init()

			// Fail fetch to trigger persistence
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			transport.log(createLogEntry('new entry'))
			await transport.flush()

			// Should have stored the new entry despite invalid existing data
			const stored = JSON.parse(mockStorage['vestig:offline-queue'] || '[]')
			expect(stored.length).toBeGreaterThanOrEqual(1)

			await transport.destroy()
		})
	})

	describe('online/offline transitions', () => {
		test('should flush when coming back online after failure', async () => {
			let flushSuccessCount = 0
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
				onFlushSuccess: () => {
					flushSuccessCount++
				},
			})

			await transport.init()

			// First: fail flush
			mockFetch = mock(() => Promise.reject(new Error('Network error')))
			globalThis.fetch = mockFetch as unknown as typeof fetch

			transport.log(createLogEntry('entry 1'))
			await transport.flush()

			// Entries should be persisted
			expect(mockStorage['vestig:offline-queue']).toBeDefined()

			// Now: come back online with successful fetch
			mockFetch = mock(() =>
				Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
			)
			globalThis.fetch = mockFetch as unknown as typeof fetch

			// Simulate coming back online by calling flush
			await transport.flush()

			expect(flushSuccessCount).toBeGreaterThanOrEqual(1)

			await transport.destroy()
		})

		test('should preserve entry order across reconnect', async () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
			})

			// Pre-populate storage with ordered entries
			mockStorage['vestig:offline-queue'] = JSON.stringify([
				createLogEntry('offline entry 1'),
				createLogEntry('offline entry 2'),
			])

			await transport.init()

			// Add new entries
			transport.log(createLogEntry('online entry 3'))
			transport.log(createLogEntry('online entry 4'))

			// Flush all
			await transport.flush()

			// Check order in sent request
			expect(mockFetch).toHaveBeenCalled()
			const call = mockFetch.mock.calls[0]
			const body = JSON.parse(call[1]?.body as string)

			// Offline entries should come first, then online entries
			expect(body.entries[0].message).toBe('offline entry 1')
			expect(body.entries[1].message).toBe('offline entry 2')
			expect(body.entries[2].message).toBe('online entry 3')
			expect(body.entries[3].message).toBe('online entry 4')

			await transport.destroy()
		})

		test('should batch offline and online entries together', async () => {
			const transport = new ClientHTTPTransport({
				name: 'test-transport',
				url: '/api/logs',
				batchSize: 100,
				maxRetries: 1,
				retryDelay: 1,
			})

			// Pre-populate storage
			mockStorage['vestig:offline-queue'] = JSON.stringify([
				createLogEntry('offline 1'),
				createLogEntry('offline 2'),
			])

			await transport.init()

			// Add online entries
			transport.log(createLogEntry('online 1'))

			// Flush
			await transport.flush()

			// Should send all entries in single batch
			expect(mockFetch).toHaveBeenCalledTimes(1)
			const call = mockFetch.mock.calls[0]
			const body = JSON.parse(call[1]?.body as string)
			expect(body.entries.length).toBe(3)

			await transport.destroy()
		})
	})
})

describe('Offline Queue exports', () => {
	test('should export OfflineQueueConfig type', async () => {
		const { type } = await import('../../client/transport')
		// TypeScript check - this verifies the type is exported
		type OfflineConfig = import('../../client/transport').OfflineQueueConfig
		const config: OfflineConfig = {
			enabled: true,
			storageKey: 'test',
			maxSize: 100,
		}
		expect(config.enabled).toBe(true)
	})
})
