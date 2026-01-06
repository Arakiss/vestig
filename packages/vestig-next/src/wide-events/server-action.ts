import {
	type LogLevel,
	type Logger,
	type SanitizePreset,
	type TailSamplingConfig,
	createLogger,
	createWideEvent,
} from 'vestig'
import { type WideEventRequestContext, getWideEvent, runWithWideEventAsync } from './context'

/**
 * Options for wide event server actions
 */
export interface WideEventActionOptions {
	/** Action name (used as event type) */
	name?: string
	/** Log level */
	level?: LogLevel
	/** Enable/disable wide event emission */
	enabled?: boolean
	/** PII sanitization preset */
	sanitize?: SanitizePreset
	/** Use structured JSON output */
	structured?: boolean
	/** Tail sampling configuration */
	tailSampling?: TailSamplingConfig
}

const DEFAULT_OPTIONS: WideEventActionOptions = {
	level: 'info',
	enabled: true,
	sanitize: 'default',
	structured: true,
}

// Cached logger
let cachedLogger: Logger | null = null

function getOrCreateLogger(options: WideEventActionOptions): Logger {
	if (cachedLogger && options === DEFAULT_OPTIONS) {
		return cachedLogger
	}

	const logger = createLogger({
		level: options.level,
		enabled: options.enabled,
		sanitize: options.sanitize,
		structured: options.structured,
		tailSampling: options.tailSampling,
	})

	if (options === DEFAULT_OPTIONS) {
		cachedLogger = logger
	}

	return logger
}

/**
 * Context provided to wide event actions
 */
export interface WideEventActionContext {
	/** The wide event builder for this action */
	event: ReturnType<typeof createWideEvent>
}

/**
 * Server action handler type with wide event context
 */
export type WideEventServerAction<TInput, TResult> = (
	input: TInput,
	ctx: WideEventActionContext,
) => Promise<TResult>

/**
 * Wrap a server action with wide event tracking.
 *
 * If called within an existing wide event context (e.g., from middleware),
 * it will enrich that event. Otherwise, it creates a new wide event.
 *
 * @example
 * ```typescript
 * // app/actions/user.ts
 * 'use server'
 *
 * import { withWideEvent } from '@vestig/next/wide-events'
 *
 * export const createUser = withWideEvent(
 *   async (data: CreateUserInput, { event }) => {
 *     event.set('action', 'type', 'user.create')
 *     event.set('user', 'email', data.email)
 *
 *     const user = await db.users.create({ data })
 *
 *     event.set('user', 'id', user.id)
 *     return user
 *   },
 *   { name: 'action.user.create' }
 * )
 * ```
 */
export function withWideEvent<TInput, TResult>(
	handler: WideEventServerAction<TInput, TResult>,
	options: WideEventActionOptions = {},
): (input: TInput) => Promise<TResult> {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	return async (input: TInput): Promise<TResult> => {
		const startTime = performance.now()
		const logger = getOrCreateLogger(mergedOptions)

		// Check if we're already in a wide event context
		const existingEvent = getWideEvent()

		if (existingEvent) {
			// Enrich existing event with action context
			const actionName = mergedOptions.name ?? 'server-action'
			existingEvent.set('action', 'name', actionName)
			existingEvent.set('action', 'start_ms', performance.now() - startTime)

			try {
				const result = await handler(input, { event: existingEvent })

				existingEvent.set('action', 'duration_ms', performance.now() - startTime)
				existingEvent.set('action', 'status', 'success')

				return result
			} catch (error) {
				existingEvent.set('action', 'duration_ms', performance.now() - startTime)
				existingEvent.set('action', 'status', 'error')
				existingEvent.merge('error', {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
				})
				throw error
			}
		}

		// Create new wide event for this action
		const actionName = mergedOptions.name ?? 'server-action'
		const event = createWideEvent({
			type: actionName,
		})

		event.set('action', 'name', actionName)

		const eventContext: WideEventRequestContext = {
			event,
			startTime,
		}

		return runWithWideEventAsync(eventContext, async () => {
			try {
				const result = await handler(input, { event })

				// Complete and emit the wide event
				const duration = performance.now() - startTime
				event.set('performance', 'duration_ms', duration)

				const completedEvent = event.end({
					status: 'success',
					level: 'info',
				})

				logger.emitWideEvent(completedEvent)

				return result
			} catch (error) {
				const duration = performance.now() - startTime
				event.set('performance', 'duration_ms', duration)
				event.merge('error', {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
				})

				const completedEvent = event.end({
					status: 'error',
					error: error instanceof Error ? error : new Error(String(error)),
					level: 'error',
				})

				logger.emitWideEvent(completedEvent)

				throw error
			}
		})
	}
}

/**
 * Create a factory for wide event server actions with shared options.
 *
 * @example
 * ```typescript
 * // app/actions/index.ts
 * import { createWideEventAction } from '@vestig/next/wide-events'
 *
 * const action = createWideEventAction({
 *   tailSampling: {
 *     enabled: true,
 *     successSampleRate: 0.1,
 *   },
 * })
 *
 * export const createUser = action(
 *   async (data, { event }) => {
 *     event.set('user', 'email', data.email)
 *     return await db.users.create({ data })
 *   },
 *   { name: 'action.user.create' }
 * )
 *
 * export const updateUser = action(
 *   async ({ id, data }, { event }) => {
 *     event.set('user', 'id', id)
 *     return await db.users.update({ where: { id }, data })
 *   },
 *   { name: 'action.user.update' }
 * )
 * ```
 */
export function createWideEventAction(defaultOptions: WideEventActionOptions = {}) {
	return <TInput, TResult>(
		handler: WideEventServerAction<TInput, TResult>,
		options: WideEventActionOptions = {},
	): ((input: TInput) => Promise<TResult>) =>
		withWideEvent(handler, { ...defaultOptions, ...options })
}
