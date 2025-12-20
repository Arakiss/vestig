import { headers } from 'next/headers'
import {
	type LogLevel,
	type Logger,
	type SanitizePreset,
	createCorrelationContext,
	createLogger,
	withContext,
} from 'vestig'
import type { ActionContext, ServerAction, VestigActionOptions } from '../types'
import { CORRELATION_HEADERS } from '../utils/headers'
import { createRequestTiming, formatDuration } from '../utils/timing'

export interface ActionOptions extends VestigActionOptions {
	/** Log level for the action logger */
	level?: LogLevel
	/** Enable/disable logging */
	enabled?: boolean
	/** PII sanitization preset */
	sanitize?: SanitizePreset
	/** Use structured JSON output */
	structured?: boolean
	/** Additional context to include in all logs */
	context?: Record<string, unknown>
}

const DEFAULT_OPTIONS: ActionOptions = {
	level: 'info',
	enabled: true,
	sanitize: 'default',
	structured: true,
	logInput: false,
	logOutput: false,
}

/**
 * Wrap a server action with vestig logging
 *
 * Provides automatic:
 * - Request correlation (from headers)
 * - Action start/end logging with timing
 * - Error logging
 * - Context propagation
 *
 * @example
 * ```typescript
 * // app/actions/user-actions.ts
 * 'use server'
 *
 * import { vestigAction } from '@vestig/next'
 *
 * export const createUser = vestigAction(
 *   async (data: { name: string; email: string }, { log, ctx }) => {
 *     log.debug('Validating user data')
 *
 *     if (!data.email.includes('@')) {
 *       log.warn('Invalid email provided')
 *       throw new Error('Invalid email')
 *     }
 *
 *     log.debug('Creating user in database')
 *     const user = await db.users.create({ data })
 *
 *     log.info('User created successfully', { userId: user.id })
 *
 *     return user
 *   },
 *   { namespace: 'actions:createUser' }
 * )
 * ```
 */
export function vestigAction<TInput, TOutput>(
	action: ServerAction<TInput, TOutput>,
	options: ActionOptions = {},
): (input: TInput) => Promise<TOutput> {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	return async (input: TInput) => {
		const headersList = await headers()
		const timing = createRequestTiming()

		// Create base logger
		const baseLogger = createLogger({
			level: mergedOptions.level,
			enabled: mergedOptions.enabled,
			sanitize: mergedOptions.sanitize,
			structured: mergedOptions.structured,
			context: mergedOptions.context,
		})

		const log = mergedOptions.namespace
			? baseLogger.child(mergedOptions.namespace)
			: baseLogger.child('action')

		// Extract correlation context from headers
		const requestId = headersList.get(CORRELATION_HEADERS.REQUEST_ID) ?? undefined
		const traceId = headersList.get(CORRELATION_HEADERS.TRACE_ID) ?? undefined
		const spanId = headersList.get(CORRELATION_HEADERS.SPAN_ID) ?? undefined

		const ctx = createCorrelationContext({ requestId, traceId, spanId })
		const actionContext: ActionContext = { log, ctx }

		return withContext(ctx, async () => {
			// Log action start
			const startLog: Record<string, unknown> = {
				requestId: ctx.requestId,
				inputType: typeof input,
			}

			if (mergedOptions.logInput) {
				startLog.input = input
			}

			log.info('Action started', startLog)

			try {
				const result = await action(input, actionContext)
				const duration = timing.complete()

				const endLog: Record<string, unknown> = {
					duration: formatDuration(duration),
					durationMs: duration,
					requestId: ctx.requestId,
					success: true,
				}

				if (mergedOptions.logOutput) {
					endLog.output = result
				}

				log.info('Action completed', endLog)

				return result
			} catch (error) {
				const duration = timing.complete()
				log.error('Action failed', {
					error,
					duration: formatDuration(duration),
					durationMs: duration,
					requestId: ctx.requestId,
				})
				throw error
			}
		})
	}
}

/**
 * Type-safe action creator with inferred types
 *
 * @example
 * ```typescript
 * const createUser = createVestigAction({
 *   namespace: 'users:create',
 *   action: async (data: CreateUserInput, { log }) => {
 *     log.info('Creating user')
 *     return await db.users.create({ data })
 *   },
 * })
 * ```
 */
export function createVestigAction<TInput, TOutput>(config: {
	namespace?: string
	logInput?: boolean
	logOutput?: boolean
	level?: LogLevel
	sanitize?: SanitizePreset
	action: ServerAction<TInput, TOutput>
}): (input: TInput) => Promise<TOutput> {
	return vestigAction(config.action, {
		namespace: config.namespace,
		logInput: config.logInput,
		logOutput: config.logOutput,
		level: config.level,
		sanitize: config.sanitize,
	})
}
