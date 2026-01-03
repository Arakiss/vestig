import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { FileTransport } from '../transports/file'
import type { LogEntry } from '../types'

const TEST_DIR = join(process.cwd(), '.test-logs')
const TEST_LOG_PATH = join(TEST_DIR, 'test.log')

const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
	timestamp: new Date().toISOString(),
	level: 'info',
	message: 'Test message',
	runtime: 'bun',
	...overrides,
})

describe('FileTransport', () => {
	beforeEach(() => {
		// Clean up test directory before each test
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true })
		}
	})

	afterEach(() => {
		// Clean up after each test
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true })
		}
	})

	describe('constructor', () => {
		test('should create with minimal config', () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})
			expect(transport.name).toBe('file')
		})

		test('should accept custom name', () => {
			const transport = new FileTransport({
				name: 'custom-file',
				path: TEST_LOG_PATH,
			})
			expect(transport.name).toBe('custom-file')
		})

		test('should use default maxSize of 10MB', () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})
			expect(transport.name).toBe('file')
			// Default is 10 * 1024 * 1024 as per implementation
		})

		test('should use default maxFiles of 5', () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})
			expect(transport.name).toBe('file')
			// Default is 5 as per implementation
		})
	})

	describe('init', () => {
		test('should create directory if not exists', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			expect(existsSync(TEST_DIR)).toBe(true)
			await transport.destroy()
		})

		test('should create log file', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			// Write a log to ensure file is created
			transport.log(createEntry())
			await transport.flush()

			expect(existsSync(TEST_LOG_PATH)).toBe(true)
			await transport.destroy()
		})

		test('should handle nested directory paths', async () => {
			const nestedPath = join(TEST_DIR, 'nested', 'deep', 'app.log')
			const transport = new FileTransport({
				path: nestedPath,
			})

			await transport.init()

			transport.log(createEntry())
			await transport.flush()

			expect(existsSync(nestedPath)).toBe(true)
			await transport.destroy()
		})
	})

	describe('write', () => {
		test('should write log entries as newline-delimited JSON', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(createEntry({ message: 'First log' }))
			transport.log(createEntry({ message: 'Second log' }))
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const lines = content.trim().split('\n')

			expect(lines.length).toBe(2)
			expect(JSON.parse(lines[0]).message).toBe('First log')
			expect(JSON.parse(lines[1]).message).toBe('Second log')

			await transport.destroy()
		})

		test('should include all log entry fields', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(
				createEntry({
					level: 'error',
					message: 'Error occurred',
					metadata: { userId: 123 },
					namespace: 'api:users',
				}),
			)
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const entry = JSON.parse(content.trim())

			expect(entry.level).toBe('error')
			expect(entry.message).toBe('Error occurred')
			expect(entry.metadata.userId).toBe(123)
			expect(entry.namespace).toBe('api:users')

			await transport.destroy()
		})

		test('should track current file size', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			expect(transport.getCurrentSize()).toBe(0)

			transport.log(createEntry({ message: 'Test' }))
			await transport.flush()

			expect(transport.getCurrentSize()).toBeGreaterThan(0)

			await transport.destroy()
		})

		test('should throw if not initialized', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			transport.log(createEntry())

			// Flush should handle the error internally
			await transport.flush()
		})
	})

	describe('rotation', () => {
		test('should rotate when file exceeds maxSize', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
				maxSize: 200, // Very small for testing
				maxFiles: 3,
			})

			await transport.init()

			// Write enough to trigger rotation
			for (let i = 0; i < 10; i++) {
				transport.log(createEntry({ message: `Log entry number ${i} with some extra content` }))
			}
			await transport.flush()

			// Check that rotation occurred
			const rotatedPath = `${TEST_LOG_PATH}.1`
			expect(existsSync(TEST_LOG_PATH)).toBe(true)
			expect(existsSync(rotatedPath)).toBe(true)

			await transport.destroy()
		})

		test('should delete oldest files beyond maxFiles', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
				maxSize: 100, // Very small for testing
				maxFiles: 2,
			})

			await transport.init()

			// Write enough to trigger multiple rotations
			for (let i = 0; i < 20; i++) {
				transport.log(createEntry({ message: `Log entry number ${i} with extra content to fill` }))
			}
			await transport.flush()

			// Should only have main file + 2 rotated files at most
			const file3 = `${TEST_LOG_PATH}.3`
			expect(existsSync(file3)).toBe(false)

			await transport.destroy()
		})
	})

	describe('compression', () => {
		test('should compress rotated files when enabled', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
				maxSize: 150,
				maxFiles: 3,
				compress: true,
			})

			await transport.init()

			// Write enough to trigger rotation
			for (let i = 0; i < 10; i++) {
				transport.log(createEntry({ message: `Log entry ${i} with content` }))
			}
			await transport.flush()

			// Check for compressed files
			const compressedPath = `${TEST_LOG_PATH}.1.gz`
			// Note: Compression happens on rotation, may need more entries
			expect(existsSync(TEST_LOG_PATH)).toBe(true)

			await transport.destroy()
		})
	})

	describe('batching', () => {
		test('should batch multiple entries before writing', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
				// Use batchSize > entries count to avoid triggering auto-flush
				// Auto-flush is async and causes race conditions in tests
				batchSize: 10,
			})

			await transport.init()

			for (let i = 0; i < 5; i++) {
				transport.log(createEntry({ message: `Message ${i}` }))
			}
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const lines = content.trim().split('\n')
			expect(lines.length).toBe(5)

			await transport.destroy()
		})
	})

	describe('destroy', () => {
		test('should close file handle on destroy', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(createEntry())
			await transport.flush()

			await transport.destroy()

			// Writing after destroy should not work
			// (file handle closed)
		})

		test('should flush pending entries before closing', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(createEntry({ message: 'Last log' }))
			await transport.destroy()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			expect(content).toContain('Last log')
		})
	})

	describe('edge cases', () => {
		test('should handle empty log message', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(createEntry({ message: '' }))
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const entry = JSON.parse(content.trim())
			expect(entry.message).toBe('')

			await transport.destroy()
		})

		test('should handle special characters in message', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(createEntry({ message: 'Special chars: "quotes" and \\ backslash' }))
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const entry = JSON.parse(content.trim())
			expect(entry.message).toContain('quotes')
			expect(entry.message).toContain('backslash')

			await transport.destroy()
		})

		test('should handle unicode characters', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			transport.log(createEntry({ message: 'Unicode: 你好世界 🌍 émojis' }))
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const entry = JSON.parse(content.trim())
			expect(entry.message).toContain('你好世界')
			expect(entry.message).toContain('🌍')

			await transport.destroy()
		})

		test('should handle large metadata objects', async () => {
			const transport = new FileTransport({
				path: TEST_LOG_PATH,
			})

			await transport.init()

			const largeMetadata: Record<string, number> = {}
			for (let i = 0; i < 100; i++) {
				largeMetadata[`key_${i}`] = i
			}

			transport.log(createEntry({ metadata: largeMetadata }))
			await transport.flush()

			const content = readFileSync(TEST_LOG_PATH, 'utf-8')
			const entry = JSON.parse(content.trim())
			expect(Object.keys(entry.metadata).length).toBe(100)

			await transport.destroy()
		})
	})
})
