import { headers } from 'next/headers'
import { cache } from 'react'
import {
	type LogContext,
	type LogLevel,
	type Logger,
	type SanitizePreset,
	createCorrelationContext,
	createLogger,
} from 'vestig'
import { CORRELATION_HEADERS } from '../utils/headers'

export interface ServerLoggerOptions {
	/** Log level */
	level?: LogLevel
	/** Enable/disable logging */
	enabled?: boolean
	/** PII sanitization preset */
	sanitize?: SanitizePreset
	/** Use structured JSON output */
	structured?: boolean
	/** Base namespace for server-side logs */
	namespace?: string
	/** Additional context to include in all logs */
	context?: Record<string, unknown>
}

const DEFAULT_OPTIONS: ServerLoggerOptions = {
	level: 'info',
	enabled: true,
	sanitize: 'default',
	structured: true,
	namespace: 'server',
}

// Store options at module level
let serverOptions: ServerLoggerOptions = DEFAULT_OPTIONS

/**
 * Configure server-side logging options
 * Call this once in your app initialization
 */
export function configureServerLogger(options: ServerLoggerOptions): void {
	serverOptions = { ...DEFAULT_OPTIONS, ...options }
}

interface RequestLoggerResult {
	logger: Logger
	context: LogContext
}

/**
 * Get a request-scoped logger using React's cache
 * This ensures the same logger instance is used for the entire request
 */
const getRequestLogger = cache(async (): Promise<RequestLoggerResult> => {
	const headersList = await headers()

	// Extract correlation context from headers (set by proxy/middleware)
	const requestId = headersList.get(CORRELATION_HEADERS.REQUEST_ID) ?? undefined
	const traceId = headersList.get(CORRELATION_HEADERS.TRACE_ID) ?? undefined
	const spanId = headersList.get(CORRELATION_HEADERS.SPAN_ID) ?? undefined

	// Create or use existing correlation context
	const context = createCorrelationContext({ requestId, traceId, spanId })

	// Create logger with full context
	const logger = createLogger({
		level: serverOptions.level,
		enabled: serverOptions.enabled,
		sanitize: serverOptions.sanitize,
		structured: serverOptions.structured,
		namespace: serverOptions.namespace,
		context: {
			...serverOptions.context,
			...context,
		},
	})

	return { logger, context }
})

/**
 * Get a logger instance in Server Components
 *
 * Automatically includes request correlation context from the middleware.
 * Uses React's cache() to ensure the same logger is used for the entire request.
 *
 * @param namespace - Optional namespace for the logger (e.g., 'users', 'auth')
 *
 * @example
 * ```typescript
 * // app/users/page.tsx
 * import { getLogger } from '@vestig/next'
 *
 * export default async function UsersPage() {
 *   const log = await getLogger('users-page')
 *
 *   log.info('Rendering users page')
 *
 *   const users = await fetchUsers()
 *   log.debug('Users fetched', { count: users.length })
 *
 *   return <UserList users={users} />
 * }
 * ```
 */
export async function getLogger(namespace?: string): Promise<Logger> {
	const { logger } = await getRequestLogger()
	return namespace ? logger.child(namespace) : logger
}

/**
 * Get the current request's correlation context in Server Components
 *
 * Useful for passing correlation IDs to client components or external services.
 *
 * @example
 * ```typescript
 * // app/layout.tsx
 * import { getRequestContext } from '@vestig/next'
 * import { VestigProvider } from '@vestig/next/client'
 *
 * export default async function RootLayout({ children }) {
 *   const ctx = await getRequestContext()
 *
 *   return (
 *     <html>
 *       <body>
 *         <VestigProvider initialContext={ctx}>
 *           {children}
 *         </VestigProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export async function getRequestContext(): Promise<LogContext> {
	const { context } = await getRequestLogger()
	return context
}

/**
 * Create a child logger with additional context
 *
 * @param namespace - Logger namespace
 * @param additionalContext - Additional context to merge
 *
 * @example
 * ```typescript
 * const log = await createChildLogger('users', { userId: user.id })
 * log.info('Processing user') // Includes userId in all logs
 * ```
 */
export async function createChildLogger(
	namespace: string,
	additionalContext?: Record<string, unknown>,
): Promise<Logger> {
	const { logger } = await getRequestLogger()
	return logger.child(namespace, { context: additionalContext })
}
