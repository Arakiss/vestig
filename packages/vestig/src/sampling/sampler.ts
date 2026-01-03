import { shouldLog } from '../levels'
import type { LogEntry, LogLevel } from '../types'
import type {
	NamespaceSamplerConfig,
	ProbabilitySamplerConfig,
	RateLimitSamplerConfig,
	Sampler,
	SamplerConfig,
	SamplingConfig,
} from './types'

/**
 * Create a probability-based sampler
 * Randomly samples logs based on configured probability
 */
export function createProbabilitySampler(config: ProbabilitySamplerConfig | number): Sampler {
	const probability = Math.max(
		0,
		Math.min(1, typeof config === 'number' ? config : config.probability),
	)

	function shouldSample(_entry: LogEntry): boolean {
		if (probability >= 1) return true
		if (probability <= 0) return false
		return Math.random() < probability
	}

	return { shouldSample }
}

/**
 * Create a rate-limiting sampler
 * Limits logs to a maximum rate per time window
 */
export function createRateLimitSampler(config: RateLimitSamplerConfig): Sampler {
	const windowMs = config.windowMs ?? 1000
	const maxPerWindow = config.maxPerSecond * (windowMs / 1000)

	let currentWindow = 0
	let count = 0

	function shouldSample(_entry: LogEntry): boolean {
		const now = Date.now()
		const window = Math.floor(now / windowMs)

		// Reset counter on new window
		if (window !== currentWindow) {
			currentWindow = window
			count = 0
		}

		// Check if we're under the limit
		if (count < maxPerWindow) {
			count++
			return true
		}

		return false
	}

	return { shouldSample }
}

/**
 * Create a namespace-based sampler
 * Applies different sampling rules based on log namespace
 */
export function createNamespaceSampler(config: NamespaceSamplerConfig): Sampler {
	const defaultSampler = config.default ? createSamplerFromConfig(config.default) : null
	const exactSamplers = new Map<string, Sampler>()
	const patterns: Array<{ pattern: RegExp; sampler: Sampler }> = []

	if (config.namespaces) {
		for (const [namespace, samplerConfig] of Object.entries(config.namespaces)) {
			const sampler = createSamplerFromConfig(samplerConfig)

			if (namespace.includes('*')) {
				// Convert wildcard pattern to regex
				const pattern = new RegExp(`^${namespace.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`)
				patterns.push({ pattern, sampler })
			} else {
				exactSamplers.set(namespace, sampler)
			}
		}
	}

	function shouldSample(entry: LogEntry): boolean {
		const namespace = entry.namespace || ''

		// Check exact match first
		const exactSampler = exactSamplers.get(namespace)
		if (exactSampler) {
			return exactSampler.shouldSample(entry)
		}

		// Check wildcard patterns
		for (const { pattern, sampler } of patterns) {
			if (pattern.test(namespace)) {
				return sampler.shouldSample(entry)
			}
		}

		// Fall back to default
		return defaultSampler ? defaultSampler.shouldSample(entry) : true
	}

	function destroy(): void {
		for (const sampler of exactSamplers.values()) {
			sampler.destroy?.()
		}
		for (const { sampler } of patterns) {
			sampler.destroy?.()
		}
		defaultSampler?.destroy?.()
	}

	return { shouldSample, destroy }
}

/**
 * Create a composite sampler that wraps another with bypass rules
 */
export function createCompositeSampler(
	innerSampler: Sampler,
	options: { alwaysSampleErrors?: boolean; bypassLevel?: LogLevel } = {},
): Sampler {
	const alwaysSampleErrors = options.alwaysSampleErrors ?? true
	const bypassLevel = options.bypassLevel ?? 'error'

	function shouldSample(entry: LogEntry): boolean {
		// Bypass sampling for entries with errors
		if (alwaysSampleErrors && entry.error) {
			return true
		}

		// Bypass sampling for entries at or above bypass level
		if (shouldLog(entry.level, bypassLevel)) {
			return true
		}

		// Delegate to inner sampler
		return innerSampler.shouldSample(entry)
	}

	function destroy(): void {
		innerSampler.destroy?.()
	}

	return { shouldSample, destroy }
}

/**
 * Create a sampler from a configuration object
 */
export function createSamplerFromConfig(config: SamplerConfig): Sampler {
	// Number shorthand for probability
	if (typeof config === 'number') {
		return createProbabilitySampler(config)
	}

	// Check for specific config types
	if ('probability' in config) {
		return createProbabilitySampler(config as ProbabilitySamplerConfig)
	}

	if ('maxPerSecond' in config) {
		return createRateLimitSampler(config as RateLimitSamplerConfig)
	}

	if ('default' in config || 'namespaces' in config) {
		return createNamespaceSampler(config as NamespaceSamplerConfig)
	}

	// Default to always sample
	return createProbabilitySampler(1)
}

/**
 * Create a full sampler from SamplingConfig
 */
export function createSampler(config: SamplingConfig): Sampler | null {
	if (!config.enabled) {
		return null
	}

	// Check for undefined/null, not falsy (0 is a valid probability)
	if (config.sampler === undefined || config.sampler === null) {
		return null
	}

	const innerSampler = createSamplerFromConfig(config.sampler)

	return createCompositeSampler(innerSampler, {
		alwaysSampleErrors: config.alwaysSampleErrors ?? true,
		bypassLevel: config.bypassLevel ?? 'error',
	})
}
