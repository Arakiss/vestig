/**
 * Error Fingerprinting
 *
 * Generates unique fingerprints for errors to group similar errors together.
 * Useful for error aggregation in monitoring systems.
 *
 * @packageDocumentation
 */

import type { FingerprintOptions, StackFrame } from './types'

/**
 * Simple hash function for strings
 * Uses djb2 algorithm for fast, consistent hashing
 */
function hashString(str: string): string {
	let hash = 5381
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i)
	}
	return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Normalize a file path for consistent fingerprinting
 * Removes dynamic parts like hashes, timestamps, query strings
 */
function normalizeFilePath(path: string): string {
	return (
		path
			// Remove webpack chunk hashes
			.replace(/\.[a-f0-9]{8,}\./, '.')
			// Remove query strings
			.replace(/\?.*$/, '')
			// Remove line/column from paths
			.replace(/:\d+:\d+$/, '')
			// Normalize slashes
			.replace(/\\/g, '/')
			// Remove absolute path prefixes
			.replace(/^.*\/node_modules\//, 'node_modules/')
			.replace(/^.*\/(src|app|pages|components)\//, '$1/')
	)
}

/**
 * Normalize function name for consistent fingerprinting
 */
function normalizeFunctionName(name: string | undefined): string {
	if (!name) return '<anonymous>'

	return (
		name
			// Remove React component wrappers
			.replace(/^(Object\.)?/, '')
			// Remove module prefixes
			.replace(/^exports\./, '')
			// Remove async prefixes
			.replace(/^async /, '')
	)
}

/**
 * Extract key parts from an error message
 * Removes dynamic values like IDs, timestamps, etc.
 */
function normalizeErrorMessage(message: string): string {
	return (
		message
			// Remove UUIDs
			.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
			// Remove numbers that look like IDs
			.replace(/\b\d{5,}\b/g, '<ID>')
			// Remove URLs
			.replace(/https?:\/\/[^\s]+/g, '<URL>')
			// Remove file paths
			.replace(/\/[^\s:]+\.(js|ts|tsx|jsx)/g, '<FILE>')
			// Remove quoted strings (might be dynamic)
			.replace(/"[^"]{20,}"/g, '"<STRING>"')
			.replace(/'[^']{20,}'/g, "'<STRING>'")
			// Trim whitespace
			.trim()
	)
}

/**
 * Generate a fingerprint for an error
 *
 * The fingerprint is designed to group similar errors together while
 * distinguishing between genuinely different errors.
 *
 * @param error - The error to fingerprint
 * @param frames - Parsed stack frames
 * @param options - Fingerprinting options
 * @returns A hex string fingerprint
 *
 * @example
 * ```ts
 * const fingerprint = generateFingerprint(error, frames)
 * // 'a1b2c3d4e5f6g7h8'
 * ```
 */
export function generateFingerprint(
	error: Error,
	frames: StackFrame[],
	options: FingerprintOptions = {},
): string {
	const { includeFilePaths = true, includeLineNumbers = false, maxFrames = 5 } = options

	const parts: string[] = []

	// 1. Error type/name
	parts.push(error.name || 'Error')

	// 2. Normalized error message
	parts.push(normalizeErrorMessage(error.message))

	// 3. Stack frames (focus on app code)
	const appFrames = frames.filter((f) => f.isAppCode).slice(0, maxFrames)

	// If no app frames, use first few frames
	const relevantFrames = appFrames.length > 0 ? appFrames : frames.slice(0, maxFrames)

	for (const frame of relevantFrames) {
		const frameParts: string[] = []

		// Function name is most stable
		frameParts.push(normalizeFunctionName(frame.functionName))

		// File path (optional)
		if (includeFilePaths && frame.fileName) {
			frameParts.push(normalizeFilePath(frame.fileName))
		}

		// Line number (optional - less stable across builds)
		if (includeLineNumbers && frame.lineNumber) {
			frameParts.push(String(frame.lineNumber))
		}

		parts.push(frameParts.join(':'))
	}

	// Generate hash from combined parts
	return hashString(parts.join('|'))
}

/**
 * Check if two errors have the same fingerprint
 */
export function isSameError(
	error1: { fingerprint: string },
	error2: { fingerprint: string },
): boolean {
	return error1.fingerprint === error2.fingerprint
}

/**
 * Group errors by fingerprint
 */
export function groupErrors<T extends { fingerprint: string }>(errors: T[]): Map<string, T[]> {
	const groups = new Map<string, T[]>()

	for (const error of errors) {
		const existing = groups.get(error.fingerprint) ?? []
		existing.push(error)
		groups.set(error.fingerprint, existing)
	}

	return groups
}
