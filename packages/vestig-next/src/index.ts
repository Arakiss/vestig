/**
 * @vestig/next - First-class Next.js 15+ integration for vestig logging
 *
 * @example Server Components
 * ```typescript
 * import { getLogger } from '@vestig/next'
 *
 * export default async function Page() {
 *   const log = await getLogger('my-page')
 *   log.info('Rendering page')
 *   return <div>Hello</div>
 * }
 * ```
 *
 * @example Route Handlers
 * ```typescript
 * import { withVestig } from '@vestig/next'
 *
 * export const GET = withVestig(async (req, { log }) => {
 *   log.info('Handling request')
 *   return Response.json({ ok: true })
 * })
 * ```
 *
 * @example Server Actions
 * ```typescript
 * import { vestigAction } from '@vestig/next'
 *
 * export const createUser = vestigAction(async (data, { log }) => {
 *   log.info('Creating user')
 *   return await db.users.create({ data })
 * })
 * ```
 *
 * @packageDocumentation
 */

// Server Components
export {
	getLogger,
	getRequestContext,
	createChildLogger,
	configureServerLogger,
} from './server/server-component'
export type { ServerLoggerOptions } from './server/server-component'

// Route Handlers
export { withVestig, createRouteHandlers } from './server/route-handler'

// Server Actions
export { vestigAction, createVestigAction } from './server/server-action'

// Types
export type {
	// Core types (re-exported from vestig)
	Logger,
	LoggerConfig,
	LogLevel,
	LogEntry,
	LogMetadata,
	LogContext,
	Transport,
	SanitizePreset,
	SanitizeConfig,
	Span,
	// Next.js types
	RouteHandlerContext,
	RouteHandler,
	WithVestigOptions,
	ActionContext,
	ServerAction,
	VestigActionOptions,
	VestigProviderProps,
} from './types'

// Config types
export type {
	VestigNextConfig,
	VestigNextOptions,
	VestigNextMiddlewareConfig,
	VestigNextServerConfig,
	VestigNextClientConfig,
	VestigNextDevToolsConfig,
} from './config'
