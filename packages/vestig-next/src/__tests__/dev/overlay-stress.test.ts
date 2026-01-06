import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { logStore } from '../../dev/store'

/**
 * Dev Overlay Stress Tests
 *
 * Tests the performance and correctness of the dev overlay components
 * when handling 500+ logs, which is the default maxLogs limit.
 */

/**
 * Helper to reset the store to its initial state
 */
function resetStore() {
	logStore.clearLogs()
	// Reset filters to default
	logStore.toggleAllLevels(true)
	logStore.setSearch('')
	logStore.setSourceFilter('all')
	logStore.setOpen(false)
}

describe('Dev Overlay Store Stress Tests', () => {
	beforeEach(() => {
		resetStore()
	})

	afterEach(() => {
		resetStore()
	})

	describe('High Volume Log Handling', () => {
		test('should handle adding 500 logs without errors', () => {
			const startTime = performance.now()

			for (let i = 0; i < 500; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Log message ${i}`,
					source: 'client',
				})
			}

			const endTime = performance.now()
			const snapshot = logStore.getSnapshot()

			expect(snapshot.logs.length).toBe(500)
			// Adding 500 logs should complete in reasonable time (<500ms)
			expect(endTime - startTime).toBeLessThan(500)
		})

		test('should handle adding 1000 logs and enforce maxLogs limit', () => {
			for (let i = 0; i < 1000; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Log message ${i}`,
					source: 'client',
				})
			}

			const snapshot = logStore.getSnapshot()
			// Default maxLogs is 500
			expect(snapshot.logs.length).toBe(500)

			// Oldest logs should be removed (messages 0-499 dropped)
			expect(snapshot.logs[0].message).toBe('Log message 500')
			expect(snapshot.logs[499].message).toBe('Log message 999')
		})

		test('should handle batch adding 500 logs at once', () => {
			const entries = Array.from({ length: 500 }, (_, i) => ({
				timestamp: new Date().toISOString(),
				level: 'info' as const,
				message: `Batch log ${i}`,
				source: 'client' as const,
			}))

			const startTime = performance.now()
			logStore.addLogs(entries)
			const endTime = performance.now()

			expect(logStore.getSnapshot().logs.length).toBe(500)
			// Batch add should be faster than individual adds
			expect(endTime - startTime).toBeLessThan(200)
		})

		test('should handle 2000 logs with proper truncation', () => {
			// Add 2000 logs rapidly
			for (let i = 0; i < 2000; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: i % 5 === 0 ? 'error' : 'info',
					message: `High volume log ${i}`,
					namespace: `ns.${i % 10}`,
					source: i % 2 === 0 ? 'client' : 'server',
				})
			}

			const snapshot = logStore.getSnapshot()
			expect(snapshot.logs.length).toBe(500)

			// First log should be #1500 (logs 0-1499 were dropped)
			expect(snapshot.logs[0].message).toBe('High volume log 1500')
		})
	})

	describe('Filter Performance with High Volume', () => {
		beforeEach(() => {
			// Reset store completely before each test
			resetStore()
			// Populate with 500 diverse logs
			for (let i = 0; i < 500; i++) {
				const levels = ['trace', 'debug', 'info', 'warn', 'error'] as const
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: levels[i % 5],
					message: `Filter test log ${i}`,
					namespace: `namespace.${i % 20}`,
					source: i % 2 === 0 ? 'client' : 'server',
					metadata: { index: i, category: `cat-${i % 10}` },
				})
			}
		})

		test('should filter by level efficiently with 500 logs', () => {
			logStore.setLevelFilter('trace', false)
			logStore.setLevelFilter('debug', false)
			logStore.setLevelFilter('info', false)
			logStore.setLevelFilter('warn', false)
			// Only show errors

			const startTime = performance.now()
			const filtered = logStore.getFilteredLogs()
			const endTime = performance.now()

			// 500 / 5 = 100 error logs
			expect(filtered.length).toBe(100)
			expect(filtered.every((log) => log.level === 'error')).toBe(true)
			// Filtering should be fast (<50ms)
			expect(endTime - startTime).toBeLessThan(50)
		})

		test('should search through 500 logs efficiently', () => {
			logStore.setSearch('Filter test log 42')

			const startTime = performance.now()
			const filtered = logStore.getFilteredLogs()
			const endTime = performance.now()

			// Should find logs containing "42" (42, 142, 242, 342, 442, 420-429)
			expect(filtered.length).toBeGreaterThan(0)
			expect(filtered.every((log) => log.message.includes('42'))).toBe(true)
			// Search should be fast (<50ms)
			expect(endTime - startTime).toBeLessThan(50)
		})

		test('should search through metadata with 500 logs', () => {
			logStore.setSearch('cat-5')

			const startTime = performance.now()
			const filtered = logStore.getFilteredLogs()
			const endTime = performance.now()

			// Category cat-5 appears every 10 logs
			expect(filtered.length).toBe(50)
			// Metadata search should be reasonably fast (<100ms)
			expect(endTime - startTime).toBeLessThan(100)
		})

		test('should filter by source efficiently', () => {
			logStore.setSourceFilter('server')

			const startTime = performance.now()
			const filtered = logStore.getFilteredLogs()
			const endTime = performance.now()

			// Half of logs are server logs
			expect(filtered.length).toBe(250)
			expect(filtered.every((log) => log.source === 'server')).toBe(true)
			expect(endTime - startTime).toBeLessThan(50)
		})

		test('should handle combined filters efficiently', () => {
			// Filter: errors only, from server, matching "log 4"
			logStore.setLevelFilter('trace', false)
			logStore.setLevelFilter('debug', false)
			logStore.setLevelFilter('info', false)
			logStore.setLevelFilter('warn', false)
			logStore.setSourceFilter('server')
			logStore.setSearch('log 4')

			const startTime = performance.now()
			const filtered = logStore.getFilteredLogs()
			const endTime = performance.now()

			// Very specific filter should result in few matches
			expect(filtered.length).toBeLessThan(50)
			expect(filtered.every((log) => log.level === 'error')).toBe(true)
			expect(filtered.every((log) => log.source === 'server')).toBe(true)
			expect(filtered.every((log) => log.message.includes('4'))).toBe(true)
			expect(endTime - startTime).toBeLessThan(50)
		})
	})

	describe('Namespace Extraction Performance', () => {
		test('should extract unique namespaces from 500 logs efficiently', () => {
			// Create logs with 50 different namespaces
			for (let i = 0; i < 500; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Namespace test ${i}`,
					namespace: `app.module.${i % 50}`,
					source: 'client',
				})
			}

			const startTime = performance.now()
			const namespaces = logStore.getNamespaces()
			const endTime = performance.now()

			expect(namespaces.length).toBe(50)
			expect(namespaces[0]).toBe('app.module.0') // Sorted
			expect(endTime - startTime).toBeLessThan(50)
		})

		test('should handle logs without namespaces', () => {
			for (let i = 0; i < 500; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `No namespace log ${i}`,
					source: 'client',
				})
			}

			const namespaces = logStore.getNamespaces()
			expect(namespaces.length).toBe(0)
		})
	})

	describe('Level Count Calculation Performance', () => {
		test('should count levels from 500 logs efficiently', () => {
			// Create logs with known distribution
			for (let i = 0; i < 500; i++) {
				const levels = ['trace', 'debug', 'info', 'warn', 'error'] as const
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: levels[i % 5],
					message: `Level count test ${i}`,
					source: 'client',
				})
			}

			const startTime = performance.now()
			const counts = logStore.getLevelCounts()
			const endTime = performance.now()

			expect(counts.trace).toBe(100)
			expect(counts.debug).toBe(100)
			expect(counts.info).toBe(100)
			expect(counts.warn).toBe(100)
			expect(counts.error).toBe(100)
			expect(endTime - startTime).toBeLessThan(50)
		})
	})

	describe('Subscriber Stress Tests', () => {
		test('should handle multiple subscribers with 500 logs', () => {
			const notifications: number[] = []

			// Add 10 subscribers
			const unsubscribes = Array.from({ length: 10 }, (_, i) =>
				logStore.subscribe(() => {
					notifications.push(i)
				}),
			)

			// Add 100 logs (fewer to keep test fast)
			for (let i = 0; i < 100; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Subscriber test ${i}`,
					source: 'client',
				})
			}

			// Each log should notify all 10 subscribers
			expect(notifications.length).toBe(1000)

			// Cleanup
			for (const unsubscribe of unsubscribes) {
				unsubscribe()
			}
		})

		test('should handle subscriber errors gracefully', () => {
			let goodNotifications = 0

			// Add a bad subscriber that throws
			const unsubscribeBad = logStore.subscribe(() => {
				throw new Error('Bad subscriber')
			})

			// Add a good subscriber
			const unsubscribeGood = logStore.subscribe(() => {
				goodNotifications++
			})

			// Add a log - should not throw despite bad subscriber
			expect(() => {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: 'Test log',
					source: 'client',
				})
			}).not.toThrow()

			// Good subscriber should still be notified
			expect(goodNotifications).toBe(1)

			// Cleanup subscribers
			unsubscribeBad()
			unsubscribeGood()
		})
	})

	describe('Memory and Cleanup', () => {
		test('should properly clear 500 logs', () => {
			for (let i = 0; i < 500; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Clear test ${i}`,
					namespace: `ns.${i}`,
					metadata: { large: 'x'.repeat(100) },
					source: 'client',
				})
			}

			expect(logStore.getSnapshot().logs.length).toBe(500)

			logStore.clearLogs()

			expect(logStore.getSnapshot().logs.length).toBe(0)
			expect(logStore.getNamespaces().length).toBe(0)
			expect(logStore.getLevelCounts().info).toBe(0)
		})

		test('should handle rapid toggle operations with 500 logs', () => {
			for (let i = 0; i < 500; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Toggle test ${i}`,
					source: 'client',
				})
			}

			// Rapidly toggle open/close
			for (let i = 0; i < 100; i++) {
				logStore.toggleOpen()
			}

			// Should end up closed (100 toggles = back to start)
			expect(logStore.getSnapshot().isOpen).toBe(false)
		})
	})

	describe('Edge Cases with High Volume', () => {
		test('should handle logs with very large metadata', () => {
			for (let i = 0; i < 100; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Large metadata log ${i}`,
					source: 'client',
					metadata: {
						// Create large nested object
						data: Array.from({ length: 100 }, (_, j) => ({
							key: `key-${j}`,
							value: 'x'.repeat(100),
							nested: { a: 1, b: 2, c: 3 },
						})),
					},
				})
			}

			const snapshot = logStore.getSnapshot()
			expect(snapshot.logs.length).toBe(100)

			// Search should still work
			logStore.setSearch('key-50')
			const filtered = logStore.getFilteredLogs()
			// All logs have key-50 in metadata
			expect(filtered.length).toBe(100)
		})

		test('should handle logs with very long messages', () => {
			for (let i = 0; i < 100; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Long message: ${'x'.repeat(10000)}`,
					source: 'client',
				})
			}

			expect(logStore.getSnapshot().logs.length).toBe(100)

			// Search should still work
			logStore.setSearch('Long message')
			expect(logStore.getFilteredLogs().length).toBe(100)
		})

		test('should handle Unicode in messages and search', () => {
			const unicodeMessages = [
				'Log with emoji 🔥🚀💻',
				'Cyrillic: Привет мир',
				'Chinese: 你好世界',
				'Arabic: مرحبا بالعالم',
				'Japanese: こんにちは世界',
			]

			for (let i = 0; i < 500; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: unicodeMessages[i % unicodeMessages.length],
					source: 'client',
				})
			}

			expect(logStore.getSnapshot().logs.length).toBe(500)

			// Search for emoji
			logStore.setSearch('🔥')
			expect(logStore.getFilteredLogs().length).toBe(100)

			// Search for Cyrillic
			logStore.setSearch('Привет')
			expect(logStore.getFilteredLogs().length).toBe(100)
		})

		test('should handle special regex characters in search', () => {
			for (let i = 0; i < 100; i++) {
				logStore.addLog({
					timestamp: new Date().toISOString(),
					level: 'info',
					message: 'Log with special chars: [test] (value) {data} $price ^start',
					source: 'client',
				})
			}

			// These should not throw or cause regex issues
			logStore.setSearch('[test]')
			expect(logStore.getFilteredLogs().length).toBe(100)

			logStore.setSearch('(value)')
			expect(logStore.getFilteredLogs().length).toBe(100)

			logStore.setSearch('$price')
			expect(logStore.getFilteredLogs().length).toBe(100)
		})
	})
})
