import { type AsyncStorage, createAsyncStorage } from '../async-storage'
import { registerVestigInstance } from '../instance'
import { CAPABILITIES, IS_SERVER } from '../runtime'
import type { WideEventBuilder } from './types'

/**
 * Wide event context manager interface
 */
interface WideEventContextManager {
	get(): WideEventBuilder | undefined
	run<T>(event: WideEventBuilder, fn: () => T): T
	runAsync<T>(event: WideEventBuilder, fn: () => Promise<T>): Promise<T>
}

/**
 * Global context manager for environments without AsyncLocalStorage
 */
class GlobalWideEventContextManager implements WideEventContextManager {
	private static instance: GlobalWideEventContextManager
	private currentEvent: WideEventBuilder | undefined
	private eventStack: WideEventBuilder[] = []

	private constructor() {}

	static getInstance(): GlobalWideEventContextManager {
		if (!GlobalWideEventContextManager.instance) {
			GlobalWideEventContextManager.instance = new GlobalWideEventContextManager()
		}
		return GlobalWideEventContextManager.instance
	}

	get(): WideEventBuilder | undefined {
		return this.currentEvent
	}

	run<T>(event: WideEventBuilder, fn: () => T): T {
		const previousEvent = this.currentEvent
		this.currentEvent = event
		this.eventStack.push(event)
		try {
			return fn()
		} finally {
			this.eventStack.pop()
			this.currentEvent = previousEvent
		}
	}

	runAsync<T>(event: WideEventBuilder, fn: () => Promise<T>): Promise<T> {
		const previousEvent = this.currentEvent
		this.currentEvent = event
		this.eventStack.push(event)
		return fn().finally(() => {
			this.eventStack.pop()
			this.currentEvent = previousEvent
		})
	}
}

/**
 * AsyncLocalStorage context manager for Node.js/Bun/Deno
 */
class AsyncLocalStorageWideEventContextManager implements WideEventContextManager {
	private storage: AsyncStorage<WideEventBuilder> | null = null

	constructor() {
		if (IS_SERVER && CAPABILITIES.hasAsyncLocalStorage) {
			this.storage = createAsyncStorage<WideEventBuilder>()
		}
	}

	/**
	 * Reads must use the same store the writes went to. Falling back only in
	 * run()/runAsync() left get() reading an AsyncLocalStorage that was never
	 * created, so the active wide event was invisible under Node ESM.
	 */
	get(): WideEventBuilder | undefined {
		const storage = this.storage
		if (!storage) return GlobalWideEventContextManager.getInstance().get()

		return storage.getStore()
	}

	run<T>(event: WideEventBuilder, fn: () => T): T {
		const storage = this.storage
		if (!storage) return GlobalWideEventContextManager.getInstance().run(event, fn)

		return storage.run(event, fn)
	}

	runAsync<T>(event: WideEventBuilder, fn: () => Promise<T>): Promise<T> {
		const storage = this.storage
		if (!storage) return GlobalWideEventContextManager.getInstance().runAsync(event, fn)

		return storage.run(event, fn)
	}
}

/**
 * Create the appropriate context manager for the current runtime
 */
function createWideEventContextManager(): WideEventContextManager {
	if (IS_SERVER && CAPABILITIES.hasAsyncLocalStorage) {
		return new AsyncLocalStorageWideEventContextManager()
	}
	return GlobalWideEventContextManager.getInstance()
}

/**
 * Global wide event context manager instance
 *
 * Wide events carry their own module state, so this entry point registers the
 * copy too — reaching wide events without touching the logging context is
 * possible, and a duplicate must still be reported.
 */
const wideEventContextManager = createWideEventContextManager()
registerVestigInstance()

/**
 * Get the active wide event builder from the current async context.
 *
 * @returns The active WideEventBuilder or undefined if not in a wide event context
 *
 * @example
 * ```typescript
 * // In a route handler or middleware
 * const event = getActiveWideEvent();
 * if (event) {
 *   event.set('user', 'id', userId);
 * }
 * ```
 */
export function getActiveWideEvent(): WideEventBuilder | undefined {
	return wideEventContextManager.get()
}

/**
 * Run a function with the given wide event in context.
 *
 * The event will be accessible via getActiveWideEvent() within
 * the function and all async operations it spawns.
 *
 * @param event - The wide event builder to set as active
 * @param fn - Function to execute with the event in context
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const event = createWideEvent({ type: 'http.request' });
 * withWideEvent(event, () => {
 *   // Event is accessible anywhere in this call stack
 *   handleRequest();
 * });
 * ```
 */
export function withWideEvent<T>(event: WideEventBuilder, fn: () => T): T {
	return wideEventContextManager.run(event, fn)
}

/**
 * Run an async function with the given wide event in context.
 *
 * The event will be accessible via getActiveWideEvent() within
 * the async function and all operations it awaits.
 *
 * @param event - The wide event builder to set as active
 * @param fn - Async function to execute with the event in context
 * @returns Promise resolving to the function result
 *
 * @example
 * ```typescript
 * const event = createWideEvent({ type: 'http.request' });
 * await withWideEventAsync(event, async () => {
 *   await fetchUser();  // Event accessible in fetchUser
 *   await processOrder(); // Event accessible in processOrder
 * });
 * ```
 */
export function withWideEventAsync<T>(event: WideEventBuilder, fn: () => Promise<T>): Promise<T> {
	return wideEventContextManager.runAsync(event, fn)
}
