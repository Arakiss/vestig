import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Deduplicator } from '../utils/dedupe'

describe('Deduplicator', () => {
	let deduplicator: Deduplicator

	afterEach(() => {
		deduplicator?.destroy()
	})

	describe('basic suppression', () => {
		beforeEach(() => {
			deduplicator = new Deduplicator({
				enabled: true,
				windowMs: 1000,
			})
		})

		test('should not suppress first occurrence', () => {
			const result = deduplicator.shouldSuppress('test message', 'info')
			expect(result.suppressed).toBe(false)
		})

		test('should suppress subsequent identical messages', () => {
			deduplicator.shouldSuppress('test message', 'info')
			const result = deduplicator.shouldSuppress('test message', 'info')
			expect(result.suppressed).toBe(true)
		})

		test('should not suppress different messages', () => {
			deduplicator.shouldSuppress('message 1', 'info')
			const result = deduplicator.shouldSuppress('message 2', 'info')
			expect(result.suppressed).toBe(false)
		})

		test('should track multiple duplicates', () => {
			deduplicator.shouldSuppress('test message', 'info')
			deduplicator.shouldSuppress('test message', 'info')
			deduplicator.shouldSuppress('test message', 'info')
			deduplicator.shouldSuppress('test message', 'info')

			const pending = deduplicator.getPendingSummaries()
			expect(pending).toHaveLength(1)
			expect(pending[0]?.count).toBe(3) // 3 suppressed (first one logged)
		})
	})

	describe('level handling', () => {
		beforeEach(() => {
			deduplicator = new Deduplicator({
				enabled: true,
				includeLevel: true,
			})
		})

		test('should treat same message at different levels as different', () => {
			deduplicator.shouldSuppress('test message', 'info')
			const result = deduplicator.shouldSuppress('test message', 'error')
			expect(result.suppressed).toBe(false)
		})

		test('should suppress same message at same level', () => {
			deduplicator.shouldSuppress('test message', 'warn')
			const result = deduplicator.shouldSuppress('test message', 'warn')
			expect(result.suppressed).toBe(true)
		})
	})

	describe('namespace handling', () => {
		beforeEach(() => {
			deduplicator = new Deduplicator({
				enabled: true,
				includeNamespace: true,
			})
		})

		test('should treat same message from different namespaces as different', () => {
			deduplicator.shouldSuppress('test message', 'info', 'auth')
			const result = deduplicator.shouldSuppress('test message', 'info', 'db')
			expect(result.suppressed).toBe(false)
		})

		test('should suppress same message from same namespace', () => {
			deduplicator.shouldSuppress('test message', 'info', 'auth')
			const result = deduplicator.shouldSuppress('test message', 'info', 'auth')
			expect(result.suppressed).toBe(true)
		})
	})

	describe('window expiration', () => {
		test('should emit summary after window expires', async () => {
			deduplicator = new Deduplicator({
				enabled: true,
				windowMs: 100, // Use 100ms window
			})

			// First occurrence
			deduplicator.shouldSuppress('test message', 'info')
			// Second occurrence (suppressed)
			deduplicator.shouldSuppress('test message', 'info')
			// Third occurrence (suppressed)
			deduplicator.shouldSuppress('test message', 'info')

			// Wait for window to expire but before cleanup runs second time
			await new Promise((resolve) => setTimeout(resolve, 120))

			// Fourth occurrence - should trigger summary
			const result = deduplicator.shouldSuppress('test message', 'info')
			expect(result.suppressed).toBe(false)
			expect(result.isFlush).toBe(true)
			expect(result.suppressedCount).toBe(2) // 2 were suppressed
		})

		test('should not emit summary if no duplicates', async () => {
			deduplicator = new Deduplicator({
				enabled: true,
				windowMs: 100,
			})

			// Only one occurrence
			deduplicator.shouldSuppress('test message', 'info')

			// Wait for window to expire
			await new Promise((resolve) => setTimeout(resolve, 120))

			// New occurrence
			const result = deduplicator.shouldSuppress('test message', 'info')
			expect(result.suppressed).toBe(false)
			expect(result.isFlush).toBeUndefined()
			expect(result.suppressedCount).toBeUndefined()
		})
	})

	describe('maxSize eviction', () => {
		test('should evict oldest when at capacity', () => {
			deduplicator = new Deduplicator({
				enabled: true,
				maxSize: 3,
			})

			// Fill up to max
			deduplicator.shouldSuppress('message 1', 'info')
			deduplicator.shouldSuppress('message 2', 'info')
			deduplicator.shouldSuppress('message 3', 'info')

			// Add one more - should evict 'message 1'
			deduplicator.shouldSuppress('message 4', 'info')

			// 'message 1' should not be tracked anymore
			const result = deduplicator.shouldSuppress('message 1', 'info')
			expect(result.suppressed).toBe(false)
		})

		test('should track stats correctly', () => {
			deduplicator = new Deduplicator({
				enabled: true,
				maxSize: 100,
				windowMs: 2000,
			})

			deduplicator.shouldSuppress('message 1', 'info')
			deduplicator.shouldSuppress('message 2', 'info')

			const stats = deduplicator.getStats()
			expect(stats.tracked).toBe(2)
			expect(stats.maxSize).toBe(100)
			expect(stats.windowMs).toBe(2000)
		})
	})

	describe('disabled mode', () => {
		test('should not suppress when disabled', () => {
			deduplicator = new Deduplicator({
				enabled: false,
			})

			deduplicator.shouldSuppress('test message', 'info')
			const result = deduplicator.shouldSuppress('test message', 'info')
			expect(result.suppressed).toBe(false)
		})
	})

	describe('clear', () => {
		test('should clear all tracked entries', () => {
			deduplicator = new Deduplicator({
				enabled: true,
			})

			deduplicator.shouldSuppress('test message', 'info')
			deduplicator.shouldSuppress('test message', 'info')

			deduplicator.clear()

			// Should not be tracked anymore
			const result = deduplicator.shouldSuppress('test message', 'info')
			expect(result.suppressed).toBe(false)
		})
	})

	describe('getPendingSummaries', () => {
		test('should return all pending summaries', () => {
			deduplicator = new Deduplicator({
				enabled: true,
			})

			// Multiple duplicates of different messages
			deduplicator.shouldSuppress('message 1', 'info')
			deduplicator.shouldSuppress('message 1', 'info')
			deduplicator.shouldSuppress('message 1', 'info')

			deduplicator.shouldSuppress('message 2', 'warn')
			deduplicator.shouldSuppress('message 2', 'warn')

			deduplicator.shouldSuppress('message 3', 'error') // Only one, no duplicate

			const summaries = deduplicator.getPendingSummaries()
			expect(summaries).toHaveLength(2) // Only 2 have duplicates

			const summary1 = summaries.find((s) => s.key.includes('message 1'))
			const summary2 = summaries.find((s) => s.key.includes('message 2'))

			expect(summary1?.count).toBe(2) // 2 suppressed
			expect(summary1?.level).toBe('info')

			expect(summary2?.count).toBe(1) // 1 suppressed
			expect(summary2?.level).toBe('warn')
		})
	})

	describe('configuration options', () => {
		test('should exclude level from key when includeLevel is false', () => {
			deduplicator = new Deduplicator({
				enabled: true,
				includeLevel: false,
			})

			deduplicator.shouldSuppress('test message', 'info')
			const result = deduplicator.shouldSuppress('test message', 'error')
			expect(result.suppressed).toBe(true) // Same message, level ignored
		})

		test('should exclude namespace from key when includeNamespace is false', () => {
			deduplicator = new Deduplicator({
				enabled: true,
				includeNamespace: false,
			})

			deduplicator.shouldSuppress('test message', 'info', 'auth')
			const result = deduplicator.shouldSuppress('test message', 'info', 'db')
			expect(result.suppressed).toBe(true) // Same message, namespace ignored
		})

		test('should use default config values', () => {
			deduplicator = new Deduplicator()

			const stats = deduplicator.getStats()
			expect(stats.windowMs).toBe(1000)
			expect(stats.maxSize).toBe(1000)
		})
	})
})
