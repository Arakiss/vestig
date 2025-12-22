import { CAPABILITIES, IS_SERVER } from '../runtime'
import type { LogContext } from '../types'
import { generateRequestId, generateSpanId, generateTraceId } from './correlation'

export { generateRequestId, generateSpanId, generateTraceId } from './correlation'
export { parseTraceparent, createTraceparent } from './correlation'
export {
	parseTracestate,
	createTracestate,
	getTracestateValue,
	setTracestateValue,
	deleteTracestateKey,
} from './correlation'
export type { TracestateEntry } from './correlation'

/**
 * Context manager interface
 */
interface ContextManager {
	get(): LogContext | undefined
	run<T>(context: LogContext, fn: () => T): T
	runAsync<T>(context: LogContext, fn: () => Promise<T>): Promise<T>
}

/**
 * Global context manager for environments without AsyncLocalStorage
 */
class GlobalContextManager implements ContextManager {
	private static instance: GlobalContextManager
	private currentContext: LogContext | undefined
	private contextStack: LogContext[] = []

	private constructor() {}

	static getInstance(): GlobalContextManager {
		if (!GlobalContextManager.instance) {
			GlobalContextManager.instance = new GlobalContextManager()
		}
		return GlobalContextManager.instance
	}

	get(): LogContext | undefined {
		return this.currentContext
	}

	run<T>(context: LogContext, fn: () => T): T {
		const previousContext = this.currentContext
		this.currentContext = { ...previousContext, ...context }
		this.contextStack.push(this.currentContext)
		try {
			return fn()
		} finally {
			this.contextStack.pop()
			this.currentContext = previousContext
		}
	}

	runAsync<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
		const previousContext = this.currentContext
		this.currentContext = { ...previousContext, ...context }
		this.contextStack.push(this.currentContext)
		return fn().finally(() => {
			this.contextStack.pop()
			this.currentContext = previousContext
		})
	}
}

/**
 * AsyncLocalStorage context manager for Node.js/Bun/Deno
 */
class AsyncLocalStorageContextManager implements ContextManager {
	private storage: {
		getStore: () => LogContext | undefined
		run: <T>(store: LogContext, fn: () => T) => T
	} | null = null

	constructor() {
		// Dynamic import to avoid errors in non-Node environments
		if (IS_SERVER && CAPABILITIES.hasAsyncLocalStorage) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const asyncHooks = require('node:async_hooks') as {
					AsyncLocalStorage: new <T>() => {
						getStore: () => T | undefined
						run: <R>(store: T, fn: () => R) => R
					}
				}
				this.storage = new asyncHooks.AsyncLocalStorage<LogContext>()
			} catch {
				// Fallback handled by get()
			}
		}
	}

	get(): LogContext | undefined {
		return this.storage?.getStore()
	}

	run<T>(context: LogContext, fn: () => T): T {
		if (!this.storage) {
			return GlobalContextManager.getInstance().run(context, fn)
		}
		const current = this.storage.getStore()
		return this.storage.run({ ...current, ...context }, fn)
	}

	runAsync<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
		if (!this.storage) {
			return GlobalContextManager.getInstance().runAsync(context, fn)
		}
		const current = this.storage.getStore()
		return this.storage.run({ ...current, ...context }, fn)
	}
}

/**
 * Create the appropriate context manager for the current runtime
 */
function createContextManager(): ContextManager {
	if (IS_SERVER && CAPABILITIES.hasAsyncLocalStorage) {
		return new AsyncLocalStorageContextManager()
	}
	return GlobalContextManager.getInstance()
}

/**
 * Global context manager instance
 */
const contextManager = createContextManager()

/**
 * Get the current context
 */
export function getContext(): LogContext | undefined {
	return contextManager.get()
}

/**
 * Run a function with the given context
 */
export function withContext<T>(context: LogContext, fn: () => T): T {
	return contextManager.run(context, fn)
}

/**
 * Run an async function with the given context
 */
export function withContextAsync<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
	return contextManager.runAsync(context, fn)
}

/**
 * Create a new context with correlation IDs
 *
 * Note: We explicitly generate IDs for undefined values and don't spread
 * the original object to avoid overwriting generated values with undefined.
 */
export function createCorrelationContext(existing?: Partial<LogContext>): LogContext {
	// Extract known correlation fields, generating if not provided
	const requestId = existing?.requestId ?? generateRequestId()
	const traceId = existing?.traceId ?? generateTraceId()
	const spanId = existing?.spanId ?? generateSpanId()

	// Build context with only defined extra properties
	const context: LogContext = { requestId, traceId, spanId }

	// Add any extra properties from existing, but filter out undefined values
	if (existing) {
		for (const [key, value] of Object.entries(existing)) {
			if (value !== undefined && !(key in context)) {
				;(context as Record<string, unknown>)[key] = value
			}
		}
	}

	return context
}
