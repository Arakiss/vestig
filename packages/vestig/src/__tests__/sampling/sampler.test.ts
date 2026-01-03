import { beforeEach, describe, expect, it } from 'bun:test'
import {
	createCompositeSampler,
	createNamespaceSampler,
	createProbabilitySampler,
	createRateLimitSampler,
	createSampler,
	createSamplerFromConfig,
} from '../../sampling'
import type { LogEntry } from '../../types'

function createEntry(overrides: Partial<LogEntry> = {}): LogEntry {
	return {
		timestamp: new Date().toISOString(),
		level: 'info',
		message: 'test message',
		runtime: 'node',
		...overrides,
	}
}

describe('createProbabilitySampler', () => {
	it('should always sample with probability 1', () => {
		const sampler = createProbabilitySampler(1)
		const entry = createEntry()

		// All 100 samples should pass
		for (let i = 0; i < 100; i++) {
			expect(sampler.shouldSample(entry)).toBe(true)
		}
	})

	it('should never sample with probability 0', () => {
		const sampler = createProbabilitySampler(0)
		const entry = createEntry()

		// All 100 samples should fail
		for (let i = 0; i < 100; i++) {
			expect(sampler.shouldSample(entry)).toBe(false)
		}
	})

	it('should clamp probability to valid range', () => {
		const highSampler = createProbabilitySampler(1.5)
		const lowSampler = createProbabilitySampler(-0.5)
		const entry = createEntry()

		// High clamped to 1
		expect(highSampler.shouldSample(entry)).toBe(true)

		// Low clamped to 0
		expect(lowSampler.shouldSample(entry)).toBe(false)
	})

	it('should accept config object format', () => {
		const sampler = createProbabilitySampler({ probability: 1 })
		const entry = createEntry()

		expect(sampler.shouldSample(entry)).toBe(true)
	})

	it('should sample approximately at configured rate', () => {
		const sampler = createProbabilitySampler(0.5)
		const entry = createEntry()

		let passed = 0
		const iterations = 1000

		for (let i = 0; i < iterations; i++) {
			if (sampler.shouldSample(entry)) passed++
		}

		// Should be roughly 50%, allow 15% margin for randomness
		const rate = passed / iterations
		expect(rate).toBeGreaterThan(0.35)
		expect(rate).toBeLessThan(0.65)
	})
})

describe('createRateLimitSampler', () => {
	it('should sample up to max rate', () => {
		const sampler = createRateLimitSampler({ maxPerSecond: 5, windowMs: 1000 })
		const entry = createEntry()

		// First 5 should pass
		for (let i = 0; i < 5; i++) {
			expect(sampler.shouldSample(entry)).toBe(true)
		}

		// 6th should fail
		expect(sampler.shouldSample(entry)).toBe(false)
	})

	it('should reset after window expires', async () => {
		const sampler = createRateLimitSampler({ maxPerSecond: 100, windowMs: 50 })
		const entry = createEntry()

		// Use up the limit
		for (let i = 0; i < 5; i++) {
			sampler.shouldSample(entry)
		}

		// Wait for window to reset
		await new Promise((resolve) => setTimeout(resolve, 60))

		// Should sample again
		expect(sampler.shouldSample(entry)).toBe(true)
	})

	it('should handle fractional rates', () => {
		// 0.5 per second = 1 per 2 seconds, but windowMs is 1000
		// So maxPerWindow = 0.5, which means at most 0 per window (floored)
		const sampler = createRateLimitSampler({ maxPerSecond: 0.5, windowMs: 1000 })
		const entry = createEntry()

		// This tests edge case - maxPerWindow = 0.5, so first call increments to 1
		// and 1 > 0.5, so it should still work for the first half
		// Actually with count < maxPerWindow, count starts at 0, 0 < 0.5, so first passes
		expect(sampler.shouldSample(entry)).toBe(true)
		// Now count is 1, 1 < 0.5 is false
		expect(sampler.shouldSample(entry)).toBe(false)
	})
})

describe('createNamespaceSampler', () => {
	it('should use default sampler when no match', () => {
		const sampler = createNamespaceSampler({
			default: { probability: 1 },
		})
		const entry = createEntry({ namespace: 'unknown' })

		expect(sampler.shouldSample(entry)).toBe(true)
	})

	it('should match exact namespace', () => {
		const sampler = createNamespaceSampler({
			default: { probability: 0 },
			namespaces: {
				auth: { probability: 1 },
			},
		})

		expect(sampler.shouldSample(createEntry({ namespace: 'auth' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(false)
	})

	it('should match wildcard patterns', () => {
		const sampler = createNamespaceSampler({
			default: { probability: 0 },
			namespaces: {
				'api.*': { probability: 1 },
			},
		})

		expect(sampler.shouldSample(createEntry({ namespace: 'api.users' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ namespace: 'api.orders' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ namespace: 'db.users' }))).toBe(false)
	})

	it('should prefer exact match over wildcard', () => {
		const sampler = createNamespaceSampler({
			namespaces: {
				'api.*': { probability: 0 },
				'api.critical': { probability: 1 },
			},
		})

		expect(sampler.shouldSample(createEntry({ namespace: 'api.critical' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ namespace: 'api.normal' }))).toBe(false)
	})

	it('should sample when no default and no match', () => {
		const sampler = createNamespaceSampler({
			namespaces: {
				specific: { probability: 0 },
			},
		})

		// No default, no match = should sample (pass through)
		expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(true)
	})

	it('should handle empty namespace', () => {
		const sampler = createNamespaceSampler({
			default: { probability: 1 },
		})

		expect(sampler.shouldSample(createEntry({ namespace: '' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ namespace: undefined }))).toBe(true)
	})
})

describe('createCompositeSampler', () => {
	it('should bypass sampling for errors when configured', () => {
		const inner = createProbabilitySampler(0)
		const sampler = createCompositeSampler(inner, { alwaysSampleErrors: true })

		const entryWithError = createEntry({
			error: { name: 'Error', message: 'test' },
		})

		expect(sampler.shouldSample(entryWithError)).toBe(true)
	})

	it('should bypass sampling for high-level logs', () => {
		const inner = createProbabilitySampler(0)
		const sampler = createCompositeSampler(inner, { bypassLevel: 'warn' })

		expect(sampler.shouldSample(createEntry({ level: 'error' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ level: 'warn' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ level: 'info' }))).toBe(false)
	})

	it('should delegate to inner sampler for normal logs', () => {
		const inner = createProbabilitySampler(0)
		const sampler = createCompositeSampler(inner, {
			alwaysSampleErrors: false,
			bypassLevel: 'error',
		})

		expect(sampler.shouldSample(createEntry({ level: 'info' }))).toBe(false)
		expect(sampler.shouldSample(createEntry({ level: 'warn' }))).toBe(false)
	})
})

describe('createSamplerFromConfig', () => {
	it('should create probability sampler from number', () => {
		const sampler = createSamplerFromConfig(1)
		expect(sampler.shouldSample(createEntry())).toBe(true)
	})

	it('should create probability sampler from config', () => {
		const sampler = createSamplerFromConfig({ probability: 0 })
		expect(sampler.shouldSample(createEntry())).toBe(false)
	})

	it('should create rate limit sampler from config', () => {
		const sampler = createSamplerFromConfig({ maxPerSecond: 1 })
		expect(sampler.shouldSample(createEntry())).toBe(true)
		expect(sampler.shouldSample(createEntry())).toBe(false)
	})

	it('should create namespace sampler from config', () => {
		const sampler = createSamplerFromConfig({
			default: { probability: 0 },
			namespaces: { test: 1 },
		})

		expect(sampler.shouldSample(createEntry({ namespace: 'test' }))).toBe(true)
		expect(sampler.shouldSample(createEntry({ namespace: 'other' }))).toBe(false)
	})
})

describe('createSampler', () => {
	it('should return null when disabled', () => {
		const sampler = createSampler({ enabled: false, sampler: 0.5 })
		expect(sampler).toBeNull()
	})

	it('should return null when no sampler config', () => {
		const sampler = createSampler({ enabled: true })
		expect(sampler).toBeNull()
	})

	it('should create composite sampler when enabled', () => {
		const sampler = createSampler({
			enabled: true,
			sampler: 1,
			alwaysSampleErrors: true,
		})

		expect(sampler).not.toBeNull()
		expect(sampler?.shouldSample(createEntry())).toBe(true)
	})

	it('should respect alwaysSampleErrors option', () => {
		const sampler = createSampler({
			enabled: true,
			sampler: 0,
			alwaysSampleErrors: true,
		})

		const errorEntry = createEntry({
			error: { name: 'Error', message: 'test' },
		})

		expect(sampler?.shouldSample(errorEntry)).toBe(true)
		expect(sampler?.shouldSample(createEntry())).toBe(false)
	})

	it('should respect bypassLevel option', () => {
		const sampler = createSampler({
			enabled: true,
			sampler: 0,
			bypassLevel: 'warn',
		})

		expect(sampler?.shouldSample(createEntry({ level: 'warn' }))).toBe(true)
		expect(sampler?.shouldSample(createEntry({ level: 'info' }))).toBe(false)
	})
})
