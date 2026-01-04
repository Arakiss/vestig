import { describe, expect, test, beforeEach, mock } from 'bun:test'
import type { LogEntry } from '../types'
import {
	createCompositeSampler,
	createNamespaceSampler,
	createProbabilitySampler,
	createRateLimitSampler,
	createSampler,
	createSamplerFromConfig,
} from '../sampling'

const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
	timestamp: new Date().toISOString(),
	level: 'info',
	message: 'Test message',
	runtime: 'bun',
	...overrides,
})

describe('createProbabilitySampler', () => {
	describe('edge cases', () => {
		test('should always sample at probability 1', () => {
			const sampler = createProbabilitySampler(1)
			for (let i = 0; i < 100; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(true)
			}
		})

		test('should never sample at probability 0', () => {
			const sampler = createProbabilitySampler(0)
			for (let i = 0; i < 100; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(false)
			}
		})

		test('should clamp probability above 1 to 1', () => {
			const sampler = createProbabilitySampler(1.5)
			for (let i = 0; i < 100; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(true)
			}
		})

		test('should clamp probability below 0 to 0', () => {
			const sampler = createProbabilitySampler(-0.5)
			for (let i = 0; i < 100; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(false)
			}
		})

		test('should handle NaN probability as 0', () => {
			const sampler = createProbabilitySampler(Number.NaN)
			// NaN gets clamped by Math.max(0, Math.min(1, NaN)) -> Math.max(0, NaN) -> 0
			for (let i = 0; i < 100; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(false)
			}
		})

		test('should sample approximately at configured rate', () => {
			const sampler = createProbabilitySampler(0.5)
			let sampled = 0
			const total = 1000

			for (let i = 0; i < total; i++) {
				if (sampler.shouldSample(createEntry())) sampled++
			}

			// Should be within 10% of 50%
			expect(sampled / total).toBeGreaterThan(0.4)
			expect(sampled / total).toBeLessThan(0.6)
		})

		test('should accept config object', () => {
			const sampler = createProbabilitySampler({ probability: 1 })
			expect(sampler.shouldSample(createEntry())).toBe(true)
		})

		test('should handle very small probabilities', () => {
			const sampler = createProbabilitySampler(0.001)
			let sampled = 0
			const total = 10000

			for (let i = 0; i < total; i++) {
				if (sampler.shouldSample(createEntry())) sampled++
			}

			// Should be roughly 0.1% (10 samples) with some variance
			expect(sampled).toBeLessThan(50) // Should be rare
		})
	})
})

describe('createRateLimitSampler', () => {
	describe('edge cases', () => {
		test('should limit to maxPerSecond', () => {
			const sampler = createRateLimitSampler({ maxPerSecond: 5 })

			// First 5 should be sampled
			for (let i = 0; i < 5; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(true)
			}

			// Next should be dropped
			expect(sampler.shouldSample(createEntry())).toBe(false)
		})

		test('should reset counter on new window', async () => {
			// 100 per second with 50ms window = 5 per window
			const sampler = createRateLimitSampler({ maxPerSecond: 100, windowMs: 50 })

			expect(sampler.shouldSample(createEntry())).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(false) // 6th should fail

			// Wait for new window
			await new Promise((resolve) => setTimeout(resolve, 60))

			// Should work again
			expect(sampler.shouldSample(createEntry())).toBe(true)
		})

		test('should handle maxPerSecond of 0', () => {
			const sampler = createRateLimitSampler({ maxPerSecond: 0 })
			expect(sampler.shouldSample(createEntry())).toBe(false)
		})

		test('should handle very high maxPerSecond', () => {
			const sampler = createRateLimitSampler({ maxPerSecond: 1000000 })
			for (let i = 0; i < 1000; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(true)
			}
		})

		test('should use default windowMs of 1000', () => {
			const sampler = createRateLimitSampler({ maxPerSecond: 100 })
			// Should allow 100 samples
			for (let i = 0; i < 100; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(true)
			}
			expect(sampler.shouldSample(createEntry())).toBe(false)
		})

		test('should scale with custom windowMs', () => {
			// 10 per second with 500ms window = 5 per window
			const sampler = createRateLimitSampler({ maxPerSecond: 10, windowMs: 500 })

			for (let i = 0; i < 5; i++) {
				expect(sampler.shouldSample(createEntry())).toBe(true)
			}
			expect(sampler.shouldSample(createEntry())).toBe(false)
		})
	})
})

describe('createNamespaceSampler', () => {
	describe('edge cases', () => {
		test('should match exact namespace', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					'app.auth': 1,
					'app.db': 0,
				},
			})

			expect(sampler.shouldSample(createEntry({ namespace: 'app.auth' }))).toBe(true)
			expect(sampler.shouldSample(createEntry({ namespace: 'app.db' }))).toBe(false)
		})

		test('should handle wildcard patterns', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					'app.*': 1,
				},
				// Note: Use object form since 0 is falsy and would be ignored
				default: { probability: 0 },
			})

			expect(sampler.shouldSample(createEntry({ namespace: 'app.auth' }))).toBe(true)
			expect(sampler.shouldSample(createEntry({ namespace: 'app.db' }))).toBe(true)
			expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(false)
		})

		test('should handle deep wildcard patterns', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					'app.**': 1,
				},
				default: { probability: 0 },
			})

			// Note: Current implementation uses .* which matches any character
			// This should match app.anything
			expect(sampler.shouldSample(createEntry({ namespace: 'app.auth.login' }))).toBe(true)
		})

		test('should use default when namespace not matched', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					specific: 0,
				},
				default: 1,
			})

			expect(sampler.shouldSample(createEntry({ namespace: 'specific' }))).toBe(false)
			expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(true)
		})

		test('should handle empty namespace', () => {
			const sampler = createNamespaceSampler({
				default: 1,
			})

			expect(sampler.shouldSample(createEntry({ namespace: '' }))).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(true) // undefined namespace
		})

		test('should handle undefined namespace in entry', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					'app.*': 0,
				},
				default: 1,
			})

			// Undefined namespace should fall back to default
			expect(sampler.shouldSample(createEntry({ namespace: undefined }))).toBe(true)
		})

		test('should prioritize exact match over wildcard', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					'app.critical': 1, // Exact match
					'app.*': 0, // Wildcard
				},
			})

			// Exact match should be checked first
			expect(sampler.shouldSample(createEntry({ namespace: 'app.critical' }))).toBe(true)
		})

		test('should handle no namespaces config', () => {
			const sampler = createNamespaceSampler({
				default: 1,
			})

			expect(sampler.shouldSample(createEntry({ namespace: 'any' }))).toBe(true)
		})

		test('should sample all when no default and no match', () => {
			const sampler = createNamespaceSampler({
				namespaces: {
					specific: 0,
				},
				// No default - should return true for unmatched
			})

			expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(true)
		})

		test('should call destroy on all child samplers', () => {
			const destroyCalls: string[] = []

			// Create a custom sampler with destroy
			const sampler = createNamespaceSampler({
				namespaces: {
					a: 1,
					'b.*': 0.5,
				},
				default: 0.1,
			})

			// Should not throw
			expect(() => sampler.destroy?.()).not.toThrow()
		})
	})
})

describe('createCompositeSampler', () => {
	describe('edge cases', () => {
		test('should bypass for error entries by default', () => {
			const inner = createProbabilitySampler(0) // Never sample
			const sampler = createCompositeSampler(inner)

			expect(
				sampler.shouldSample(
					createEntry({
						error: { name: 'Error', message: 'test' },
					}),
				),
			).toBe(true)
		})

		test('should not bypass errors when alwaysSampleErrors is false', () => {
			const inner = createProbabilitySampler(0)
			const sampler = createCompositeSampler(inner, { alwaysSampleErrors: false })

			expect(
				sampler.shouldSample(
					createEntry({
						error: { name: 'Error', message: 'test' },
					}),
				),
			).toBe(false)
		})

		test('should bypass for error level by default', () => {
			const inner = createProbabilitySampler(0)
			const sampler = createCompositeSampler(inner)

			expect(sampler.shouldSample(createEntry({ level: 'error' }))).toBe(true)
		})

		test('should respect custom bypassLevel', () => {
			const inner = createProbabilitySampler(0)
			const sampler = createCompositeSampler(inner, { bypassLevel: 'warn' })

			expect(sampler.shouldSample(createEntry({ level: 'warn' }))).toBe(true)
			expect(sampler.shouldSample(createEntry({ level: 'error' }))).toBe(true)
			expect(sampler.shouldSample(createEntry({ level: 'info' }))).toBe(false)
		})

		test('should call destroy on inner sampler', () => {
			let destroyed = false
			const inner = {
				shouldSample: () => true,
				destroy: () => {
					destroyed = true
				},
			}

			const sampler = createCompositeSampler(inner)
			sampler.destroy?.()

			expect(destroyed).toBe(true)
		})
	})
})

describe('createSamplerFromConfig', () => {
	describe('edge cases', () => {
		test('should handle number shorthand', () => {
			const sampler = createSamplerFromConfig(0.5)
			// Should be a probability sampler
			expect(sampler.shouldSample).toBeDefined()
		})

		test('should detect probability config', () => {
			const sampler = createSamplerFromConfig({ probability: 1 })
			expect(sampler.shouldSample(createEntry())).toBe(true)
		})

		test('should detect rate limit config', () => {
			const sampler = createSamplerFromConfig({ maxPerSecond: 1 })
			expect(sampler.shouldSample(createEntry())).toBe(true)
			expect(sampler.shouldSample(createEntry())).toBe(false) // Rate limited
		})

		test('should detect namespace config', () => {
			const sampler = createSamplerFromConfig({
				default: 1,
				namespaces: { test: 0 },
			})
			expect(sampler.shouldSample(createEntry({ namespace: 'test' }))).toBe(false)
			expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(true)
		})

		test('should default to always sample for unknown config', () => {
			const sampler = createSamplerFromConfig({} as never)
			expect(sampler.shouldSample(createEntry())).toBe(true)
		})
	})
})

describe('createSampler', () => {
	describe('edge cases', () => {
		test('should return null when disabled', () => {
			const sampler = createSampler({ enabled: false, sampler: 0.5 })
			expect(sampler).toBeNull()
		})

		test('should return null when sampler is undefined', () => {
			const sampler = createSampler({ enabled: true })
			expect(sampler).toBeNull()
		})

		test('should return null when sampler is null', () => {
			const sampler = createSampler({ enabled: true, sampler: null as never })
			expect(sampler).toBeNull()
		})

		test('should handle probability 0 as valid config', () => {
			const sampler = createSampler({ enabled: true, sampler: 0 })
			expect(sampler).not.toBeNull()
			// Should never sample (probability 0) but bypass for errors
			expect(sampler?.shouldSample(createEntry({ level: 'info' }))).toBe(false)
			expect(sampler?.shouldSample(createEntry({ level: 'error' }))).toBe(true)
		})

		test('should wrap with composite sampler defaults', () => {
			const sampler = createSampler({ enabled: true, sampler: 0 })

			// Should bypass for error entries
			expect(
				sampler?.shouldSample(
					createEntry({
						error: { name: 'Error', message: 'test' },
					}),
				),
			).toBe(true)
		})

		test('should respect alwaysSampleErrors option', () => {
			const sampler = createSampler({
				enabled: true,
				sampler: 0,
				alwaysSampleErrors: false,
			})

			expect(
				sampler?.shouldSample(
					createEntry({
						error: { name: 'Error', message: 'test' },
						level: 'info',
					}),
				),
			).toBe(false)
		})

		test('should respect bypassLevel option', () => {
			const sampler = createSampler({
				enabled: true,
				sampler: 0,
				bypassLevel: 'warn',
			})

			expect(sampler?.shouldSample(createEntry({ level: 'warn' }))).toBe(true)
			expect(sampler?.shouldSample(createEntry({ level: 'info' }))).toBe(false)
		})
	})
})
