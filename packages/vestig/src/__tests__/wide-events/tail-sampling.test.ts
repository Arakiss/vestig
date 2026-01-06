import { describe, expect, test } from 'bun:test'
import { createWideEvent } from '../../wide-events/builder'
import { createTailSampler, TailSampler } from '../../sampling/tail'
import type { WideEvent } from '../../wide-events/types'

function createTestEvent(overrides: Partial<WideEvent> = {}): WideEvent {
	const event = createWideEvent({ type: 'http.request' })
	return {
		...event.end(),
		...overrides,
	}
}

describe('TailSampler', () => {
	describe('error retention', () => {
		test('should always keep events with error status', () => {
			const sampler = createTailSampler({
				successSampleRate: 0, // Would drop all success events
			})

			const event = createTestEvent({ status: 'error' })
			const result = sampler.shouldSample(event)

			expect(result.sampled).toBe(true)
			expect(result.reason).toBe('always_keep_status')
		})

		test('should keep events with custom always-keep statuses', () => {
			const sampler = createTailSampler({
				alwaysKeepStatuses: ['error', 'timeout', 'cancelled'],
				successSampleRate: 0,
			})

			expect(sampler.shouldSample(createTestEvent({ status: 'timeout' })).sampled).toBe(true)
			expect(sampler.shouldSample(createTestEvent({ status: 'cancelled' })).sampled).toBe(true)
			expect(sampler.shouldSample(createTestEvent({ status: 'error' })).sampled).toBe(true)
		})
	})

	describe('slow request retention', () => {
		test('should always keep slow requests above threshold', () => {
			const sampler = createTailSampler({
				slowThresholdMs: 2000,
				successSampleRate: 0,
			})

			const slowEvent = createTestEvent({
				status: 'success',
				duration_ms: 2500,
			})
			const result = sampler.shouldSample(slowEvent)

			expect(result.sampled).toBe(true)
			expect(result.reason).toBe('slow_request')
		})

		test('should sample normal speed requests according to successSampleRate', () => {
			const sampler = createTailSampler({
				slowThresholdMs: 2000,
				successSampleRate: 0,
			})

			const fastEvent = createTestEvent({
				status: 'success',
				duration_ms: 500,
			})
			const result = sampler.shouldSample(fastEvent)

			expect(result.sampled).toBe(false)
			expect(result.reason).toBe('random_drop')
		})

		test('should keep requests exactly at threshold', () => {
			const sampler = createTailSampler({
				slowThresholdMs: 2000,
				successSampleRate: 0,
			})

			const exactEvent = createTestEvent({
				status: 'success',
				duration_ms: 2000, // Exactly at threshold
			})
			const result = sampler.shouldSample(exactEvent)

			expect(result.sampled).toBe(true)
		})
	})

	describe('VIP user retention', () => {
		test('should always keep VIP users', () => {
			const sampler = createTailSampler({
				vipUserIds: ['user-123', 'user-456'],
				successSampleRate: 0,
			})

			const vipEvent = createTestEvent({
				status: 'success',
				context: { userId: 'user-123' },
			})
			const result = sampler.shouldSample(vipEvent)

			expect(result.sampled).toBe(true)
			expect(result.reason).toBe('vip_user')
		})

		test('should sample non-VIP users according to successSampleRate', () => {
			const sampler = createTailSampler({
				vipUserIds: ['user-123'],
				successSampleRate: 0,
			})

			const normalEvent = createTestEvent({
				status: 'success',
				context: { userId: 'user-999' },
			})
			const result = sampler.shouldSample(normalEvent)

			expect(result.sampled).toBe(false)
		})
	})

	describe('VIP tier retention', () => {
		test('should always keep VIP tier users', () => {
			const sampler = createTailSampler({
				vipTiers: ['enterprise', 'premium'],
				successSampleRate: 0,
			})

			const vipEvent = createTestEvent({
				status: 'success',
				fields: {
					user: { subscription: 'enterprise' },
				},
			})
			const result = sampler.shouldSample(vipEvent)

			expect(result.sampled).toBe(true)
			expect(result.reason).toBe('vip_tier')
		})

		test('should use custom tier field path', () => {
			const sampler = createTailSampler({
				vipTiers: ['gold'],
				tierFieldPath: 'account.tier',
				successSampleRate: 0,
			})

			const vipEvent = createTestEvent({
				status: 'success',
				fields: {
					account: { tier: 'gold' },
				},
			})
			const result = sampler.shouldSample(vipEvent)

			expect(result.sampled).toBe(true)
			expect(result.reason).toBe('vip_tier')
		})

		test('should sample non-VIP tiers according to successSampleRate', () => {
			const sampler = createTailSampler({
				vipTiers: ['enterprise'],
				successSampleRate: 0,
			})

			const normalEvent = createTestEvent({
				status: 'success',
				fields: {
					user: { subscription: 'free' },
				},
			})
			const result = sampler.shouldSample(normalEvent)

			expect(result.sampled).toBe(false)
		})
	})

	describe('success sampling', () => {
		test('should keep all events when successSampleRate is 1', () => {
			const sampler = createTailSampler({
				successSampleRate: 1,
			})

			const event = createTestEvent({ status: 'success' })
			const result = sampler.shouldSample(event)

			expect(result.sampled).toBe(true)
			expect(result.reason).toBe('random_sample')
		})

		test('should drop all events when successSampleRate is 0', () => {
			const sampler = createTailSampler({
				successSampleRate: 0,
			})

			const event = createTestEvent({ status: 'success' })
			const result = sampler.shouldSample(event)

			expect(result.sampled).toBe(false)
			expect(result.reason).toBe('random_drop')
		})

		test('should sample probabilistically for rates between 0 and 1', () => {
			const sampler = createTailSampler({
				successSampleRate: 0.5,
			})

			let sampled = 0
			const iterations = 1000

			for (let i = 0; i < iterations; i++) {
				const event = createTestEvent({ status: 'success' })
				if (sampler.shouldSample(event).sampled) {
					sampled++
				}
			}

			// With 50% sample rate, expect roughly 500 samples (allow 10% margin)
			expect(sampled).toBeGreaterThan(400)
			expect(sampled).toBeLessThan(600)
		})
	})

	describe('priority order', () => {
		test('should check status before slow threshold', () => {
			const sampler = createTailSampler({
				alwaysKeepStatuses: ['error'],
				slowThresholdMs: 2000,
			})

			const event = createTestEvent({
				status: 'error',
				duration_ms: 100, // Fast but error
			})
			const result = sampler.shouldSample(event)

			expect(result.reason).toBe('always_keep_status')
		})

		test('should check slow threshold before VIP user', () => {
			const sampler = createTailSampler({
				slowThresholdMs: 2000,
				vipUserIds: ['user-123'],
				successSampleRate: 0,
			})

			const event = createTestEvent({
				status: 'success',
				duration_ms: 3000,
				context: { userId: 'user-123' },
			})
			const result = sampler.shouldSample(event)

			expect(result.reason).toBe('slow_request')
		})
	})

	describe('disabled sampler', () => {
		test('should keep all events when disabled', () => {
			const sampler = createTailSampler({
				enabled: false,
				successSampleRate: 0, // Would drop if enabled
			})

			const event = createTestEvent({ status: 'success' })
			const result = sampler.shouldSample(event)

			expect(result.sampled).toBe(true)
		})
	})

	describe('config access', () => {
		test('should expose config via getter', () => {
			const sampler = new TailSampler({
				slowThresholdMs: 1500,
				successSampleRate: 0.5,
			})

			expect(sampler.config.slowThresholdMs).toBe(1500)
			expect(sampler.config.successSampleRate).toBe(0.5)
		})
	})
})
