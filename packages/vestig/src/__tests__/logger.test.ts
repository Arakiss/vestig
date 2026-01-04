import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { LoggerImpl, createLogger, createLoggerAsync, initLogger } from '../logger'

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

	describe('addTransport', () => {
		test('should add a transport', () => {
			const logger = new LoggerImpl()
			const mockTransport = {
				name: 'mock',
				config: { name: 'mock', enabled: true },
				log: () => {},
			}

			logger.addTransport(mockTransport)

			const transports = logger.getTransports()
			expect(transports.some((t) => t.name === 'mock')).toBe(true)
		})

		test('should throw on duplicate transport name', () => {
			const logger = new LoggerImpl()
			const mockTransport1 = {
				name: 'mock',
				config: { name: 'mock', enabled: true },
				log: () => {},
			}
			const mockTransport2 = {
				name: 'mock',
				config: { name: 'mock', enabled: true },
				log: () => {},
			}

			logger.addTransport(mockTransport1)
			expect(() => logger.addTransport(mockTransport2)).toThrow(
				'Transport with name "mock" already exists',
			)
		})

		test('should initialize transport if logger is already initialized', async () => {
			const logger = new LoggerImpl()
			await logger.init()

			let initCalled = false
			const mockTransport = {
				name: 'mock-init',
				config: { name: 'mock-init', enabled: true },
				log: () => {},
				init: async () => {
					initCalled = true
				},
			}

			logger.addTransport(mockTransport)

			// Wait for async init
			await new Promise((r) => setTimeout(r, 10))
			expect(initCalled).toBe(true)
		})
	})

	describe('removeTransport', () => {
		test('should remove a transport by name', () => {
			const logger = new LoggerImpl()
			const mockTransport = {
				name: 'to-remove',
				config: { name: 'to-remove', enabled: true },
				log: () => {},
			}

			logger.addTransport(mockTransport)
			expect(logger.getTransports().some((t) => t.name === 'to-remove')).toBe(true)

			const result = logger.removeTransport('to-remove')
			expect(result).toBe(true)
			expect(logger.getTransports().some((t) => t.name === 'to-remove')).toBe(false)
		})

		test('should return false for non-existent transport', () => {
			const logger = new LoggerImpl()
			const result = logger.removeTransport('non-existent')
			expect(result).toBe(false)
		})

		test('should call destroy on removed transport', async () => {
			const logger = new LoggerImpl()
			let destroyCalled = false
			const mockTransport = {
				name: 'destroy-test',
				config: { name: 'destroy-test', enabled: true },
				log: () => {},
				destroy: async () => {
					destroyCalled = true
				},
			}

			logger.addTransport(mockTransport)
			logger.removeTransport('destroy-test')

			// Wait for async destroy
			await new Promise((r) => setTimeout(r, 10))
			expect(destroyCalled).toBe(true)
		})
	})

	describe('getTransports', () => {
		test('should return all transports', () => {
			const logger = new LoggerImpl()
			const initialCount = logger.getTransports().length

			const mockTransport = {
				name: 'get-test',
				config: { name: 'get-test', enabled: true },
				log: () => {},
			}

			logger.addTransport(mockTransport)
			expect(logger.getTransports().length).toBe(initialCount + 1)
		})

		test('should return readonly array', () => {
			const logger = new LoggerImpl()
			const transports = logger.getTransports()
			expect(Array.isArray(transports)).toBe(true)
		})
	})

	describe('init', () => {
		test('should initialize all transports', async () => {
			const logger = new LoggerImpl()
			let initCount = 0

			const mockTransport1 = {
				name: 'init-1',
				config: { name: 'init-1', enabled: true },
				log: () => {},
				init: async () => {
					initCount++
				},
			}
			const mockTransport2 = {
				name: 'init-2',
				config: { name: 'init-2', enabled: true },
				log: () => {},
				init: async () => {
					initCount++
				},
			}

			logger.addTransport(mockTransport1)
			logger.addTransport(mockTransport2)

			await logger.init()
			expect(initCount).toBe(2)
		})

		test('should only initialize once', async () => {
			const logger = new LoggerImpl()
			let initCount = 0

			const mockTransport = {
				name: 'init-once',
				config: { name: 'init-once', enabled: true },
				log: () => {},
				init: async () => {
					initCount++
				},
			}

			logger.addTransport(mockTransport)
			await logger.init()
			await logger.init()
			await logger.init()

			expect(initCount).toBe(1)
		})
	})

	describe('destroy', () => {
		test('should destroy all transports', async () => {
			const logger = new LoggerImpl()
			let destroyCount = 0

			const mockTransport1 = {
				name: 'destroy-1',
				config: { name: 'destroy-1', enabled: true },
				log: () => {},
				destroy: async () => {
					destroyCount++
				},
			}
			const mockTransport2 = {
				name: 'destroy-2',
				config: { name: 'destroy-2', enabled: true },
				log: () => {},
				destroy: async () => {
					destroyCount++
				},
			}

			logger.addTransport(mockTransport1)
			logger.addTransport(mockTransport2)

			await logger.destroy()
			expect(destroyCount).toBe(2)
		})

		test('should clear transports list', async () => {
			const logger = new LoggerImpl()
			const mockTransport = {
				name: 'clear-test',
				config: { name: 'clear-test', enabled: true },
				log: () => {},
			}

			logger.addTransport(mockTransport)
			expect(logger.getTransports().length).toBeGreaterThan(0)

			await logger.destroy()
			// After destroy, only the default console transport remains (or none)
			// Actually destroy clears ALL transports
			expect(logger.getTransports().length).toBe(0)
		})

		test('should allow re-initialization after destroy', async () => {
			const logger = new LoggerImpl()
			await logger.init()
			await logger.destroy()

			let initCalled = false
			const mockTransport = {
				name: 're-init',
				config: { name: 're-init', enabled: true },
				log: () => {},
				init: async () => {
					initCalled = true
				},
			}

			logger.addTransport(mockTransport)
			await logger.init()
			expect(initCalled).toBe(true)
		})
	})
})

describe('createLoggerAsync', () => {
	test('should create and initialize a logger', async () => {
		const logger = await createLoggerAsync()
		expect(logger).toBeDefined()
		expect(typeof logger.info).toBe('function')
	})

	test('should accept config', async () => {
		const logger = await createLoggerAsync({ level: 'warn', namespace: 'async-test' })
		expect(logger.getLevel()).toBe('warn')
	})

	test('should initialize transports', async () => {
		let initCalled = false
		const logger = await createLoggerAsync()

		// Add a transport after creation - it should init immediately because logger is initialized
		const mockTransport = {
			name: 'async-init-test',
			config: { name: 'async-init-test', enabled: true },
			log: () => {},
			init: async () => {
				initCalled = true
			},
		}

		logger.addTransport(mockTransport)

		// Wait for async init
		await new Promise((r) => setTimeout(r, 10))
		expect(initCalled).toBe(true)
	})

	test('should return a fully functional logger', async () => {
		const logger = await createLoggerAsync({ level: 'debug' })
		const child = logger.child('child')

		expect(child.getLevel()).toBe('debug')
	})
})

describe('initLogger', () => {
	test('should initialize an existing logger', async () => {
		const logger = createLogger()
		let initCalled = false

		const mockTransport = {
			name: 'init-logger-test',
			config: { name: 'init-logger-test', enabled: true },
			log: () => {},
			init: async () => {
				initCalled = true
			},
		}

		logger.addTransport(mockTransport)

		await initLogger(logger)
		expect(initCalled).toBe(true)
	})

	test('should return the same logger instance', async () => {
		const logger = createLogger()
		const result = await initLogger(logger)

		expect(result).toBe(logger)
	})

	test('should only initialize once', async () => {
		const logger = createLogger()
		let initCount = 0

		const mockTransport = {
			name: 'init-once-test',
			config: { name: 'init-once-test', enabled: true },
			log: () => {},
			init: async () => {
				initCount++
			},
		}

		logger.addTransport(mockTransport)

		await initLogger(logger)
		await initLogger(logger)
		await initLogger(logger)

		expect(initCount).toBe(1)
	})

	test('should work with logger created from createLoggerAsync', async () => {
		const logger = await createLoggerAsync()

		// Calling initLogger again should be safe (no-op)
		await expect(initLogger(logger)).resolves.toBe(logger)
	})

	test('should handle transports with async initialization errors', async () => {
		const logger = createLogger()

		const errorTransport = {
			name: 'error-transport',
			config: { name: 'error-transport', enabled: true },
			log: () => {},
			init: async () => {
				throw new Error('Init failed')
			},
		}

		logger.addTransport(errorTransport)

		// initLogger should propagate the error
		await expect(initLogger(logger)).rejects.toThrow('Init failed')
	})
})

describe('deduplication', () => {
	const originalConsole = {
		info: console.info,
		warn: console.warn,
	}

	let consoleOutput: Array<{ method: string; output: string }> = []

	beforeEach(() => {
		consoleOutput = []
		console.info = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'info', output: String(args[0]) })
		})
		console.warn = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'warn', output: String(args[0]) })
		})
	})

	afterEach(() => {
		console.info = originalConsole.info
		console.warn = originalConsole.warn
	})

	test('should suppress duplicate logs when dedupe is enabled', async () => {
		const logger = new LoggerImpl({
			dedupe: { enabled: true, windowMs: 100 },
			structured: true,
		})

		logger.info('Same message')
		logger.info('Same message')
		logger.info('Same message')

		// Only first should be logged
		expect(consoleOutput).toHaveLength(1)

		await logger.destroy()
	})

	test('should log different messages', async () => {
		const logger = new LoggerImpl({
			dedupe: { enabled: true, windowMs: 100 },
			structured: true,
		})

		logger.info('Message 1')
		logger.info('Message 2')
		logger.info('Message 3')

		expect(consoleOutput).toHaveLength(3)

		await logger.destroy()
	})

	test('should emit summary after window expires', async () => {
		const logger = new LoggerImpl({
			dedupe: { enabled: true, windowMs: 100 },
			structured: true,
		})

		logger.info('Repeated message')
		logger.info('Repeated message')
		logger.info('Repeated message')

		// Only first logged
		expect(consoleOutput).toHaveLength(1)

		// Wait for window to expire
		await new Promise((resolve) => setTimeout(resolve, 120))

		// Log same message again - should trigger summary
		logger.info('Repeated message')

		// Should now have 3 outputs: original, summary, new occurrence
		expect(consoleOutput).toHaveLength(3)

		// Check summary message
		const summaryOutput = JSON.parse(consoleOutput[1].output)
		expect(summaryOutput.message).toContain('[dedupe]')
		expect(summaryOutput.message).toContain('repeated 2 time')

		await logger.destroy()
	})

	test('should work without dedupe config', () => {
		const logger = new LoggerImpl({ structured: true })

		logger.info('Same message')
		logger.info('Same message')
		logger.info('Same message')

		// All should be logged when dedupe is not enabled
		expect(consoleOutput).toHaveLength(3)
	})

	test('should treat different levels as different messages by default', async () => {
		const logger = new LoggerImpl({
			dedupe: { enabled: true, windowMs: 100 },
			structured: true,
		})

		logger.info('Same message')
		logger.warn('Same message')

		// Both should be logged
		expect(consoleOutput).toHaveLength(2)

		await logger.destroy()
	})

	test('should clean up deduplicator on destroy', async () => {
		const logger = new LoggerImpl({
			dedupe: { enabled: true, windowMs: 1000 },
		})

		logger.info('Test message')

		await logger.destroy()

		// Should not throw after destroy
		expect(() => logger.info('Another message')).not.toThrow()
	})
})
