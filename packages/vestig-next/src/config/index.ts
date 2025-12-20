import type { LogLevel, SanitizeConfig, SanitizePreset, Transport } from 'vestig'

/**
 * Middleware configuration options
 */
export interface VestigNextMiddlewareConfig {
	/** Paths to skip logging (default: ['/_next', '/favicon.ico']) */
	skipPaths?: string[]
	/** Header to extract request ID from (default: 'x-request-id') */
	requestIdHeader?: string
	/** Include request timing (default: true) */
	timing?: boolean
	/** Log level for incoming requests (default: 'info') */
	requestLogLevel?: LogLevel
	/** Log level for outgoing responses (default: 'info') */
	responseLogLevel?: LogLevel
	/** Custom metadata extractor */
	extractMetadata?: (request: Request) => Record<string, unknown>
}

/**
 * Server-side configuration
 */
export interface VestigNextServerConfig {
	/** Logger namespace (default: 'server') */
	namespace?: string
	/** Use structured JSON output (default: true in production) */
	structured?: boolean
	/** Static context added to all server logs */
	context?: Record<string, unknown>
}

/**
 * Client-side configuration
 */
export interface VestigNextClientConfig {
	/** Logger namespace (default: 'client') */
	namespace?: string
	/** Batch size before auto-flush (default: 20) */
	batchSize?: number
	/** Flush interval in ms (default: 3000) */
	flushInterval?: number
	/** Include page/component info (default: true) */
	includePageInfo?: boolean
	/** Max retry attempts (default: 3) */
	maxRetries?: number
	/** Retry delay in ms (default: 1000) */
	retryDelay?: number
}

/**
 * Development tools configuration
 */
export interface VestigNextDevToolsConfig {
	/** Enable dev tools (default: development only) */
	enabled?: boolean
	/** Max logs to keep in memory (default: 500) */
	maxLogs?: number
}

/**
 * Transport definition for config
 */
export interface TransportDefinition {
	type: 'http' | 'datadog' | 'file' | 'custom'
	[key: string]: unknown
}

/**
 * Next.js specific configuration
 */
export interface VestigNextOptions {
	/** API endpoint for client logs (default: '/api/vestig') */
	endpoint?: string
	/** Middleware configuration */
	middleware?: VestigNextMiddlewareConfig
	/** Server-side configuration */
	server?: VestigNextServerConfig
	/** Client-side configuration */
	client?: VestigNextClientConfig
	/** Development tools */
	devTools?: VestigNextDevToolsConfig
	/** Additional transports */
	transports?: (TransportDefinition | Transport | false | null | undefined)[]
}

/**
 * Complete Vestig configuration for Next.js
 */
export interface VestigNextConfig {
	/** Minimum log level to output */
	level?: LogLevel
	/** Enable/disable logging */
	enabled?: boolean
	/** Sanitization configuration: boolean, preset name, or full config */
	sanitize?: boolean | SanitizePreset | SanitizeConfig
	/** Next.js specific options */
	next?: VestigNextOptions
}

/**
 * Define vestig configuration with type safety
 *
 * @example
 * ```typescript
 * // vestig.config.ts
 * import { defineConfig } from '@vestig/next/config'
 *
 * export default defineConfig({
 *   level: 'debug',
 *   sanitize: 'gdpr',
 *   next: {
 *     endpoint: '/api/vestig',
 *     middleware: {
 *       timing: true,
 *     },
 *   },
 * })
 * ```
 */
export function defineConfig(config: VestigNextConfig): VestigNextConfig {
	return config
}

// Re-export from loader for convenience
export { loadConfig, getConfig } from './loader'
export { getDefaultConfig } from './defaults'
