import type { SerializedError } from '../types'

/**
 * Maximum depth for error cause chain traversal
 */
const MAX_DEPTH = 10

/**
 * Properties to extract from error objects
 */
const ERROR_PROPERTIES = [
	'code',
	'statusCode',
	'status',
	'errno',
	'syscall',
	'path',
	'address',
	'port',
] as const

/**
 * Check if a value is an Error or error-like object
 */
export function isError(value: unknown): value is Error {
	return (
		value instanceof Error ||
		(typeof value === 'object' &&
			value !== null &&
			'message' in value &&
			typeof (value as Record<string, unknown>).message === 'string')
	)
}

/**
 * Serialize an error object with cause chain support
 */
export function serializeError(error: unknown, depth = 0): SerializedError | undefined {
	if (depth > MAX_DEPTH) return undefined
	if (!error) return undefined

	// Handle Error instances
	if (error instanceof Error) {
		const serialized: SerializedError = {
			name: error.name,
			message: error.message,
			stack: error.stack,
		}

		// Extract additional properties
		const errorObj = error as unknown as Record<string, unknown>
		for (const prop of ERROR_PROPERTIES) {
			const value = errorObj[prop]
			if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
				serialized[prop] = value
			}
		}

		// Handle cause chain (ES2022)
		if ('cause' in error && error.cause) {
			serialized.cause = serializeError(error.cause, depth + 1)
		}

		return serialized
	}

	// Handle error-like objects
	if (typeof error === 'object' && error !== null) {
		const obj = error as Record<string, unknown>
		if (typeof obj.message === 'string') {
			return {
				name: (obj.name as string) ?? 'Error',
				message: obj.message,
				stack: obj.stack as string | undefined,
			}
		}
	}

	// Handle strings
	if (typeof error === 'string') {
		return {
			name: 'Error',
			message: error,
		}
	}

	return undefined
}

/**
 * Extract error message from any value
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message
	if (typeof error === 'string') return error
	if (typeof error === 'object' && error !== null) {
		const obj = error as Record<string, unknown>
		if (typeof obj.message === 'string') return obj.message
	}
	return String(error)
}
