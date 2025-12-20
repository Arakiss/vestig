'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { LogContext, Logger } from 'vestig'
import { useVestigContext } from './provider'

/**
 * Get a logger instance in client components
 *
 * Optionally create a child logger with a namespace.
 * No need for useMemo - this hook handles it internally.
 *
 * @param namespace - Optional namespace for the logger
 *
 * @example
 * ```typescript
 * // components/UserForm.tsx
 * 'use client'
 *
 * import { useLogger } from '@vestig/next/client'
 *
 * export function UserForm() {
 *   const log = useLogger('user-form')
 *
 *   const handleSubmit = (data: FormData) => {
 *     log.info('Form submitted', {
 *       email: data.get('email'), // Will be sanitized
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useLogger(namespace?: string): Logger {
	const { logger } = useVestigContext()

	return useMemo(() => {
		return namespace ? logger.child(namespace) : logger
	}, [logger, namespace])
}

/**
 * Get the current correlation context
 *
 * Useful for passing IDs to external services or child components.
 *
 * @example
 * ```typescript
 * const ctx = useCorrelationContext()
 * console.log(ctx.requestId) // "abc-123" or "client-xyz-456"
 * ```
 */
export function useCorrelationContext(): LogContext {
	const { context } = useVestigContext()
	return context
}

/**
 * Check if client logging is connected to server
 *
 * @example
 * ```typescript
 * const isConnected = useVestigConnection()
 * // Show indicator if logs are being sent successfully
 * ```
 */
export function useVestigConnection(): boolean {
	const { isConnected } = useVestigContext()
	return isConnected
}

/**
 * Create a component-scoped logger with optional lifecycle logging
 *
 * @param componentName - Name of the component (used as namespace)
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * function Dashboard() {
 *   const log = useComponentLogger('Dashboard', { logLifecycle: true })
 *   // Logs: "Component mounted" on mount
 *   // Logs: "Component unmounting" on unmount
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useComponentLogger(
	componentName: string,
	options: {
		/** Log mount/unmount lifecycle events (default: false) */
		logLifecycle?: boolean
		/** Additional context to include in all logs */
		context?: Record<string, unknown>
	} = {},
): Logger {
	const { logger } = useVestigContext()
	const { logLifecycle = false, context } = options

	const log = useMemo(() => {
		return logger.child(componentName, context ? { context } : undefined)
	}, [logger, componentName, context])

	// Track if this is initial mount
	const isMounted = useRef(false)

	useEffect(() => {
		if (logLifecycle && !isMounted.current) {
			log.debug('Component mounted')
			isMounted.current = true
		}

		return () => {
			if (logLifecycle) {
				log.debug('Component unmounting')
			}
		}
	}, [log, logLifecycle])

	return log
}

/**
 * Create a logger that tracks render count
 *
 * Useful for debugging performance issues.
 *
 * @example
 * ```typescript
 * function ExpensiveComponent() {
 *   const { log, renderCount } = useRenderLogger('ExpensiveComponent')
 *   // Logs render count on each render
 *
 *   return <div>Rendered {renderCount} times</div>
 * }
 * ```
 */
export function useRenderLogger(componentName: string): {
	log: Logger
	renderCount: number
} {
	const log = useLogger(componentName)
	const renderCount = useRef(0)

	renderCount.current += 1

	useEffect(() => {
		log.trace('Component rendered', { renderCount: renderCount.current })
	})

	return { log, renderCount: renderCount.current }
}
