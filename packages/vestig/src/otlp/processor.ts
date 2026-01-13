/**
 * Span Processor for vestig
 *
 * Provides a mechanism to process spans when they end, enabling
 * export to external systems like OTLP-compatible backends.
 */

import type { Span } from '../tracing/types'

/**
 * Interface for processing spans
 *
 * SpanProcessors are notified when spans start and end,
 * allowing them to batch and export span data.
 */
export interface SpanProcessor {
	/**
	 * Called when a span starts
	 * @param span - The span that started
	 */
	onStart?(span: Span): void

	/**
	 * Called when a span ends
	 * @param span - The span that ended
	 */
	onEnd(span: Span): void

	/**
	 * Force flush any buffered spans
	 */
	forceFlush?(): Promise<void>

	/**
	 * Shutdown the processor
	 */
	shutdown?(): Promise<void>
}

/**
 * Global registry of span processors
 */
class SpanProcessorRegistry {
	private processors: SpanProcessor[] = []

	/**
	 * Register a span processor
	 */
	addProcessor(processor: SpanProcessor): void {
		this.processors.push(processor)
	}

	/**
	 * Remove a span processor
	 */
	removeProcessor(processor: SpanProcessor): boolean {
		const index = this.processors.indexOf(processor)
		if (index === -1) return false
		this.processors.splice(index, 1)
		return true
	}

	/**
	 * Get all registered processors
	 */
	getProcessors(): readonly SpanProcessor[] {
		return this.processors
	}

	/**
	 * Clear all processors
	 */
	clearProcessors(): void {
		this.processors = []
	}

	/**
	 * Notify all processors that a span started
	 */
	notifyStart(span: Span): void {
		for (const processor of this.processors) {
			try {
				processor.onStart?.(span)
			} catch (err) {
				console.error('[vestig] SpanProcessor.onStart error:', err)
			}
		}
	}

	/**
	 * Notify all processors that a span ended
	 */
	notifyEnd(span: Span): void {
		for (const processor of this.processors) {
			try {
				processor.onEnd(span)
			} catch (err) {
				console.error('[vestig] SpanProcessor.onEnd error:', err)
			}
		}
	}

	/**
	 * Force flush all processors
	 */
	async forceFlush(): Promise<void> {
		await Promise.all(
			this.processors.map((p) =>
				p.forceFlush?.().catch((err) => {
					console.error('[vestig] SpanProcessor.forceFlush error:', err)
				}),
			),
		)
	}

	/**
	 * Shutdown all processors
	 */
	async shutdown(): Promise<void> {
		await Promise.all(
			this.processors.map((p) =>
				p.shutdown?.().catch((err) => {
					console.error('[vestig] SpanProcessor.shutdown error:', err)
				}),
			),
		)
		this.processors = []
	}
}

/**
 * Global span processor registry singleton
 */
export const spanProcessors = new SpanProcessorRegistry()

/**
 * Register a span processor globally
 *
 * @example
 * ```typescript
 * import { registerSpanProcessor } from 'vestig'
 * import { OTLPExporter } from 'vestig/otlp'
 *
 * const exporter = new OTLPExporter({
 *   endpoint: 'https://otel.example.com/v1/traces',
 *   serviceName: 'my-service',
 * })
 *
 * registerSpanProcessor(exporter)
 * ```
 */
export function registerSpanProcessor(processor: SpanProcessor): void {
	spanProcessors.addProcessor(processor)
}

/**
 * Unregister a span processor
 */
export function unregisterSpanProcessor(processor: SpanProcessor): boolean {
	return spanProcessors.removeProcessor(processor)
}

/**
 * Get all registered span processors
 */
export function getSpanProcessors(): readonly SpanProcessor[] {
	return spanProcessors.getProcessors()
}

/**
 * Force flush all span processors
 */
export function flushSpanProcessors(): Promise<void> {
	return spanProcessors.forceFlush()
}

/**
 * Shutdown all span processors
 */
export function shutdownSpanProcessors(): Promise<void> {
	return spanProcessors.shutdown()
}
