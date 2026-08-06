import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { registerSpanProcessor, unregisterSpanProcessor } from 'vestig'
import type { SpanProcessor } from 'vestig'
import { registerVestig } from '../instrumentation/register'

/**
 * Console auto-instrumentation replaces console.error with a wrapper that
 * creates a span. Ending a span runs the span processors, and everything in
 * that path reports failures through console.error — so without a guard, one
 * application error re-enters the wrapper, creates another span, fails again,
 * and never stops.
 *
 * On a serverless platform that is not a noisy log: the function never
 * finishes, the request hangs, and the runtime kills it at its timeout. It
 * reached production, so it gets a test that would have caught it.
 */
describe('console instrumentation loop', () => {
	let originalError: typeof console.error
	let restore: (() => void) | null = null
	let failing: SpanProcessor

	beforeEach(() => {
		originalError = console.error
	})

	afterEach(() => {
		restore?.()
		restore = null
		console.error = originalError
		if (failing) unregisterSpanProcessor(failing)
	})

	test('a failing span processor does not feed itself through console.error', () => {
		let onEndCalls = 0

		failing = {
			onEnd() {
				onEndCalls++
				// Exactly what a broken exporter does in an environment where the
				// collector is unreachable.
				throw new Error('processor down')
			},
		}
		registerSpanProcessor(failing)

		const result = registerVestig({
			serviceName: 'loop-test',
			autoInstrument: { console: true, fetch: false },
		})
		restore = () => {
			void result.shutdown()
		}

		let consoleErrorCalls = 0
		const patched = console.error
		console.error = (...args: unknown[]) => {
			consoleErrorCalls++
			// A runaway loop would blow the stack or hang the test; stop counting
			// well before that and assert on the number instead.
			if (consoleErrorCalls > 50) return
			patched.apply(console, args)
		}

		console.error('render failed')

		expect(consoleErrorCalls).toBeLessThanOrEqual(2)
		expect(onEndCalls).toBeLessThanOrEqual(2)
	})

	test('the wrapper still records the error it was given', () => {
		const seen: string[] = []
		failing = {
			onEnd(span) {
				seen.push(span.name)
			},
		}
		registerSpanProcessor(failing)

		const result = registerVestig({
			serviceName: 'loop-test',
			autoInstrument: { console: true, fetch: false },
		})
		restore = () => {
			void result.shutdown()
		}

		console.error('something broke')

		expect(seen).toContain('console.error')
	})

	test('an unserialisable argument does not throw', () => {
		const circular: Record<string, unknown> = {}
		circular.self = circular

		const result = registerVestig({
			serviceName: 'loop-test',
			autoInstrument: { console: true, fetch: false },
		})
		restore = () => {
			void result.shutdown()
		}

		expect(() => console.error('circular:', circular)).not.toThrow()
	})

	test('restoring puts the original console.error back', () => {
		const before = console.error

		const result = registerVestig({
			serviceName: 'loop-test',
			autoInstrument: { console: true, fetch: false },
		})
		expect(console.error).not.toBe(before)

		void result.shutdown()
		restore = null

		expect(console.error).toBe(before)
	})
})
