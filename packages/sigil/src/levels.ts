import type { LogLevel } from './types'

/**
 * Log level priorities (lower = more verbose)
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
}

/**
 * Check if a log level should be output given the minimum level
 */
export function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

/**
 * Parse a log level string, with fallback
 */
export function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
	if (!value) return fallback
	const lower = value.toLowerCase()
	if (lower in LOG_LEVELS) return lower as LogLevel
	return fallback
}
