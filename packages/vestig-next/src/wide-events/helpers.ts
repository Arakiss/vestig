import type { WideEventBuilder } from 'vestig'
import { getWideEvent, getWideEventElapsed, requireWideEvent } from './context'

// Re-export context functions as helpers
export { getWideEvent, requireWideEvent, getWideEventElapsed }

/**
 * Set user information on the current wide event.
 *
 * This is a convenience function for setting common user fields.
 *
 * @param user - User information to set
 *
 * @example
 * ```typescript
 * import { setWideEventUser } from '@vestig/next/wide-events'
 *
 * // In your auth middleware or route handler
 * setWideEventUser({
 *   id: user.id,
 *   subscription: user.plan,
 *   role: user.role,
 * })
 * ```
 */
export function setWideEventUser(user: {
	id?: string
	email?: string
	name?: string
	subscription?: string
	role?: string
	[key: string]: unknown
}): void {
	const event = getWideEvent()
	if (!event) return

	// Set userId in context for tail sampling VIP detection
	if (user.id) {
		event.setContext({ userId: user.id })
	}

	// Set user fields
	event.merge('user', user)
}

/**
 * Set performance metrics on the current wide event.
 *
 * @param metrics - Performance metrics to set
 *
 * @example
 * ```typescript
 * import { setWideEventPerformance } from '@vestig/next/wide-events'
 *
 * // After database query
 * setWideEventPerformance({
 *   db_query_ms: queryTime,
 *   db_rows: results.length,
 * })
 * ```
 */
export function setWideEventPerformance(metrics: Record<string, number | string>): void {
	const event = getWideEvent()
	if (!event) return

	event.merge('performance', metrics)
}

/**
 * Add a custom field to the current wide event.
 *
 * @param category - Field category (e.g., 'order', 'payment', 'feature')
 * @param key - Field key
 * @param value - Field value
 *
 * @example
 * ```typescript
 * import { setWideEventField } from '@vestig/next/wide-events'
 *
 * setWideEventField('order', 'id', orderId)
 * setWideEventField('order', 'total', order.total)
 * setWideEventField('order', 'items', order.items.length)
 * ```
 */
export function setWideEventField(category: string, key: string, value: unknown): void {
	const event = getWideEvent()
	if (!event) return

	event.set(category, key, value)
}

/**
 * Add multiple fields to a category on the current wide event.
 *
 * @param category - Field category
 * @param fields - Fields to merge
 *
 * @example
 * ```typescript
 * import { mergeWideEventFields } from '@vestig/next/wide-events'
 *
 * mergeWideEventFields('payment', {
 *   method: 'stripe',
 *   amount: 9999,
 *   currency: 'usd',
 *   status: 'succeeded',
 * })
 * ```
 */
export function mergeWideEventFields(category: string, fields: Record<string, unknown>): void {
	const event = getWideEvent()
	if (!event) return

	event.merge(category, fields)
}

/**
 * Add feature flag information to the current wide event.
 *
 * @param flags - Feature flag values
 *
 * @example
 * ```typescript
 * import { setWideEventFeatureFlags } from '@vestig/next/wide-events'
 *
 * setWideEventFeatureFlags({
 *   new_checkout: true,
 *   beta_features: false,
 *   experiment_id: 'exp-123',
 * })
 * ```
 */
export function setWideEventFeatureFlags(flags: Record<string, boolean | string | number>): void {
	const event = getWideEvent()
	if (!event) return

	event.merge('feature_flags', flags)
}

/**
 * Add error information to the current wide event.
 *
 * This should be called when an error occurs during request processing.
 * The wide event will be marked as 'error' status when finalized.
 *
 * @param error - The error that occurred
 * @param additionalContext - Additional context about the error
 *
 * @example
 * ```typescript
 * import { setWideEventError } from '@vestig/next/wide-events'
 *
 * try {
 *   await processPayment(order)
 * } catch (error) {
 *   setWideEventError(error, { orderId: order.id })
 *   throw error
 * }
 * ```
 */
export function setWideEventError(
	error: Error | unknown,
	additionalContext?: Record<string, unknown>,
): void {
	const event = getWideEvent()
	if (!event) return

	const err = error instanceof Error ? error : new Error(String(error))

	event.merge('error', {
		name: err.name,
		message: err.message,
		stack: err.stack?.split('\n').slice(0, 10).join('\n'),
		...additionalContext,
	})
}

/**
 * Create a timing helper for tracking sub-operations within a request.
 *
 * @param name - Name of the operation being timed
 * @returns A function to call when the operation completes
 *
 * @example
 * ```typescript
 * import { timeWideEventOperation } from '@vestig/next/wide-events'
 *
 * const endDbQuery = timeWideEventOperation('db_users_query')
 * const users = await db.users.findMany()
 * endDbQuery()
 * ```
 */
export function timeWideEventOperation(name: string): () => void {
	const startTime = performance.now()
	const event = getWideEvent()

	return () => {
		const duration = performance.now() - startTime
		if (event) {
			event.set('performance', `${name}_ms`, duration)
		}
	}
}
