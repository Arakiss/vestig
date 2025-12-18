import { describe, expect, test } from 'bun:test'
import {
	CAPABILITIES,
	CircularBuffer,
	// Transports
	ConsoleTransport,
	ENV_VARS,
	IS_BROWSER,
	IS_BUN,
	IS_EDGE,
	IS_NODE,
	IS_SERVER,
	IS_WORKER,
	// Levels
	LOG_LEVELS,
	LoggerImpl,
	// Runtime
	RUNTIME,
	createCorrelationContext,
	// Core exports
	createLogger,
	createSanitizer,
	createTraceparent,
	generateRequestId,
	generateSpanId,
	generateTraceId,
	// Context
	getContext,
	// Config
	getDefaultConfig,
	getErrorMessage,
	isError,
	// Default logger
	log,
	mergeConfig,
	parseLogLevel,
	parseTraceparent,
	sanitize,
	// Utilities
	serializeError,
	shouldLog,
	withContext,
	withContextAsync,
} from '../index'

describe('index exports', () => {
	describe('core exports', () => {
		test('should export createLogger', () => {
			expect(typeof createLogger).toBe('function')
		})

		test('should export LoggerImpl', () => {
			expect(typeof LoggerImpl).toBe('function')
		})

		test('should export default log instance', () => {
			expect(log).toBeDefined()
			expect(typeof log.info).toBe('function')
		})
	})

	describe('runtime exports', () => {
		test('should export RUNTIME', () => {
			expect(RUNTIME).toBeDefined()
		})

		test('should export CAPABILITIES', () => {
			expect(CAPABILITIES).toBeDefined()
		})

		test('should export runtime flags', () => {
			expect(typeof IS_NODE).toBe('boolean')
			expect(typeof IS_BUN).toBe('boolean')
			expect(typeof IS_EDGE).toBe('boolean')
			expect(typeof IS_BROWSER).toBe('boolean')
			expect(typeof IS_WORKER).toBe('boolean')
			expect(typeof IS_SERVER).toBe('boolean')
		})
	})

	describe('levels exports', () => {
		test('should export LOG_LEVELS', () => {
			expect(LOG_LEVELS).toBeDefined()
		})

		test('should export shouldLog', () => {
			expect(typeof shouldLog).toBe('function')
		})

		test('should export parseLogLevel', () => {
			expect(typeof parseLogLevel).toBe('function')
		})
	})

	describe('config exports', () => {
		test('should export getDefaultConfig', () => {
			expect(typeof getDefaultConfig).toBe('function')
		})

		test('should export mergeConfig', () => {
			expect(typeof mergeConfig).toBe('function')
		})

		test('should export ENV_VARS', () => {
			expect(ENV_VARS).toBeDefined()
		})
	})

	describe('context exports', () => {
		test('should export getContext', () => {
			expect(typeof getContext).toBe('function')
		})

		test('should export withContext', () => {
			expect(typeof withContext).toBe('function')
		})

		test('should export withContextAsync', () => {
			expect(typeof withContextAsync).toBe('function')
		})

		test('should export createCorrelationContext', () => {
			expect(typeof createCorrelationContext).toBe('function')
		})

		test('should export ID generators', () => {
			expect(typeof generateRequestId).toBe('function')
			expect(typeof generateTraceId).toBe('function')
			expect(typeof generateSpanId).toBe('function')
		})

		test('should export traceparent functions', () => {
			expect(typeof parseTraceparent).toBe('function')
			expect(typeof createTraceparent).toBe('function')
		})
	})

	describe('utility exports', () => {
		test('should export error utilities', () => {
			expect(typeof serializeError).toBe('function')
			expect(typeof isError).toBe('function')
			expect(typeof getErrorMessage).toBe('function')
		})

		test('should export sanitize utilities', () => {
			expect(typeof sanitize).toBe('function')
			expect(typeof createSanitizer).toBe('function')
		})

		test('should export CircularBuffer', () => {
			expect(typeof CircularBuffer).toBe('function')
		})
	})

	describe('transport exports', () => {
		test('should export ConsoleTransport', () => {
			expect(typeof ConsoleTransport).toBe('function')
		})
	})

	describe('default log instance', () => {
		test('should be usable immediately', () => {
			// Just check that it doesn't throw
			expect(() => {
				log.getLevel()
			}).not.toThrow()
		})

		test('should have all log methods', () => {
			expect(typeof log.trace).toBe('function')
			expect(typeof log.debug).toBe('function')
			expect(typeof log.info).toBe('function')
			expect(typeof log.warn).toBe('function')
			expect(typeof log.error).toBe('function')
		})

		test('should have control methods', () => {
			expect(typeof log.setLevel).toBe('function')
			expect(typeof log.getLevel).toBe('function')
			expect(typeof log.enable).toBe('function')
			expect(typeof log.disable).toBe('function')
			expect(typeof log.isEnabled).toBe('function')
			expect(typeof log.flush).toBe('function')
			expect(typeof log.child).toBe('function')
		})
	})
})
