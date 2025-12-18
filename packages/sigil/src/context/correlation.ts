/**
 * Generate a random hex string of specified length
 */
function randomHex(length: number): string {
	const bytes = new Uint8Array(length / 2)
	crypto.getRandomValues(bytes)
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

/**
 * Generate a trace ID (32 hex characters / 128 bits)
 */
export function generateTraceId(): string {
	return randomHex(32)
}

/**
 * Generate a span ID (16 hex characters / 64 bits)
 */
export function generateSpanId(): string {
	return randomHex(16)
}

/**
 * Generate a request ID (UUID v4 format)
 */
export function generateRequestId(): string {
	return crypto.randomUUID()
}

/**
 * Parse W3C Trace Context traceparent header
 * Format: {version}-{trace-id}-{parent-id}-{trace-flags}
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 */
export function parseTraceparent(header: string): {
	traceId: string
	spanId: string
} | null {
	const parts = header.split('-')
	if (parts.length !== 4) return null
	const [version, traceId, spanId] = parts
	if (version !== '00') return null
	if (!traceId || traceId.length !== 32) return null
	if (!spanId || spanId.length !== 16) return null
	return { traceId, spanId }
}

/**
 * Create W3C Trace Context traceparent header
 */
export function createTraceparent(traceId: string, spanId: string): string {
	return `00-${traceId}-${spanId}-01`
}
