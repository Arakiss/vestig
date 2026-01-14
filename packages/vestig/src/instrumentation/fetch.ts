/**
 * Fetch Auto-Instrumentation
 *
 * Automatically creates spans for all fetch() calls.
 * Call once in your instrumentation.ts file.
 */

import { createTraceparent } from '../context/correlation'
import { getActiveSpan } from '../tracing/context'
import { span } from '../tracing/functions'
import type { FetchInstrumentationState, InstrumentFetchOptions } from './types'

/**
 * Global state for fetch instrumentation
 */
const state: FetchInstrumentationState = {
	isInstrumented: false,
	originalFetch: null,
	options: null,
}

/**
 * Default span name prefix
 */
const DEFAULT_SPAN_PREFIX = 'http.client'

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<
	Pick<
		InstrumentFetchOptions,
		| 'spanNamePrefix'
		| 'propagateContext'
		| 'captureRequestBody'
		| 'maxRequestBodyLength'
		| 'captureResponseBody'
		| 'maxResponseBodyLength'
	>
> = {
	spanNamePrefix: DEFAULT_SPAN_PREFIX,
	propagateContext: true,
	captureRequestBody: false,
	maxRequestBodyLength: 1024,
	captureResponseBody: false,
	maxResponseBodyLength: 1024,
}

/**
 * Check if a URL should be ignored
 */
function shouldIgnoreUrl(url: string, ignorePatterns: (string | RegExp)[] | undefined): boolean {
	if (!ignorePatterns || ignorePatterns.length === 0) return false

	for (const pattern of ignorePatterns) {
		if (typeof pattern === 'string') {
			if (url.includes(pattern)) return true
		} else if (pattern instanceof RegExp) {
			if (pattern.test(url)) return true
		}
	}
	return false
}

/**
 * Parse URL safely
 */
function parseUrl(input: RequestInfo | URL): URL | null {
	try {
		if (input instanceof URL) return input
		if (input instanceof Request) return new URL(input.url)
		return new URL(input, globalThis.location?.origin ?? 'http://localhost')
	} catch {
		return null
	}
}

/**
 * Generate span name
 */
function generateSpanName(method: string, url: URL, options: InstrumentFetchOptions): string {
	if (options.spanNameGenerator) {
		return options.spanNameGenerator(method, url)
	}

	const prefix = options.spanNamePrefix ?? DEFAULT_SPAN_PREFIX
	const host = url.hostname
	const path = url.pathname

	return `${prefix} ${method} ${host}${path}`
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str
	return `${str.slice(0, maxLength)}... (truncated)`
}

/**
 * Instrument fetch to automatically create spans
 *
 * Call this once in your instrumentation.ts file.
 * All subsequent fetch() calls will automatically create spans.
 *
 * @example
 * ```typescript
 * // instrumentation.ts
 * import { instrumentFetch } from 'vestig'
 *
 * export function register() {
 *   instrumentFetch({
 *     spanNamePrefix: 'http.client',
 *     captureHeaders: ['content-type', 'x-request-id'],
 *     ignoreUrls: ['/health', '/metrics', /^\/_next/],
 *   })
 * }
 * ```
 *
 * @example With all options
 * ```typescript
 * instrumentFetch({
 *   spanNamePrefix: 'fetch',
 *   captureHeaders: ['content-type'],
 *   ignoreUrls: [/health/, /metrics/],
 *   propagateContext: true,
 *   captureRequestBody: false,
 *   captureResponseBody: false,
 *   defaultAttributes: { 'app.name': 'my-app' },
 * })
 * ```
 */
export function instrumentFetch(options: InstrumentFetchOptions = {}): void {
	// Prevent double instrumentation
	if (state.isInstrumented) {
		console.warn('[vestig] fetch is already instrumented')
		return
	}

	// Check if fetch exists
	if (typeof globalThis.fetch !== 'function') {
		console.warn('[vestig] fetch is not available in this environment')
		return
	}

	// Store original fetch
	state.originalFetch = globalThis.fetch
	state.options = options

	// Merge options with defaults
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	// Create instrumented fetch
	const instrumentedFetch = async (
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> => {
		const originalFetch = state.originalFetch!

		// Parse URL
		const url = parseUrl(input)
		if (!url) {
			// Can't parse URL, just call original
			return originalFetch(input, init)
		}

		// Check if URL should be ignored
		const fullUrl = url.toString()
		if (shouldIgnoreUrl(fullUrl, options.ignoreUrls)) {
			return originalFetch(input, init)
		}

		// Determine method
		const method = init?.method ?? (input instanceof Request ? input.method : 'GET')

		// Generate span name
		const spanName = generateSpanName(method.toUpperCase(), url, mergedOptions)

		// Execute fetch within span
		return span(spanName, async (s) => {
			// Set HTTP attributes (following OpenTelemetry semantic conventions)
			s.setAttribute('http.request.method', method.toUpperCase())
			s.setAttribute('url.full', fullUrl)
			s.setAttribute('url.scheme', url.protocol.replace(':', ''))
			s.setAttribute('server.address', url.hostname)
			if (url.port) {
				s.setAttribute('server.port', Number.parseInt(url.port, 10))
			}
			s.setAttribute('url.path', url.pathname)
			if (url.search) {
				s.setAttribute('url.query', url.search.slice(1))
			}

			// Add default attributes
			if (options.defaultAttributes) {
				for (const [key, value] of Object.entries(options.defaultAttributes)) {
					s.setAttribute(key, value)
				}
			}

			// Prepare headers
			const headers = new Headers(init?.headers)

			// Capture request headers
			if (options.captureHeaders) {
				for (const headerName of options.captureHeaders) {
					const value = headers.get(headerName)
					if (value) {
						s.setAttribute(`http.request.header.${headerName.toLowerCase()}`, value)
					}
				}
			}

			// Propagate trace context
			if (mergedOptions.propagateContext) {
				const activeSpan = getActiveSpan()
				if (activeSpan) {
					const traceparent = createTraceparent(activeSpan.traceId, s.spanId)
					headers.set('traceparent', traceparent)
				}
			}

			// Capture request body
			if (mergedOptions.captureRequestBody && init?.body) {
				try {
					const bodyStr = typeof init.body === 'string' ? init.body : JSON.stringify(init.body)
					s.setAttribute('http.request.body', truncate(bodyStr, mergedOptions.maxRequestBodyLength))
				} catch {
					// Ignore body capture errors
				}
			}

			// Make the request
			const startTime = performance.now()

			try {
				const response = await originalFetch(input, {
					...init,
					headers,
				})

				// Set response attributes
				const duration = performance.now() - startTime
				s.setAttribute('http.response.status_code', response.status)
				s.setAttribute('http.response.duration_ms', Math.round(duration))

				// Capture response headers
				if (options.captureHeaders) {
					for (const headerName of options.captureHeaders) {
						const value = response.headers.get(headerName)
						if (value) {
							s.setAttribute(`http.response.header.${headerName.toLowerCase()}`, value)
						}
					}
				}

				// Set status based on response
				if (response.ok) {
					s.setStatus('ok')
				} else {
					s.setStatus('error', `HTTP ${response.status}`)
				}

				// Capture response body (need to clone to avoid consuming)
				if (mergedOptions.captureResponseBody) {
					try {
						const cloned = response.clone()
						const text = await cloned.text()
						s.setAttribute(
							'http.response.body',
							truncate(text, mergedOptions.maxResponseBodyLength),
						)
					} catch {
						// Ignore body capture errors
					}
				}

				return response
			} catch (error) {
				// Network or other error
				const duration = performance.now() - startTime
				s.setAttribute('http.response.duration_ms', Math.round(duration))
				s.setAttribute('error.type', error instanceof Error ? error.name : 'Error')
				s.setStatus('error', error instanceof Error ? error.message : String(error))
				throw error
			}
		})
	}

	// Replace global fetch
	globalThis.fetch = instrumentedFetch

	state.isInstrumented = true
}

/**
 * Restore original fetch (for testing)
 *
 * @example
 * ```typescript
 * import { instrumentFetch, uninstrumentFetch } from 'vestig'
 *
 * instrumentFetch()
 * // ... fetch calls are instrumented
 *
 * uninstrumentFetch()
 * // ... fetch is back to normal
 * ```
 */
export function uninstrumentFetch(): void {
	if (!state.isInstrumented || !state.originalFetch) {
		return
	}

	globalThis.fetch = state.originalFetch
	state.isInstrumented = false
	state.originalFetch = null
	state.options = null
}

/**
 * Check if fetch is instrumented
 */
export function isFetchInstrumented(): boolean {
	return state.isInstrumented
}
