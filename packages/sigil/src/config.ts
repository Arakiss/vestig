import { parseLogLevel } from './levels'
import type { LogContext, LogLevel, LoggerConfig } from './types'

/**
 * Environment variable names
 */
export const ENV_VARS = {
	LEVEL: 'SIGIL_LEVEL',
	ENABLED: 'SIGIL_ENABLED',
	STRUCTURED: 'SIGIL_STRUCTURED',
	SANITIZE: 'SIGIL_SANITIZE',
} as const

/**
 * Get environment variable safely (works in all runtimes)
 */
function getEnv(key: string): string | undefined {
	if (typeof process !== 'undefined' && process.env) {
		return process.env[key]
	}
	return undefined
}

/**
 * Check if we're in production
 */
function isProduction(): boolean {
	const nodeEnv = getEnv('NODE_ENV')
	return nodeEnv === 'production'
}

/**
 * Parse boolean from environment variable
 */
function parseBool(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined) return fallback
	return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Get context from SIGIL_CONTEXT_* environment variables
 */
function getEnvContext(): LogContext {
	const context: LogContext = {}
	if (typeof process === 'undefined' || !process.env) return context

	for (const [key, value] of Object.entries(process.env)) {
		if (key.startsWith('SIGIL_CONTEXT_') && value) {
			const contextKey = key.replace('SIGIL_CONTEXT_', '').toLowerCase()
			context[contextKey] = value
		}
	}
	return context
}

/**
 * Default configuration values
 */
export function getDefaultConfig(): Required<LoggerConfig> {
	const isProd = isProduction()

	return {
		level: parseLogLevel(getEnv(ENV_VARS.LEVEL), isProd ? 'warn' : 'info'),
		enabled: parseBool(getEnv(ENV_VARS.ENABLED), true),
		structured: parseBool(getEnv(ENV_VARS.STRUCTURED), isProd),
		sanitize: parseBool(getEnv(ENV_VARS.SANITIZE), true),
		sanitizeFields: [],
		context: getEnvContext(),
		namespace: '',
	}
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig?: LoggerConfig): Required<LoggerConfig> {
	const defaults = getDefaultConfig()

	return {
		level: userConfig?.level ?? defaults.level,
		enabled: userConfig?.enabled ?? defaults.enabled,
		structured: userConfig?.structured ?? defaults.structured,
		sanitize: userConfig?.sanitize ?? defaults.sanitize,
		sanitizeFields: [...defaults.sanitizeFields, ...(userConfig?.sanitizeFields ?? [])],
		context: { ...defaults.context, ...userConfig?.context },
		namespace: userConfig?.namespace ?? defaults.namespace,
	}
}
