/**
 * Types for registerVestig
 */

import type { InstrumentFetchOptions, TailSamplingConfig } from 'vestig'
import type { DatabaseInstrumentConfig } from '../db/types'

/**
 * OTLP configuration options
 */
export interface OTLPConfig {
	/**
	 * OTLP endpoint URL for traces
	 * Falls back to OTEL_EXPORTER_OTLP_ENDPOINT env var
	 * @example 'https://otel.vercel.com/v1/traces'
	 */
	endpoint?: string

	/**
	 * Custom headers for authentication
	 * Falls back to OTEL_EXPORTER_OTLP_HEADERS env var (comma-separated key=value pairs)
	 * @example { 'Authorization': 'Bearer token' }
	 */
	headers?: Record<string, string>

	/**
	 * Service version (optional)
	 * @example '1.0.0'
	 */
	serviceVersion?: string

	/**
	 * Deployment environment
	 * Falls back to VERCEL_ENV, NODE_ENV
	 * @example 'production', 'development'
	 */
	environment?: string

	/**
	 * Additional resource attributes
	 * @example { 'cloud.region': 'us-east-1' }
	 */
	resourceAttributes?: Record<string, unknown>

	/**
	 * Batch size for span export
	 * @default 100
	 */
	batchSize?: number

	/**
	 * Flush interval in ms
	 * @default 5000
	 */
	flushInterval?: number
}

/**
 * Auto-instrumentation options
 */
export interface AutoInstrumentConfig {
	/**
	 * Auto-instrument all fetch() calls
	 * @default true
	 */
	fetch?: boolean | InstrumentFetchOptions

	/**
	 * Capture console.error as spans
	 * @default false
	 */
	console?: boolean

	/**
	 * Database instrumentation configuration
	 *
	 * When provided, this configuration is stored globally and can be
	 * accessed by instrumentPostgres() for consistent settings.
	 *
	 * Note: You still need to wrap your postgres client with instrumentPostgres()
	 * in your database setup file. This config just provides the default settings.
	 *
	 * @example
	 * ```typescript
	 * // instrumentation.ts
	 * registerVestig({
	 *   autoInstrument: {
	 *     database: {
	 *       slowQueryThreshold: 100,
	 *       onQuery: (entry) => {
	 *         if (entry.isSlow) sendToMetrics(entry)
	 *       }
	 *     }
	 *   }
	 * })
	 *
	 * // lib/db.ts
	 * const client = instrumentPostgres(postgres(DATABASE_URL))
	 * // ^ Will use the config from registerVestig()
	 * ```
	 */
	database?: DatabaseInstrumentConfig
}

/**
 * Options for registerVestig
 */
export interface RegisterVestigOptions {
	/**
	 * Service name (required)
	 * Used in OTLP resource attributes
	 */
	serviceName: string

	/**
	 * OTLP configuration
	 * If provided, enables automatic span export
	 */
	otlp?: OTLPConfig

	/**
	 * Auto-instrumentation options
	 */
	autoInstrument?: AutoInstrumentConfig

	/**
	 * Tail sampling configuration for wide events
	 */
	tailSampling?: TailSamplingConfig

	/**
	 * Enable debug logging
	 * @default false
	 */
	debug?: boolean
}

/**
 * Result of registerVestig
 */
export interface RegisterVestigResult {
	/**
	 * Whether OTLP export was enabled
	 */
	otlpEnabled: boolean

	/**
	 * Whether fetch was instrumented
	 */
	fetchInstrumented: boolean

	/**
	 * Whether console capture was enabled
	 */
	consoleInstrumented: boolean

	/**
	 * Whether database instrumentation config was set
	 * Note: You still need to use instrumentPostgres() in your db setup
	 */
	databaseConfigured: boolean

	/**
	 * Shutdown function to cleanup resources
	 */
	shutdown: () => Promise<void>
}
