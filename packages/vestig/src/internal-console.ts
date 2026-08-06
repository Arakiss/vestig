/**
 * Internal diagnostics console
 * ============================
 *
 * vestig writes its own output — a log line through the console transport, a
 * transport that failed, a span processor that threw — with `console.*`. That
 * is fine until vestig's own console auto-instrumentation replaces
 * `console.error` with a wrapper that creates a span for every error it sees.
 *
 * Then it closes a loop: a span processor fails → vestig reports it with
 * console.error → the wrapper creates a span → the span ends → the processor
 * fails again. A single application error becomes an unbounded loop that never
 * yields, which on a serverless platform reads as a request hanging until the
 * runtime kills it. That is a real incident, not a theoretical one.
 *
 * The fix is narrow on purpose: vestig steps around *its own* wrapper and
 * nothing else. Anyone else who wraps the console — a test spy, another
 * observability tool, a framework — still receives everything vestig writes,
 * which is what they asked for by wrapping it.
 */

type ConsoleMethod = (...args: unknown[]) => void

/** Console methods vestig writes through. */
export type InternalConsoleMethod = 'error' | 'warn' | 'info' | 'log' | 'debug'

/**
 * Marker that console auto-instrumentation puts on the function it installs,
 * carrying the method it replaced.
 *
 * `Symbol.for` so that it survives across duplicated copies of the package,
 * which are exactly the situation where the loop is worst.
 */
export const CONSOLE_PATCH_MARKER = Symbol.for('vestig.console.patch')

/**
 * A console function installed by vestig, carrying the one it replaced.
 */
export interface PatchedConsoleMethod extends ConsoleMethod {
	[CONSOLE_PATCH_MARKER]?: { original: ConsoleMethod }
}

const noop: ConsoleMethod = () => {}

/**
 * Resolve a console method, unwrapping vestig's own instrumentation.
 *
 * Read at call time so that a test spy or another tool's wrapper still sees
 * vestig's output; only vestig's own wrapper is stepped over, and only as far
 * as the function it replaced.
 */
function resolve(name: InternalConsoleMethod): ConsoleMethod {
	try {
		if (typeof console === 'undefined') return noop

		const current = console[name] as PatchedConsoleMethod | undefined
		if (typeof current !== 'function') return noop

		const patch = current[CONSOLE_PATCH_MARKER]
		if (patch && typeof patch.original === 'function') return patch.original

		return current
	} catch {
		return noop
	}
}

/**
 * Mark a console replacement as vestig's own, recording what it replaced.
 *
 * Anything installed through this is invisible to vestig's internal writes,
 * which is what keeps the instrumentation from feeding itself.
 */
export function markConsolePatch(
	replacement: ConsoleMethod,
	original: ConsoleMethod,
): PatchedConsoleMethod {
	const marked = replacement as PatchedConsoleMethod
	marked[CONSOLE_PATCH_MARKER] = { original }
	return marked
}

/**
 * The console vestig writes its own output through.
 *
 * Use this everywhere instead of the global `console` in code that can run
 * inside the logging, span or transport lifecycle.
 */
export const internalConsole: Record<InternalConsoleMethod, ConsoleMethod> = {
	error: (...args) => resolve('error')(...args),
	warn: (...args) => resolve('warn')(...args),
	info: (...args) => resolve('info')(...args),
	log: (...args) => resolve('log')(...args),
	debug: (...args) => resolve('debug')(...args),
}
