import { deepMerge, getDefaultConfig } from './defaults'
import type { VestigNextConfig } from './index'

// Module-level cached config (set once during app initialization)
let cachedConfig: VestigNextConfig | null = null

/**
 * Set global configuration
 * This should be called once at app startup if you want to override defaults
 */
export function setConfig(config: Partial<VestigNextConfig>): void {
	cachedConfig = deepMerge(getDefaultConfig(), config)
}

/**
 * Get current configuration
 * Returns cached config or defaults
 */
export function getConfig(): VestigNextConfig {
	return cachedConfig ?? getDefaultConfig()
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
	cachedConfig = null
}

/**
 * Load configuration - returns cached or default config
 * This is a sync version for compatibility
 */
export async function loadConfig(): Promise<VestigNextConfig> {
	return getConfig()
}
