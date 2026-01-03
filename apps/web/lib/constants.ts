/**
 * Site Constants
 *
 * Centralized configuration for URLs, limits, and other constants
 * to avoid hardcoding values throughout the codebase.
 */

/**
 * Site URLs
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vestig.dev'
export const GITHUB_URL = 'https://github.com/Arakiss/vestig'
export const GITHUB_AUTHOR_URL = 'https://github.com/Arakiss'
export const GITHUB_REPO = 'Arakiss/vestig'
export const NPM_URL = 'https://www.npmjs.com/package/vestig'

/**
 * Social Links
 */
export const SOCIAL_LINKS = {
	github: GITHUB_URL,
	npm: NPM_URL,
} as const

/**
 * API Limits
 */
export const API_LIMITS = {
	/** Maximum concurrent SSE connections */
	MAX_SSE_SUBSCRIBERS: 50,
	/** Maximum logs stored in memory */
	MAX_LOGS: 500,
	/** Maximum reconnection attempts for SSE */
	MAX_RECONNECT_ATTEMPTS: 10,
	/** Base delay for reconnection (ms) */
	BASE_RECONNECT_DELAY: 1000,
	/** Maximum delay for exponential backoff (ms) */
	MAX_RECONNECT_DELAY: 30000,
} as const

/**
 * Performance Thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
	/** Slow query threshold (ms) */
	SLOW_QUERY_MS: 100,
} as const

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
	/** Duration to show "Copied!" feedback (ms) */
	COPY_FEEDBACK_DURATION: 2000,
} as const

/**
 * Default install command
 */
export const INSTALL_COMMAND = 'bun add vestig'
