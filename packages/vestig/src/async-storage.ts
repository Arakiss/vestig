/**
 * AsyncLocalStorage loading
 * =========================
 *
 * Both context managers need `AsyncLocalStorage` synchronously, at construction
 * time, in a package that ships as ESM and also has to run on Edge runtimes and
 * in browsers where `node:async_hooks` does not exist.
 *
 * `require('node:async_hooks')` only covers part of that: in a real ESM module
 * `require` is not defined, so under Node the call throws, the failure is
 * swallowed, and context propagation silently degrades. Bun does expose
 * `require` inside ESM, which is why the test suite never saw it.
 *
 * `process.getBuiltinModule()` is the supported way to reach a builtin
 * synchronously from ESM, so it is tried first, with `require` kept as the
 * fallback for CommonJS consumers and older runtimes.
 */

/**
 * The subset of AsyncLocalStorage this package uses.
 */
export interface AsyncStorage<T> {
	getStore(): T | undefined
	run<R>(store: T, fn: () => R): R
}

/**
 * Constructor shape of `AsyncLocalStorage`.
 */
export type AsyncStorageConstructor = new <T>() => AsyncStorage<T>

interface AsyncHooksModule {
	AsyncLocalStorage?: AsyncStorageConstructor
}

/**
 * Reach `node:async_hooks` through `process.getBuiltinModule` (Node 20.16+,
 * 22+, and Bun). This is the only synchronous route that works from ESM.
 */
function loadViaBuiltinModule(): AsyncStorageConstructor | null {
	try {
		const proc = globalThis.process as
			| (NodeJS.Process & { getBuiltinModule?: (id: string) => unknown })
			| undefined

		if (typeof proc?.getBuiltinModule !== 'function') return null

		const asyncHooks = proc.getBuiltinModule('node:async_hooks') as AsyncHooksModule | undefined
		return asyncHooks?.AsyncLocalStorage ?? null
	} catch {
		return null
	}
}

/**
 * Reach `node:async_hooks` through `require`, for CommonJS consumers and
 * runtimes that predate `process.getBuiltinModule`.
 */
function loadViaRequire(): AsyncStorageConstructor | null {
	try {
		// `typeof` on an undeclared identifier is safe; calling it is not.
		if (typeof require !== 'function') return null

		const asyncHooks = require('node:async_hooks') as AsyncHooksModule
		return asyncHooks?.AsyncLocalStorage ?? null
	} catch {
		return null
	}
}

/**
 * Resolve the `AsyncLocalStorage` constructor for the current runtime.
 *
 * @returns The constructor, or `null` where async context tracking is not
 * available (Edge runtimes, browsers) — callers fall back to the global
 * context manager.
 */
export function loadAsyncLocalStorage(): AsyncStorageConstructor | null {
	return loadViaBuiltinModule() ?? loadViaRequire()
}

/**
 * Create an `AsyncLocalStorage` instance, or `null` when unavailable.
 */
export function createAsyncStorage<T>(): AsyncStorage<T> | null {
	const Ctor = loadAsyncLocalStorage()
	if (!Ctor) return null

	try {
		return new Ctor<T>()
	} catch {
		return null
	}
}
