import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { BatchTransport, BatchTransportError } from '../transports/batch'
import type { BatchTransportRetryEvent, LogEntry } from '../types'

/**
 * Concrete implementation of BatchTransport for testing
 */
class TestBatchTransport extends BatchTransport {
	readonly name = 'test-batch'
	public sendCalls: LogEntry[][] = []
	public dropCalls: LogEntry[][] = []
	public errorCalls: Array<{ error: Error; entries: LogEntry[] }> = []
	public retryCalls: BatchTransportRetryEvent[] = []
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

	protected onRetry(event: BatchTransportRetryEvent): void {
		this.retryCalls.push(event)
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
		await transport.destroy().catch(() => {})
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
				maxBufferSize: 500,
				flushInterval: 10000,
				maxRetries: 5,
				retryDelay: 2000,
			})
			expect(t.config.enabled).toBe(false)
			expect(t.config.level).toBe('warn')
			expect(t.getStats().maxBufferSize).toBe(500)
		})

		test('should default maxBufferSize to twice the batch size', () => {
			const t = new TestBatchTransport({
				name: 'default-buffer',
				batchSize: 25,
			})

			expect(t.getStats().maxBufferSize).toBe(50)
		})

		test('should not allow maxBufferSize below batchSize', () => {
			const t = new TestBatchTransport({
				name: 'raised-buffer',
				batchSize: 25,
				maxBufferSize: 10,
			})

			expect(t.getStats().maxBufferSize).toBe(25)
		})

		test('should reject invalid maxBufferSize', () => {
			expect(
				() =>
					new TestBatchTransport({
						name: 'invalid-buffer',
						maxBufferSize: 0,
					}),
			).toThrow('maxBufferSize')
		})

		test('should reject invalid batchSize', () => {
			expect(
				() =>
					new TestBatchTransport({
						name: 'invalid-batch',
						batchSize: 0,
					}),
			).toThrow('batchSize')
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

		test('should await an in-flight flush and then drain entries added during it', async () => {
			let releaseSend: (() => void) | undefined
			const slowTransport = new (class extends TestBatchTransport {
				protected async send(entries: LogEntry[]): Promise<void> {
					this.sendCalls.push(entries)
					if (this.sendCalls.length > 1) return
					await new Promise<void>((resolve) => {
						releaseSend = resolve
					})
				}
			})({
				name: 'slow',
				batchSize: 2,
				retryDelay: 1,
			})

			slowTransport.log(createEntry({ message: 'first' }))
			slowTransport.log(createEntry({ message: 'second' }))

			await new Promise((resolve) => setTimeout(resolve, 10))
			expect(slowTransport.getStats().isFlushing).toBe(true)

			slowTransport.log(createEntry({ message: 'third' }))
			const finalFlush = slowTransport.flush()

			releaseSend?.()
			await finalFlush

			expect(slowTransport.sendCalls.length).toBe(2)
			expect(slowTransport.sendCalls[0].map((entry) => entry.message)).toEqual(['first', 'second'])
			expect(slowTransport.sendCalls[1].map((entry) => entry.message)).toEqual(['third'])

			await slowTransport.destroy()
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

		test('should flush retained failed batch during destroy', async () => {
			const t = new TestBatchTransport({
				name: 'retry-on-destroy',
				batchSize: 5,
				maxRetries: 1,
				retryDelay: 1,
			})

			t.shouldFail = true
			t.log(createEntry({ message: 'retained' }))

			await expect(t.flush()).rejects.toThrow(BatchTransportError)
			expect(t.getStats().pendingRetry).toBe(1)

			t.shouldFail = false
			await t.destroy()

			expect(t.sendCalls.length).toBe(1)
			expect(t.sendCalls[0][0].message).toBe('retained')
			expect(t.getStats().pendingRetry).toBe(0)
		})
	})

	describe('retry logic', () => {
		test('should retry on failure', async () => {
			transport.shouldFail = true

			await expect(transport.testSendWithRetry([createEntry()])).rejects.toThrow(
				BatchTransportError,
			)

			// Should have tried maxRetries times
			expect(transport.failCount).toBe(3)
			expect(transport.errorCalls.length).toBe(1)
			expect(transport.errorCalls[0].error).toBeInstanceOf(BatchTransportError)
			expect(transport.retryCalls.length).toBe(2)
			expect(transport.retryCalls[0]).toMatchObject({
				transport: 'test-batch',
				attempt: 1,
				maxAttempts: 3,
				nextRetryDelay: 10,
			})
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
			expect(customTransport.retryCalls.length).toBe(1)
			expect(customTransport.retryCalls[0].entries.length).toBe(1)
		})

		test('should call onSendError after all retries fail', async () => {
			transport.shouldFail = true

			await expect(transport.testSendWithRetry([createEntry()])).rejects.toThrow(
				BatchTransportError,
			)

			expect(transport.errorCalls.length).toBe(1)
			expect(transport.errorCalls[0].error.cause).toBeInstanceOf(Error)
			expect(transport.errorCalls[0].error.cause?.message).toBe('Test send failure')
		})

		test('should support onError callback and non-throwing failure mode', async () => {
			const errors: Error[] = []
			const failedBatches: readonly LogEntry[][] = []
			const nonThrowingTransport = new TestBatchTransport({
				name: 'non-throwing',
				maxRetries: 1,
				retryDelay: 1,
				throwOnError: false,
				onError: (error, entries) => {
					errors.push(error)
					failedBatches.push(entries)
				},
			})
			nonThrowingTransport.shouldFail = true

			nonThrowingTransport.log(createEntry())
			await expect(nonThrowingTransport.flush()).resolves.toBeUndefined()

			expect(errors.length).toBe(1)
			expect(errors[0]).toBeInstanceOf(BatchTransportError)
			expect(failedBatches[0].length).toBe(1)
			expect(nonThrowingTransport.getStats().pendingRetry).toBe(1)

			await nonThrowingTransport.destroy().catch(() => {})
		})

		test('should support onRetry callback', async () => {
			const retries: BatchTransportRetryEvent[] = []
			const retryingTransport = new (class extends TestBatchTransport {
				private attempts = 0

				protected async send(entries: LogEntry[]): Promise<void> {
					this.attempts++
					if (this.attempts === 1) {
						throw new Error('Transient failure')
					}
					this.sendCalls.push(entries)
				}
			})({
				name: 'retry-callback',
				maxRetries: 2,
				retryDelay: 1,
				onRetry: (event) => retries.push(event),
			})

			retryingTransport.log(createEntry())
			await retryingTransport.flush()

			expect(retries.length).toBe(1)
			expect(retries[0].attempt).toBe(1)
			expect(retries[0].maxAttempts).toBe(2)
			expect(retries[0].nextRetryDelay).toBe(1)
			expect(retries[0].error.message).toBe('Transient failure')
			expect(retries[0].entries.length).toBe(1)
		})

		test('should ignore errors thrown by user callbacks', async () => {
			const consoleError = mock(() => {})
			const originalConsoleError = console.error
			console.error = consoleError

			try {
				const callbackTransport = new TestBatchTransport({
					name: 'callback-failure',
					batchSize: 2,
					maxBufferSize: 2,
					maxRetries: 2,
					retryDelay: 1,
					onRetry: () => {
						throw new Error('retry observer failed')
					},
					onError: () => {
						throw new Error('error observer failed')
					},
					onDrop: () => {
						throw new Error('drop observer failed')
					},
				})

				let releaseSend: (() => void) | undefined
				let sendCount = 0
				callbackTransport.send = async () => {
					sendCount++
					if (sendCount > 1) return
					await new Promise<void>((resolve) => {
						releaseSend = resolve
					})
				}

				callbackTransport.log(createEntry({ message: 'one' }))
				callbackTransport.log(createEntry({ message: 'two' }))
				await new Promise((resolve) => setTimeout(resolve, 10))

				expect(() => {
					callbackTransport.log(createEntry({ message: 'three' }))
					callbackTransport.log(createEntry({ message: 'four' }))
					callbackTransport.log(createEntry({ message: 'five' }))
				}).not.toThrow()

				releaseSend?.()
				await callbackTransport.destroy()

				const failingTransport = new TestBatchTransport({
					name: 'callback-error',
					maxRetries: 1,
					retryDelay: 1,
					onError: () => {
						throw new Error('error observer failed')
					},
				})
				failingTransport.shouldFail = true
				failingTransport.log(createEntry())

				await expect(failingTransport.flush()).rejects.toThrow(BatchTransportError)
				expect(consoleError).toHaveBeenCalled()
			} finally {
				console.error = originalConsoleError
			}
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
			expect(stats.maxBufferSize).toBe(10)
			expect(stats.utilization).toBe(0.2)
		})

		test('should report pendingRetry after all retries fail', async () => {
			transport.shouldFail = true

			transport.log(createEntry())
			transport.log(createEntry())
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

			const stats = transport.getStats()
			expect(stats.pendingRetry).toBe(2)
		})
	})

	describe('failed batch recovery', () => {
		test('should store failed entries for retry on next flush', async () => {
			transport.shouldFail = true

			transport.log(createEntry({ message: 'Entry 1' }))
			transport.log(createEntry({ message: 'Entry 2' }))
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

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
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

			expect(transport.getStats().pendingRetry).toBe(2)
			expect(transport.errorCalls.length).toBe(1)

			// Second flush also fails (includes first failed batch + new entries)
			transport.log(createEntry({ message: 'Batch 2 Entry 1' }))
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

			// Failed batch now contains all 3 entries (2 from first fail + 1 new)
			expect(transport.getStats().pendingRetry).toBe(3)
			expect(transport.errorCalls.length).toBe(2)

			// Third flush fails again
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

			// Still same 3 entries pending (no new entries added)
			expect(transport.getStats().pendingRetry).toBe(3)
			expect(transport.errorCalls.length).toBe(3)
		})

		test('should clear pendingRetry after successful flush', async () => {
			transport.shouldFail = true

			transport.log(createEntry())
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

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
			await expect(transport.flush()).rejects.toThrow(BatchTransportError)

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

		test('should allow larger buffers for bursty workloads', async () => {
			const burstTransport = new TestBatchTransport({
				name: 'burst',
				batchSize: 2,
				maxBufferSize: 6,
			})

			burstTransport.send = async () => {
				await new Promise(() => {})
			}

			for (let i = 0; i < 8; i++) {
				burstTransport.log(createEntry({ message: `Burst ${i}` }))
			}

			expect(burstTransport.getStats().buffered).toBe(6)
			expect(burstTransport.getStats().dropped).toBe(0)

			burstTransport.log(createEntry({ message: 'Burst 8' }))

			expect(burstTransport.getStats().buffered).toBe(6)
			expect(burstTransport.getStats().dropped).toBe(1)
		})
	})
})
