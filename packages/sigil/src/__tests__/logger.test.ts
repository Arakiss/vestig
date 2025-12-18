import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { LoggerImpl, createLogger } from '../logger'

describe('createLogger', () => {
	test('should create a logger instance', () => {
		const logger = createLogger()
		expect(logger).toBeDefined()
		expect(typeof logger.info).toBe('function')
	})

	test('should accept config', () => {
		const logger = createLogger({ level: 'debug' })
		expect(logger.getLevel()).toBe('debug')
	})
})

describe('LoggerImpl', () => {
	// Store original console methods
	const originalConsole = {
		debug: console.debug,
		info: console.info,
		warn: console.warn,
		error: console.error,
	}

	let consoleOutput: Array<{ method: string; output: string }> = []

	beforeEach(() => {
		consoleOutput = []
		console.debug = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'debug', output: String(args[0]) })
		})
		console.info = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'info', output: String(args[0]) })
		})
		console.warn = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'warn', output: String(args[0]) })
		})
		console.error = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'error', output: String(args[0]) })
		})
	})

	afterEach(() => {
		console.debug = originalConsole.debug
		console.info = originalConsole.info
		console.warn = originalConsole.warn
		console.error = originalConsole.error
	})

	describe('log levels', () => {
		test('should have trace method', () => {
			const logger = new LoggerImpl({ level: 'trace' })
			logger.trace('trace message')
			expect(consoleOutput.length).toBe(1)
		})

		test('should have debug method', () => {
			const logger = new LoggerImpl({ level: 'debug' })
			logger.debug('debug message')
			expect(consoleOutput.length).toBe(1)
		})

		test('should have info method', () => {
			const logger = new LoggerImpl({ level: 'info' })
			logger.info('info message')
			expect(consoleOutput.length).toBe(1)
		})

		test('should have warn method', () => {
			const logger = new LoggerImpl({ level: 'warn' })
			logger.warn('warn message')
			expect(consoleOutput.length).toBe(1)
		})

		test('should have error method', () => {
			const logger = new LoggerImpl({ level: 'error' })
			logger.error('error message')
			expect(consoleOutput.length).toBe(1)
		})
	})

	describe('level filtering', () => {
		test('should not log below minimum level', () => {
			const logger = new LoggerImpl({ level: 'warn' })
			logger.trace('trace')
			logger.debug('debug')
			logger.info('info')
			logger.warn('warn')
			logger.error('error')

			expect(consoleOutput.length).toBe(2)
		})

		test('should respect trace level', () => {
			const logger = new LoggerImpl({ level: 'trace' })
			logger.trace('trace')
			logger.debug('debug')
			logger.info('info')

			expect(consoleOutput.length).toBe(3)
		})
	})

	describe('enabled/disabled', () => {
		test('should not log when disabled', () => {
			const logger = new LoggerImpl({ enabled: false })
			logger.info('should not appear')

			expect(consoleOutput.length).toBe(0)
		})

		test('should log when enabled', () => {
			const logger = new LoggerImpl({ enabled: true })
			logger.info('should appear')

			expect(consoleOutput.length).toBe(1)
		})

		test('disable() should stop logging', () => {
			const logger = new LoggerImpl()
			logger.info('before')
			logger.disable()
			logger.info('after')

			expect(consoleOutput.length).toBe(1)
		})

		test('enable() should resume logging', () => {
			const logger = new LoggerImpl({ enabled: false })
			logger.info('before')
			logger.enable()
			logger.info('after')

			expect(consoleOutput.length).toBe(1)
		})

		test('isEnabled() should return correct state', () => {
			const logger = new LoggerImpl()
			expect(logger.isEnabled()).toBe(true)

			logger.disable()
			expect(logger.isEnabled()).toBe(false)

			logger.enable()
			expect(logger.isEnabled()).toBe(true)
		})
	})

	describe('setLevel/getLevel', () => {
		test('should get current level', () => {
			const logger = new LoggerImpl({ level: 'debug' })
			expect(logger.getLevel()).toBe('debug')
		})

		test('should set new level', () => {
			const logger = new LoggerImpl({ level: 'info' })
			logger.setLevel('error')
			expect(logger.getLevel()).toBe('error')
		})

		test('should filter logs after setLevel', () => {
			const logger = new LoggerImpl({ level: 'trace' })
			logger.trace('should appear')
			logger.setLevel('error')
			logger.trace('should not appear')

			expect(consoleOutput.length).toBe(1)
		})
	})

	describe('message formatting', () => {
		test('should log string message', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info('Hello world')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.message).toBe('Hello world')
		})

		test('should log message with metadata object', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info('User action', { userId: '123', action: 'login' })

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.message).toBe('User action')
			expect(output.metadata.userId).toBe('123')
			expect(output.metadata.action).toBe('login')
		})

		test('should handle Error in args', () => {
			const logger = new LoggerImpl({ structured: true })
			const error = new Error('test error')
			logger.error('Something failed', error)

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.error).toBeDefined()
			expect(output.error.message).toBe('test error')
		})

		test('should handle non-string first argument', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info({ userId: '123' })

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.metadata.userId).toBe('123')
		})

		test('should handle empty args', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info()

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.message).toBe('')
		})

		test('should handle multiple non-object args', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info('Message', 'arg1', 123, true)

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.message).toBe('Message')
			expect(output.metadata.arg1).toBe('arg1')
			expect(output.metadata.arg2).toBe(123)
			expect(output.metadata.arg3).toBe(true)
		})
	})

	describe('sanitization', () => {
		test('should sanitize sensitive fields when enabled', () => {
			const logger = new LoggerImpl({ sanitize: true, structured: true })
			logger.info('User data', { password: 'secret123' })

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.metadata.password).toBe('[REDACTED]')
		})

		test('should not sanitize when disabled', () => {
			const logger = new LoggerImpl({ sanitize: false, structured: true })
			logger.info('User data', { password: 'secret123' })

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.metadata.password).toBe('secret123')
		})

		test('should sanitize custom fields', () => {
			const logger = new LoggerImpl({
				sanitize: true,
				sanitizeFields: ['customSecret'],
				structured: true,
			})
			logger.info('Data', { customSecret: 'value', normal: 'safe' })

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.metadata.customSecret).toBe('[REDACTED]')
			expect(output.metadata.normal).toBe('safe')
		})
	})

	describe('child loggers', () => {
		test('should create child with namespace', () => {
			const logger = new LoggerImpl({ structured: true })
			const child = logger.child('child-ns')
			child.info('Child message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.namespace).toBe('child-ns')
		})

		test('should chain namespaces', () => {
			const logger = new LoggerImpl({ namespace: 'parent', structured: true })
			const child = logger.child('child')
			child.info('Message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.namespace).toBe('parent:child')
		})

		test('should cache children without config', () => {
			const logger = new LoggerImpl()
			const child1 = logger.child('cached')
			const child2 = logger.child('cached')

			expect(child1).toBe(child2)
		})

		test('should not cache children with config', () => {
			const logger = new LoggerImpl()
			const child1 = logger.child('not-cached', { level: 'debug' })
			const child2 = logger.child('not-cached', { level: 'error' })

			expect(child1).not.toBe(child2)
		})

		test('should inherit parent config', () => {
			const logger = new LoggerImpl({ level: 'debug' })
			const child = logger.child('child')

			expect(child.getLevel()).toBe('debug')
		})

		test('should override parent config', () => {
			const logger = new LoggerImpl({ level: 'debug' })
			const child = logger.child('child', { level: 'error' })

			expect(child.getLevel()).toBe('error')
		})

		test('should merge contexts', () => {
			const logger = new LoggerImpl({ context: { app: 'test' }, structured: true })
			const child = logger.child('child', { context: { service: 'api' } })
			child.info('Message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.context.app).toBe('test')
			expect(output.context.service).toBe('api')
		})
	})

	describe('context', () => {
		test('should include static context', () => {
			const logger = new LoggerImpl({
				context: { app: 'myapp', env: 'test' },
				structured: true,
			})
			logger.info('Message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.context.app).toBe('myapp')
			expect(output.context.env).toBe('test')
		})

		test('should not include empty context', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info('Message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.context).toBeUndefined()
		})
	})

	describe('flush', () => {
		test('should have flush method', async () => {
			const logger = new LoggerImpl()
			await expect(logger.flush()).resolves.toBeUndefined()
		})
	})

	describe('runtime', () => {
		test('should include runtime in log entry', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info('Message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.runtime).toBe('bun')
		})
	})

	describe('timestamp', () => {
		test('should include ISO timestamp', () => {
			const logger = new LoggerImpl({ structured: true })
			logger.info('Message')

			const output = JSON.parse(consoleOutput[0].output)
			expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
		})
	})
})
