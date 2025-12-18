import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { ConsoleTransport } from '../transports/console'
import type { LogEntry } from '../types'

describe('ConsoleTransport', () => {
	// Store original console methods
	const originalConsole = {
		debug: console.debug,
		info: console.info,
		warn: console.warn,
		error: console.error,
	}

	let consoleOutput: Array<{ method: string; args: unknown[] }> = []

	beforeEach(() => {
		consoleOutput = []
		// Mock console methods
		console.debug = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'debug', args })
		})
		console.info = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'info', args })
		})
		console.warn = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'warn', args })
		})
		console.error = mock((...args: unknown[]) => {
			consoleOutput.push({ method: 'error', args })
		})
	})

	afterEach(() => {
		// Restore console methods
		console.debug = originalConsole.debug
		console.info = originalConsole.info
		console.warn = originalConsole.warn
		console.error = originalConsole.error
	})

	const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
		timestamp: '2024-01-01T00:00:00.000Z',
		level: 'info',
		message: 'Test message',
		runtime: 'bun',
		...overrides,
	})

	describe('constructor', () => {
		test('should create with default config', () => {
			const transport = new ConsoleTransport()
			expect(transport.name).toBe('console')
		})

		test('should accept structured option', () => {
			const transport = new ConsoleTransport({ structured: true })
			expect(transport.name).toBe('console')
		})

		test('should accept colors option', () => {
			const transport = new ConsoleTransport({ colors: false })
			expect(transport.name).toBe('console')
		})
	})

	describe('log method', () => {
		test('should log to correct console method for each level', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })

			transport.log(createEntry({ level: 'trace' }))
			expect(consoleOutput[0].method).toBe('debug')

			transport.log(createEntry({ level: 'debug' }))
			expect(consoleOutput[1].method).toBe('debug')

			transport.log(createEntry({ level: 'info' }))
			expect(consoleOutput[2].method).toBe('info')

			transport.log(createEntry({ level: 'warn' }))
			expect(consoleOutput[3].method).toBe('warn')

			transport.log(createEntry({ level: 'error' }))
			expect(consoleOutput[4].method).toBe('error')
		})
	})

	describe('structured output', () => {
		test('should output JSON when structured is true', () => {
			const transport = new ConsoleTransport({ structured: true })
			const entry = createEntry()

			transport.log(entry)

			expect(consoleOutput.length).toBe(1)
			const output = consoleOutput[0].args[0] as string
			const parsed = JSON.parse(output)

			expect(parsed.level).toBe('info')
			expect(parsed.message).toBe('Test message')
			expect(parsed.timestamp).toBe('2024-01-01T00:00:00.000Z')
		})

		test('should include all entry properties in JSON', () => {
			const transport = new ConsoleTransport({ structured: true })
			const entry = createEntry({
				metadata: { key: 'value' },
				context: { requestId: 'req-123' },
				namespace: 'test-ns',
			})

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			const parsed = JSON.parse(output)

			expect(parsed.metadata).toEqual({ key: 'value' })
			expect(parsed.context).toEqual({ requestId: 'req-123' })
			expect(parsed.namespace).toBe('test-ns')
		})
	})

	describe('pretty output', () => {
		test('should format message with level', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })
			const entry = createEntry()

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			expect(output).toContain('INFO')
			expect(output).toContain('Test message')
		})

		test('should include namespace in output', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })
			const entry = createEntry({ namespace: 'myapp' })

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			expect(output).toContain('[myapp]')
		})

		test('should include metadata in output', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })
			const entry = createEntry({
				metadata: { userId: '123', action: 'login' },
			})

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			expect(output).toContain('userId')
			expect(output).toContain('123')
		})

		test('should include error stack in output', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })
			const entry = createEntry({
				error: {
					name: 'Error',
					message: 'Something went wrong',
					stack: 'Error: Something went wrong\n    at test.ts:1:1',
				},
			})

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			expect(output).toContain('Error: Something went wrong')
		})

		test('should include error message when no stack', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })
			const entry = createEntry({
				error: {
					name: 'Error',
					message: 'Something went wrong',
				},
			})

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			expect(output).toContain('Something went wrong')
		})
	})

	describe('colors', () => {
		test('should include ANSI codes when colors enabled', () => {
			const transport = new ConsoleTransport({ structured: false, colors: true })
			const entry = createEntry({ level: 'error' })

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			// Should contain ANSI escape codes
			expect(output).toContain('\x1b[')
		})

		test('should not include ANSI codes when colors disabled', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })
			const entry = createEntry({ level: 'error' })

			transport.log(entry)

			const output = consoleOutput[0].args[0] as string
			expect(output).not.toContain('\x1b[')
		})
	})

	describe('setStructured', () => {
		test('should switch to structured output', () => {
			const transport = new ConsoleTransport({ structured: false })

			transport.setStructured(true)
			transport.log(createEntry())

			const output = consoleOutput[0].args[0] as string
			// Should be valid JSON
			expect(() => JSON.parse(output)).not.toThrow()
		})

		test('should switch to pretty output', () => {
			const transport = new ConsoleTransport({ structured: true })

			transport.setStructured(false)
			transport.log(createEntry())

			const output = consoleOutput[0].args[0] as string
			// Should not be JSON (would throw if parsed)
			expect(output).toContain('INFO')
		})
	})

	describe('setColors', () => {
		test('should enable colors', () => {
			const transport = new ConsoleTransport({ structured: false, colors: false })

			transport.setColors(true)
			transport.log(createEntry({ level: 'info' }))

			const output = consoleOutput[0].args[0] as string
			expect(output).toContain('\x1b[')
		})

		test('should disable colors', () => {
			const transport = new ConsoleTransport({ structured: false, colors: true })

			transport.setColors(false)
			transport.log(createEntry({ level: 'info' }))

			const output = consoleOutput[0].args[0] as string
			expect(output).not.toContain('\x1b[')
		})
	})
})
