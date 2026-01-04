import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { BatchTransport } from '../transports/batch'
import type { LogEntry } from '../types'

/**
 * Concrete implementation of BatchTransport for testing
 */
class TestBatchTransport extends BatchTransport {
	readonly name = 'test-batch'
	public sendCalls: LogEntry[][] = []
	public dropCalls: LogEntry[][] = []
	public errorCalls: Array<{ error: Error; entries: LogEntry[] }> = []
	public shouldFail = false
	public failCount = 0

	protected async send(entries: LogEntry[]): Promise<void> {
		if (this.shouldFail) {
			this.failCount++
			throw new Error('Test send failure')
		}
		this.sendCalls.push(entries)
	}

	protected onDrop(entries: LogEntry[]): void {
		this.dropCalls.push(entries)
	}

	protected onSendError(error: Error, entries: LogEntry[]): void {
		this.errorCalls.push({ error, entries })
	}

	// Expose protected method for testing
	public async testSendWithRetry(entries: LogEntry[]): Promise<void> {
		return this.sendWithRetry(entries)
	}

	// Expose sleep for testing
	public testSleep(ms: number): Promise<void> {
		return this.sleep(ms)
	}
}

const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
	timestamp: new Date().toISOString(),
	level: 'info',
	message: 'Test message',
	runtime: 'bun',
	...overrides,
})

describe('BatchTransport', () => {
	let transport: TestBatchTransport

	beforeEach(() => {
		transport = new TestBatchTransport({
			name: 'test-batch',
			batchSize: 5,
			flushInterval: 100,
			maxRetries: 3,
			retryDelay: 10,
		})
	})

	afterEach(async () => {
		await transport.destroy()
	})

	describe('constructor', () => {
		test('should create with default config', () => {
			const t = new TestBatchTransport({ name: 'test' })
			expect(t.name).toBe('test-batch')
			expect(t.config.name).toBe('test')
			expect(t.config.enabled).toBe(true)
		})

		test('should accept custom config', () => {
			const t = new TestBatchTransport({
				name: 'custom',
				enabled: false,
				level: 'warn',
				batchSize: 50,
				flushInterval: 10000,
				maxRetries: 5,
				retryDelay: 2000,
			})
			expect(t.config.enabled).toBe(false)
			expect(t.config.level).toBe('warn')
		})
	})

	describe('log', () => {
		test('should buffer log entries', () => {
			transport.log(createEntry())
			transport.log(createEntry())

			const stats = transport.getStats()
			expect(stats.buffered).toBe(2)
		})

		test('should auto-flush when batch size reached', async () => {
			// Add entries up to batch size
			for (let i = 0; i < 5; i++) {
				transport.log(createEntry({ message: `Message ${i}` }))
			}

			// Wait for auto-flush
			await new Promise((r) => setTimeout(r, 50))

			expect(transport.sendCalls.length).toBe(1)
			expect(transport.sendCalls[0].length).toBe(5)
		})

		test('should not log after destroy', async () => {
			await transport.destroy()
			transport.log(createEntry())

			const stats = transport.getStats()
			expect(stats.buffered).toBe(0)
		})
	})

	describe('flush', () => {
		test('should send buffered entries', async () => {
			transport.log(createEntry())
			transport.log(createEntry())

			await transport.flush()

			expect(transport.sendCalls.length).toBe(1)
			expect(transport.sendCalls[0].length).toBe(2)
		})

		test('should clear buffer after flush', async () => {
			transport.log(createEntry())
			await transport.flush()

			const stats = transport.getStats()
			expect(stats.buffered).toBe(0)
		})

		test('should not flush when buffer is empty', async () => {
			await transport.flush()
			expect(transport.sendCalls.length).toBe(0)
		})

		test('should not flush concurrently', async () => {
			for (let i = 0; i < 3; i++) {
				transport.log(createEntry())
			}

			// Start multiple flushes
			const flushPromises = [transport.flush(), transport.flush(), transport.flush()]

			await Promise.all(flushPromises)

			// Should only send once
			expect(transport.sendCalls.length).toBe(1)
		})
	})

	describe('init', () => {
		test('should start flush timer', async () => {
			await transport.init()
			transport.log(createEntry())

			// Wait for timer to trigger
			await new Promise((r) => setTimeout(r, 150))

			expect(transport.sendCalls.length).toBeGreaterThanOrEqual(1)
		})

		test('should not create multiple timers', async () => {
			await transport.init()
			await transport.init()
			await transport.init()

			// Should still work normally
			transport.log(createEntry())
			await transport.flush()

			expect(transport.sendCalls.length).toBe(1)
		})
	})

	describe('destroy', () => {
		test('should flush remaining entries', async () => {
			transport.log(createEntry())
			transport.log(createEntry())

			await transport.destroy()

			expect(transport.sendCalls.length).toBe(1)
		})

		test('should stop the flush timer', async () => {
			await transport.init()
			await transport.destroy()

			transport.sendCalls = []
			transport.log(createEntry())

			// Wait longer than flush interval
			await new Promise((r) => setTimeout(r, 200))

			// Timer should be stopped, so no auto-flush (entry was logged after destroy)
			expect(transport.sendCalls.length).toBe(0)
		})
	})

	describe('retry logic', () => {
		test('should retry on failure', async () => {
			transport.shouldFail = true

			await transport.testSendWithRetry([createEntry()])

			// Should have tried maxRetries times
			expect(transport.failCount).toBe(3)
			expect(transport.errorCalls.length).toBe(1)
		})

		test('should succeed on retry', async () => {
			let attempts = 0
			const customTransport = new (class extends TestBatchTransport {
				protected async send(entries: LogEntry[]): Promise<void> {
					attempts++
					if (attempts < 2) {
						throw new Error('Temporary failure')
					}
					this.sendCalls.push(entries)
				}
			})({
				name: 'retry-test',
				maxRetries: 3,
				retryDelay: 1,
			})

			await customTransport.testSendWithRetry([createEntry()])

			expect(attempts).toBe(2)
			expect(customTransport.sendCalls.length).toBe(1)
		})

		test('should call onSendError after all retries fail', async () => {
			transport.shouldFail = true

			await transport.testSendWithRetry([createEntry()])

			expect(transport.errorCalls.length).toBe(1)
			expect(transport.errorCalls[0].error.message).toBe('Test send failure')
		})
	})

	describe('getStats', () => {
		test('should return buffer statistics', () => {
			transport.log(createEntry())
			transport.log(createEntry())

			const stats = transport.getStats()
			expect(stats.buffered).toBe(2)
			expect(stats.dropped).toBe(0)
			expect(stats.isFlushing).toBe(false)
			expect(stats.pendingRetry).toBe(0)
		})

		test('should report pendingRetry after all retries fail', async () => {
			transport.shouldFail = true

			transport.log(createEntry())
			transport.log(createEntry())
			await transport.flush()

			const stats = transport.getStats()
			expect(stats.pendingRetry).toBe(2)
		})
	})

	describe('failed batch recovery', () => {
		test('should store failed entries for retry on next flush', async () => {
			transport.shouldFail = true

			transport.log(createEntry({ message: 'Entry 1' }))
			transport.log(createEntry({ message: 'Entry 2' }))
			await transport.flush()

			// Entries should be stored for retry
			expect(transport.getStats().pendingRetry).toBe(2)

			// Now make send succeed
			transport.shouldFail = false
			transport.failCount = 0

			transport.log(createEntry({ message: 'Entry 3' }))
			await transport.flush()

			// Should have sent all 3 entries (2 failed + 1 new)
			expect(transport.sendCalls.length).toBe(1)
			expect(transport.sendCalls[0].length).toBe(3)
			expect(transport.sendCalls[0][0].message).toBe('Entry 1')
			expect(transport.sendCalls[0][1].message).toBe('Entry 2')
			expect(transport.sendCalls[0][2].message).toBe('Entry 3')
		})

		test('should replace old failed batch with new one on repeated failure', async () => {
			transport.shouldFail = true

			// First flush fails
			transport.log(createEntry({ message: 'Batch 1 Entry 1' }))
			transport.log(createEntry({ message: 'Batch 1 Entry 2' }))
			await transport.flush()

			expect(transport.getStats().pendingRetry).toBe(2)
			expect(transport.errorCalls.length).toBe(1)

			// Second flush also fails (includes first failed batch + new entries)
			transport.log(createEntry({ message: 'Batch 2 Entry 1' }))
			await transport.flush()

			// Failed batch now contains all 3 entries (2 from first fail + 1 new)
			expect(transport.getStats().pendingRetry).toBe(3)
			expect(transport.errorCalls.length).toBe(2)

			// Third flush fails again
			await transport.flush()

			// Still same 3 entries pending (no new entries added)
			expect(transport.getStats().pendingRetry).toBe(3)
			expect(transport.errorCalls.length).toBe(3)
		})

		test('should clear pendingRetry after successful flush', async () => {
			transport.shouldFail = true

			transport.log(createEntry())
			await transport.flush()

			expect(transport.getStats().pendingRetry).toBe(1)

			// Succeed on next flush
			transport.shouldFail = false
			await transport.flush()

			expect(transport.getStats().pendingRetry).toBe(0)
			expect(transport.sendCalls.length).toBe(1)
		})

		test('should not flush when no buffer and no failed batch', async () => {
			await transport.flush()
			expect(transport.sendCalls.length).toBe(0)

			// Even after a failed flush, if we clear the failed batch
			// (by succeeding), subsequent empty flushes should be no-op
			transport.log(createEntry())
			await transport.flush()

			expect(transport.sendCalls.length).toBe(1)
			transport.sendCalls = []

			await transport.flush()
			expect(transport.sendCalls.length).toBe(0)
		})

		test('should flush failed batch even with empty buffer', async () => {
			transport.shouldFail = true

			transport.log(createEntry())
			await transport.flush()

			expect(transport.getStats().pendingRetry).toBe(1)

			// Succeed without adding new entries
			transport.shouldFail = false
			await transport.flush()

			expect(transport.sendCalls.length).toBe(1)
			expect(transport.sendCalls[0].length).toBe(1)
			expect(transport.getStats().pendingRetry).toBe(0)
		})
	})

	describe('sleep', () => {
		test('should wait for specified duration', async () => {
			const start = Date.now()
			await transport.testSleep(50)
			const elapsed = Date.now() - start

			expect(elapsed).toBeGreaterThanOrEqual(45)
		})
	})

	describe('buffer overflow', () => {
		test('should call onDrop when buffer overflows', async () => {
			// Create transport with very small buffer
			const smallTransport = new TestBatchTransport({
				name: 'small',
				batchSize: 2, // Buffer will be 4 (batchSize * 2)
			})

			// Make it never flush by making send hang
			smallTransport.shouldFail = false
			let sendCalled = false
			const originalSend = smallTransport.send.bind(smallTransport)
			smallTransport.send = async (entries: LogEntry[]) => {
				sendCalled = true
				// Hang forever
				await new Promise(() => {})
			}

			// Fill buffer past capacity
			for (let i = 0; i < 10; i++) {
				smallTransport.log(createEntry({ message: `Overflow ${i}` }))
			}

			// Some entries should have been dropped
			expect(smallTransport.dropCalls.length).toBeGreaterThan(0)
		})
	})
})
