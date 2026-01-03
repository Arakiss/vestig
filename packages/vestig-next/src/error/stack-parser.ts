/**
 * Stack Trace Parser
 *
 * Parses JavaScript error stack traces into structured frames.
 * Supports Chrome, Firefox, Safari, and Edge stack trace formats.
 *
 * @packageDocumentation
 */

import type { StackFrame } from './types'

/**
 * Regex patterns for different browser stack trace formats
 */
const CHROME_STACK_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
const FIREFOX_STACK_REGEX = /^(?:(.+)@)?(.+?):(\d+):(\d+)$/
const SAFARI_STACK_REGEX = /^(?:(.+)@)?(.+?):(\d+):(\d+)$/

/**
 * Check if a file path is from node_modules
 */
function isNodeModulePath(path: string): boolean {
	return path.includes('node_modules') || path.includes('node:')
}

/**
 * Check if a file path is from app source code
 */
function isAppCodePath(path: string): boolean {
	// Not from node_modules
	if (isNodeModulePath(path)) return false

	// Common app directories
	const appPatterns = ['/src/', '/app/', '/pages/', '/components/', '/lib/', '/utils/', '/hooks/']
	return appPatterns.some((pattern) => path.includes(pattern))
}

/**
 * Parse a single stack frame line
 */
function parseStackLine(line: string): StackFrame | null {
	const trimmedLine = line.trim()
	if (!trimmedLine || trimmedLine === 'Error') return null

	// Try Chrome format first (most common)
	let match = CHROME_STACK_REGEX.exec(trimmedLine)
	if (match) {
		const [, functionName, fileName, lineNumber, columnNumber] = match
		return {
			functionName: functionName?.trim(),
			fileName: fileName,
			lineNumber: Number.parseInt(lineNumber ?? '0', 10),
			columnNumber: Number.parseInt(columnNumber ?? '0', 10),
			isNodeModule: isNodeModulePath(fileName ?? ''),
			isAppCode: isAppCodePath(fileName ?? ''),
		}
	}

	// Try Firefox/Safari format
	match = FIREFOX_STACK_REGEX.exec(trimmedLine)
	if (match) {
		const [, functionName, fileName, lineNumber, columnNumber] = match
		return {
			functionName: functionName?.trim(),
			fileName: fileName,
			lineNumber: Number.parseInt(lineNumber ?? '0', 10),
			columnNumber: Number.parseInt(columnNumber ?? '0', 10),
			isNodeModule: isNodeModulePath(fileName ?? ''),
			isAppCode: isAppCodePath(fileName ?? ''),
		}
	}

	return null
}

/**
 * Parse an error stack trace into structured frames
 *
 * @param stack - The error.stack string
 * @returns Array of parsed stack frames
 *
 * @example
 * ```ts
 * try {
 *   throw new Error('Test')
 * } catch (e) {
 *   const frames = parseStackTrace(e.stack)
 *   // [{ functionName: 'test', fileName: '/app/src/test.ts', lineNumber: 5, ... }]
 * }
 * ```
 */
export function parseStackTrace(stack: string | undefined): StackFrame[] {
	if (!stack) return []

	const lines = stack.split('\n')
	const frames: StackFrame[] = []

	for (const line of lines) {
		const frame = parseStackLine(line)
		if (frame) {
			frames.push(frame)
		}
	}

	return frames
}

/**
 * Parse React component stack into readable format
 */
export function parseComponentStack(componentStack: string | undefined): string[] {
	if (!componentStack) return []

	const lines = componentStack.split('\n')
	const components: string[] = []

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed) continue

		// Extract component name from "at ComponentName (file:line:col)"
		const match = /^at\s+(\w+)/.exec(trimmed)
		if (match?.[1]) {
			components.push(match[1])
		} else if (trimmed.startsWith('in ')) {
			// Alternative format: "in ComponentName"
			const componentName = trimmed.slice(3).split(' ')[0]
			if (componentName) components.push(componentName)
		}
	}

	return components
}

/**
 * Get the most relevant stack frame (first app code frame)
 */
export function getMostRelevantFrame(frames: StackFrame[]): StackFrame | null {
	// First, try to find an app code frame
	const appFrame = frames.find((f) => f.isAppCode)
	if (appFrame) return appFrame

	// Fall back to first non-node_modules frame
	const nonModuleFrame = frames.find((f) => !f.isNodeModule)
	if (nonModuleFrame) return nonModuleFrame

	// Last resort: first frame
	return frames[0] ?? null
}

/**
 * Format a stack frame for display
 */
export function formatStackFrame(frame: StackFrame): string {
	const parts: string[] = []

	if (frame.functionName) {
		parts.push(frame.functionName)
	} else {
		parts.push('<anonymous>')
	}

	if (frame.fileName) {
		let location = frame.fileName
		if (frame.lineNumber) {
			location += `:${frame.lineNumber}`
			if (frame.columnNumber) {
				location += `:${frame.columnNumber}`
			}
		}
		parts.push(`(${location})`)
	}

	return parts.join(' ')
}

/**
 * Format entire stack trace for display
 */
export function formatStackTrace(frames: StackFrame[]): string {
	return frames.map((frame, i) => `  at ${formatStackFrame(frame)}`).join('\n')
}
