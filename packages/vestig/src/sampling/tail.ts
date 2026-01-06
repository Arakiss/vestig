import type { TailSamplingConfig, WideEvent, WideEventStatus } from '../wide-events/types'

/**
 * Default tail sampling configuration
 */
const DEFAULT_CONFIG: Required<
	Omit<TailSamplingConfig, 'vipUserIds' | 'vipTiers' | 'slowThresholdMs'>
> = {
	enabled: true,
	alwaysKeepStatuses: ['error'],
	successSampleRate: 1.0,
	tierFieldPath: 'user.subscription',
}

/**
 * Result of a tail sampling decision
 */
export interface TailSamplingResult {
	/** Whether the event should be kept */
	sampled: boolean
	/** Reason for the decision */
	reason:
		| 'always_keep_status'
		| 'slow_request'
		| 'vip_user'
		| 'vip_tier'
		| 'random_sample'
		| 'random_drop'
}

/**
 * Tail-based sampler for wide events.
 *
 * Unlike traditional samplers that decide upfront, tail sampling
 * makes the decision AFTER the event completes, based on outcome.
 *
 * This allows:
 * - 100% retention of errors
 * - 100% retention of slow requests
 * - 100% retention for VIP users
 * - Random sampling only for successful requests
 */
export class TailSampler {
	private readonly _config: TailSamplingConfig
	private readonly _alwaysKeepStatuses: Set<WideEventStatus>
	private readonly _vipUserIds: Set<string>
	private readonly _vipTiers: Set<string>

	constructor(config: TailSamplingConfig = {}) {
		this._config = { ...DEFAULT_CONFIG, ...config }
		this._alwaysKeepStatuses = new Set(
			this._config.alwaysKeepStatuses ?? DEFAULT_CONFIG.alwaysKeepStatuses,
		)
		this._vipUserIds = new Set(this._config.vipUserIds ?? [])
		this._vipTiers = new Set(this._config.vipTiers ?? [])
	}

	/**
	 * Get the current configuration.
	 */
	get config(): Readonly<TailSamplingConfig> {
		return this._config
	}

	/**
	 * Determine if a completed wide event should be sampled (kept).
	 *
	 * This method should be called AFTER the event has completed,
	 * when all context (status, duration, user info) is available.
	 *
	 * @param event - The completed wide event
	 * @returns Whether to keep the event and why
	 */
	shouldSample(event: WideEvent): TailSamplingResult {
		if (!this._config.enabled) {
			return { sampled: true, reason: 'random_sample' }
		}

		// 1. Always keep events with specified statuses (e.g., errors)
		if (this._alwaysKeepStatuses.has(event.status)) {
			return { sampled: true, reason: 'always_keep_status' }
		}

		// 2. Always keep slow requests
		if (
			this._config.slowThresholdMs !== undefined &&
			event.duration_ms >= this._config.slowThresholdMs
		) {
			return { sampled: true, reason: 'slow_request' }
		}

		// 3. Always keep VIP users
		const userId = event.context?.userId
		if (userId && this._vipUserIds.has(userId)) {
			return { sampled: true, reason: 'vip_user' }
		}

		// 4. Always keep VIP tiers
		if (this._vipTiers.size > 0) {
			const tier = this._getFieldByPath(
				event,
				this._config.tierFieldPath ?? DEFAULT_CONFIG.tierFieldPath,
			)
			if (typeof tier === 'string' && this._vipTiers.has(tier)) {
				return { sampled: true, reason: 'vip_tier' }
			}
		}

		// 5. Random sample for successful events
		const successSampleRate = this._config.successSampleRate ?? DEFAULT_CONFIG.successSampleRate
		if (successSampleRate >= 1) {
			return { sampled: true, reason: 'random_sample' }
		}

		if (successSampleRate <= 0) {
			return { sampled: false, reason: 'random_drop' }
		}

		if (Math.random() < successSampleRate) {
			return { sampled: true, reason: 'random_sample' }
		}

		return { sampled: false, reason: 'random_drop' }
	}

	/**
	 * Get a field value by dot-notation path.
	 *
	 * @param event - The wide event
	 * @param path - Dot-notation path (e.g., 'user.subscription')
	 */
	private _getFieldByPath(event: WideEvent, path: string): unknown {
		const parts = path.split('.')
		const category = parts[0]
		const key = parts.slice(1).join('.')

		if (!category) {
			return undefined
		}

		if (!key) {
			// Single level - check context or root
			return (event.context as Record<string, unknown>)?.[category]
		}

		// Check in fields
		const categoryFields = event.fields[category]
		if (categoryFields) {
			return categoryFields[key]
		}

		return undefined
	}
}

/**
 * Create a tail sampler with the given configuration.
 *
 * @param config - Tail sampling configuration
 * @returns A new TailSampler instance
 *
 * @example
 * ```typescript
 * const sampler = createTailSampler({
 *   alwaysKeepStatuses: ['error', 'timeout'],
 *   slowThresholdMs: 2000,
 *   successSampleRate: 0.1, // Keep 10% of successful requests
 *   vipUserIds: ['user-123', 'user-456'],
 *   vipTiers: ['enterprise', 'premium']
 * });
 *
 * const event = wideEvent.end();
 * const result = sampler.shouldSample(event);
 *
 * if (result.sampled) {
 *   logger.info('Wide event', event);
 * }
 * ```
 */
export function createTailSampler(config: TailSamplingConfig = {}): TailSampler {
	return new TailSampler(config)
}
