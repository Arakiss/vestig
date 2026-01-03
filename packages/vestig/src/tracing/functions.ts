import { getActiveSpan, popSpan, pushSpan, withSpanContext, withSpanContextAsync } from './context'
import { SpanImpl } from './span'
import type { Span, SpanCallback, SpanOptions, SpanSyncCallback } from './types'

// Re-export for convenience
export { getActiveSpan } from './context'

/**
 * Create and run a span for an async operation
 *
 * This is the recommended way to create spans. It automatically:
 * - Creates a new span with proper parent/child relationship
 * - Sets status to 'ok' on success or 'error' on exception
 * - Ends the span when the operation completes
 * - Propagates trace context to nested operations
 *
 * @param name - Human-readable name for the operation
 * @param fn - Async function to execute within the span
 * @param options - Optional span configuration
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = await span('checkout', async (s) => {
 *   s.setAttribute('userId', user.id)
 *   s.setAttribute('cartItems', cart.length)
 *
 *   s.addEvent('validating-cart')
 *   await validateCart(cart)
 *
 *   s.addEvent('processing-payment')
 *   const payment = await processPayment(cart.total)
 *
 *   return { orderId: payment.orderId }
 * })
 * ```
 */
export async function span<T>(
	name: string,
	fn: SpanCallback<T>,
	options?: SpanOptions,
): Promise<T> {
	const s = new SpanImpl(name, options)

	return withSpanContextAsync(s, async () => {
		try {
			const result = await fn(s)
			// Only set status to 'ok' if it wasn't explicitly set
			if (s.status === 'unset') {
				s.setStatus('ok')
			}
			return result
		} catch (error) {
			s.setStatus('error', error instanceof Error ? error.message : String(error))
			throw error
		} finally {
			s.end()
		}
	})
}

/**
 * Create and run a span for a synchronous operation
 *
 * Similar to `span()` but for synchronous code.
 *
 * @param name - Human-readable name for the operation
 * @param fn - Synchronous function to execute within the span
 * @param options - Optional span configuration
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const parsed = spanSync('parse-config', (s) => {
 *   s.setAttribute('configPath', path)
 *   return JSON.parse(configContent)
 * })
 * ```
 */
export function spanSync<T>(name: string, fn: SpanSyncCallback<T>, options?: SpanOptions): T {
	const s = new SpanImpl(name, options)

	return withSpanContext(s, () => {
		try {
			const result = fn(s)
			if (s.status === 'unset') {
				s.setStatus('ok')
			}
			return result
		} catch (error) {
			s.setStatus('error', error instanceof Error ? error.message : String(error))
			throw error
		} finally {
			s.end()
		}
	})
}

/**
 * Manually start a new span
 *
 * Use this for cases where you need more control over span lifecycle.
 * Remember to call `endSpan()` when done!
 *
 * For most cases, prefer using `span()` which handles the lifecycle automatically.
 *
 * @param name - Human-readable name for the operation
 * @param options - Optional span configuration
 * @returns The created span
 *
 * @example
 * ```typescript
 * const s = startSpan('long-operation')
 * try {
 *   s.setAttribute('phase', 'init')
 *   await initialize()
 *
 *   s.setAttribute('phase', 'process')
 *   await process()
 *
 *   s.setStatus('ok')
 * } catch (error) {
 *   s.setStatus('error', error.message)
 *   throw error
 * } finally {
 *   endSpan(s)
 * }
 * ```
 */
export function startSpan(name: string, options?: SpanOptions): Span {
	const s = new SpanImpl(name, options)
	pushSpan(s)
	return s
}

/**
 * End a manually started span
 *
 * This ends the span and removes it from the active span stack.
 * Should be called in a finally block to ensure cleanup.
 *
 * @param span - The span to end
 */
export function endSpan(spanToEnd: Span): void {
	spanToEnd.end()
	popSpan()
}

/**
 * Execute a function if there's an active span
 *
 * Convenience function to safely interact with the current span
 * without having to check for undefined.
 *
 * @param fn - Function to execute with the active span
 *
 * @example
 * ```typescript
 * // Add an event to the current span if one exists
 * withActiveSpan(span => {
 *   span.addEvent('database-query', { query: 'SELECT...' })
 * })
 * ```
 */
export function withActiveSpan(fn: (span: Span) => void): void {
	const active = getActiveSpan()
	if (active) {
		fn(active)
	}
}
