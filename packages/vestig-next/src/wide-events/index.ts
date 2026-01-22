/**
 * Wide Events integration for Next.js
 *
 * Wide Events (also called Canonical Log Lines) capture comprehensive context
 * about complete operations in a single structured event, making debugging
 * and observability significantly easier.
 *
 * @example Middleware setup
 * ```typescript
 * // middleware.ts
 * import { createWideEventMiddleware } from '@vestig/next/wide-events'
 *
 * export const middleware = createWideEventMiddleware({
 *   tailSampling: {
 *     enabled: true,
 *     alwaysKeepStatuses: ['error'],
 *     slowThresholdMs: 2000,
 *     successSampleRate: 0.1,
 *   },
 * })
 * ```
 *
 * @example Server Actions
 * ```typescript
 * // app/actions/user.ts
 * 'use server'
 *
 * import { withWideEvent, setWideEventUser } from '@vestig/next/wide-events'
 *
 * export const createUser = withWideEvent(
 *   async (data, { event }) => {
 *     const user = await db.users.create({ data })
 *     setWideEventUser({ id: user.id, email: user.email })
 *     return user
 *   },
 *   { name: 'action.user.create' }
 * )
 * ```
 *
 * @example Enriching from route handlers
 * ```typescript
 * // app/api/checkout/route.ts
 * import { getWideEvent, setWideEventField } from '@vestig/next/wide-events'
 *
 * export async function POST(request: Request) {
 *   const event = getWideEvent()
 *   if (event) {
 *     event.set('order', 'id', orderId)
 *     event.set('payment', 'method', 'stripe')
 *   }
 *   // ...
 * }
 * ```
 *
 * @packageDocumentation
 */

// Context functions
export {
	getWideEvent,
	requireWideEvent,
	getWideEventElapsed,
	runWithWideEvent,
	runWithWideEventAsync,
	type WideEventRequestContext,
} from './context'

// Middleware
export {
	createWideEventMiddleware,
	wideEventMiddleware,
	type WideEventMiddlewareOptions,
} from './middleware'

// Helpers
export {
	setWideEventUser,
	setWideEventPerformance,
	setWideEventField,
	mergeWideEventFields,
	setWideEventFeatureFlags,
	setWideEventError,
	timeWideEventOperation,
} from './helpers'

// Server Actions
export {
	withWideEvent,
	withWideEventArgs,
	createWideEventAction,
	createWideEventActionWithArgs,
	type WideEventActionOptions,
	type WideEventActionContext,
	type WideEventServerAction,
	type WideEventServerActionWithArgs,
} from './server-action'

// Re-export core wide event types for convenience
export type {
	WideEvent,
	WideEventBuilder,
	WideEventConfig,
	WideEventContext,
	WideEventEndOptions,
	WideEventFields,
	WideEventStatus,
	TailSamplingConfig,
} from 'vestig'

// Re-export createWideEvent for advanced use cases
export { createWideEvent } from 'vestig'
