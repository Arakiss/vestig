import { describe, expect, test } from 'bun:test'
import { LOG_LEVELS, parseLogLevel, shouldLog } from '../levels'

describe('LOG_LEVELS', () => {
	test('should have correct priority order', () => {
		expect(LOG_LEVELS.trace).toBeLessThan(LOG_LEVELS.debug)
		expect(LOG_LEVELS.debug).toBeLessThan(LOG_LEVELS.info)
		expect(LOG_LEVELS.info).toBeLessThan(LOG_LEVELS.warn)
		expect(LOG_LEVELS.warn).toBeLessThan(LOG_LEVELS.error)
	})

	test('should contain all log levels', () => {
		expect(LOG_LEVELS).toHaveProperty('trace')
		expect(LOG_LEVELS).toHaveProperty('debug')
		expect(LOG_LEVELS).toHaveProperty('info')
		expect(LOG_LEVELS).toHaveProperty('warn')
		expect(LOG_LEVELS).toHaveProperty('error')
	})

	test('should have numeric values', () => {
		expect(typeof LOG_LEVELS.trace).toBe('number')
		expect(typeof LOG_LEVELS.debug).toBe('number')
		expect(typeof LOG_LEVELS.info).toBe('number')
		expect(typeof LOG_LEVELS.warn).toBe('number')
		expect(typeof LOG_LEVELS.error).toBe('number')
	})
})

describe('shouldLog', () => {
	test('should return true when level equals minLevel', () => {
		expect(shouldLog('trace', 'trace')).toBe(true)
		expect(shouldLog('debug', 'debug')).toBe(true)
		expect(shouldLog('info', 'info')).toBe(true)
		expect(shouldLog('warn', 'warn')).toBe(true)
		expect(shouldLog('error', 'error')).toBe(true)
	})

	test('should return true when level is higher than minLevel', () => {
		expect(shouldLog('error', 'trace')).toBe(true)
		expect(shouldLog('warn', 'debug')).toBe(true)
		expect(shouldLog('info', 'trace')).toBe(true)
	})

	test('should return false when level is lower than minLevel', () => {
		expect(shouldLog('trace', 'debug')).toBe(false)
		expect(shouldLog('debug', 'info')).toBe(false)
		expect(shouldLog('info', 'warn')).toBe(false)
		expect(shouldLog('warn', 'error')).toBe(false)
	})

	test('should handle trace as minimum level', () => {
		expect(shouldLog('trace', 'trace')).toBe(true)
		expect(shouldLog('debug', 'trace')).toBe(true)
		expect(shouldLog('info', 'trace')).toBe(true)
		expect(shouldLog('warn', 'trace')).toBe(true)
		expect(shouldLog('error', 'trace')).toBe(true)
	})

	test('should handle error as minimum level', () => {
		expect(shouldLog('trace', 'error')).toBe(false)
		expect(shouldLog('debug', 'error')).toBe(false)
		expect(shouldLog('info', 'error')).toBe(false)
		expect(shouldLog('warn', 'error')).toBe(false)
		expect(shouldLog('error', 'error')).toBe(true)
	})
})

describe('parseLogLevel', () => {
	test('should parse valid log levels', () => {
		expect(parseLogLevel('trace', 'info')).toBe('trace')
		expect(parseLogLevel('debug', 'info')).toBe('debug')
		expect(parseLogLevel('info', 'warn')).toBe('info')
		expect(parseLogLevel('warn', 'info')).toBe('warn')
		expect(parseLogLevel('error', 'info')).toBe('error')
	})

	test('should be case-insensitive', () => {
		expect(parseLogLevel('TRACE', 'info')).toBe('trace')
		expect(parseLogLevel('DEBUG', 'info')).toBe('debug')
		expect(parseLogLevel('INFO', 'warn')).toBe('info')
		expect(parseLogLevel('WARN', 'info')).toBe('warn')
		expect(parseLogLevel('ERROR', 'info')).toBe('error')
	})

	test('should handle mixed case', () => {
		expect(parseLogLevel('TrAcE', 'info')).toBe('trace')
		expect(parseLogLevel('DeBuG', 'info')).toBe('debug')
		expect(parseLogLevel('InFo', 'warn')).toBe('info')
	})

	test('should return fallback for undefined', () => {
		expect(parseLogLevel(undefined, 'info')).toBe('info')
		expect(parseLogLevel(undefined, 'warn')).toBe('warn')
		expect(parseLogLevel(undefined, 'error')).toBe('error')
	})

	test('should return fallback for empty string', () => {
		expect(parseLogLevel('', 'info')).toBe('info')
		expect(parseLogLevel('', 'debug')).toBe('debug')
	})

	test('should return fallback for invalid values', () => {
		expect(parseLogLevel('invalid', 'info')).toBe('info')
		expect(parseLogLevel('verbose', 'warn')).toBe('warn')
		expect(parseLogLevel('critical', 'error')).toBe('error')
		expect(parseLogLevel('123', 'info')).toBe('info')
	})
})
