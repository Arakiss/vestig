import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { createLogger } from '../../logger'
import type { LogEntry, Transport, TransportConfig } from '../../types'
import { createWideEvent } from '../../wide-events/builder'
import type { WideEvent } from '../../wide-events/types'

/**
 * Mock transport for capturing emitted log entries
 */
class MockTransport implements Transport {
	readonly name = 'mock'
	readonly config: TransportConfig = { name: 'mock' }
	entries: LogEntry[] = []

	log(entry: LogEntry): void {
		this.entries.push(entry)
	}

	clear(): void {
		this.entries = []
	}
}

function createTestWideEvent(overrides: Partial<WideEvent> = {}): WideEvent {
	const event = createWideEvent({ type: 'http.request' })
	event.set('http', 'method', 'POST')
	event.set('http', 'path', '/api/test')
	event.set('user', 'id', 'user-123')
	return {
		...event.end({ status: 'success' }),
		...overrides,
	}
}

describe('Logger emitWideEvent', () => {
	let mockTransport: MockTransport

	beforeEach(() => {
		mockTransport = new MockTransport()
	})

	describe('basic emission', () => {
		test('should emit wide event through transports', () => {
			const logger = createLogger()
			logger.addTransport(mockTransport)

			const wideEvent = createTestWideEvent()
			logger.emitWideEvent(wideEvent)

			// Should have 1 entry from mock transport (plus the default console transport)
			expect(mockTransport.entries).toHaveLength(1)

			const entry = mockTransport.entries[0]
			expect(entry.message).toBe('[wide-event] http.request')
			expect(entry.level).toBe('info')
			expect(entry.metadata?.event_type).toBe('http.request')
			expect(entry.metadata?.status).toBe('success')
			expect(entry.metadata?.['http.method']).toBe('POST')
			expect(entry.metadata?.['http.path']).toBe('/api/test')
			expect(entry.metadata?.['user.id']).toBe('user-123')
		})

		test('should not emit when logger is disabled', () => {
			const logger = createLogger({ enabled: false })
			logger.addTransport(mockTransport)

			const wideEvent = createTestWideEvent()
			logger.emitWideEvent(wideEvent)

			expect(mockTransport.entries).toHaveLength(0)
		})

		test('should flatten nested fields to dot notation', () => {
			const logger = createLogger()
			logger.addTransport(mockTransport)

			const event = createWideEvent({ type: 'job.execute' })
			event.merge('job', { id: 'job-123', queue: 'emails', attempts: 3 })
			event.merge('performance', { cpu_ms: 150, memory_mb: 64 })

			logger.emitWideEvent(event.end({ status: 'success' }))

			const entry = mockTransport.entries[0]
			expect(entry.metadata?.['job.id']).toBe('job-123')
			expect(entry.metadata?.['job.queue']).toBe('emails')
			expect(entry.metadata?.['job.attempts']).toBe(3)
			expect(entry.metadata?.['performance.cpu_ms']).toBe(150)
			expect(entry.metadata?.['performance.memory_mb']).toBe(64)
		})

		test('should include error information for failed events', () => {
			const logger = createLogger()
			logger.addTransport(mockTransport)

			const testError = new Error('Connection timeout')
			const event = createWideEvent({ type: 'http.request' })
			event.set('http', 'status_code', 500)

			logger.emitWideEvent(event.end({ status: 'error', error: testError }))

			const entry = mockTransport.entries[0]
			expect(entry.level).toBe('error')
			expect(entry.metadata?.status).toBe('error')
			expect(entry.error?.name).toBe('Error')
			expect(entry.error?.message).toBe('Connection timeout')
		})

		test('should include context from wide event', () => {
			const logger = createLogger()
			logger.addTransport(mockTransport)

			const event = createWideEvent({
				type: 'http.request',
				context: {
					requestId: 'req-abc',
					traceId: 'trace-xyz',
					spanId: 'span-123',
					userId: 'user-456',
				},
			})

			logger.emitWideEvent(event.end({ status: 'success' }))

			const entry = mockTransport.entries[0]
			expect(entry.context?.requestId).toBe('req-abc')
			expect(entry.context?.traceId).toBe('trace-xyz')
			expect(entry.context?.spanId).toBe('span-123')
			expect(entry.context?.userId).toBe('user-456')
		})

		test('should include duration_ms in metadata', () => {
			const logger = createLogger()
			logger.addTransport(mockTransport)

			const wideEvent = createTestWideEvent({ duration_ms: 1234 })
			logger.emitWideEvent(wideEvent)

			const entry = mockTransport.entries[0]
			expect(entry.metadata?.duration_ms).toBe(1234)
		})
	})

	describe('tail sampling integration', () => {
		test('should emit all events when tail sampling is not configured', () => {
			const logger = createLogger()
			logger.addTransport(mockTransport)

			// Emit multiple success events
			for (let i = 0; i < 10; i++) {
				logger.emitWideEvent(createTestWideEvent())
			}

			expect(mockTransport.entries).toHaveLength(10)
		})

		test('should drop success events when successSampleRate is 0', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: true,
					successSampleRate: 0,
				},
			})
			logger.addTransport(mockTransport)

			logger.emitWideEvent(createTestWideEvent({ status: 'success' }))

			expect(mockTransport.entries).toHaveLength(0)
		})

		test('should always keep error events regardless of successSampleRate', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: true,
					successSampleRate: 0, // Would drop all success events
					alwaysKeepStatuses: ['error'],
				},
			})
			logger.addTransport(mockTransport)

			logger.emitWideEvent(createTestWideEvent({ status: 'error' }))

			expect(mockTransport.entries).toHaveLength(1)
			expect(mockTransport.entries[0].metadata?.status).toBe('error')
		})

		test('should always keep slow requests above threshold', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: true,
					successSampleRate: 0,
					slowThresholdMs: 1000,
				},
			})
			logger.addTransport(mockTransport)

			// Fast request - should be dropped
			logger.emitWideEvent(createTestWideEvent({ status: 'success', duration_ms: 500 }))

			// Slow request - should be kept
			logger.emitWideEvent(createTestWideEvent({ status: 'success', duration_ms: 2000 }))

			expect(mockTransport.entries).toHaveLength(1)
			expect(mockTransport.entries[0].metadata?.duration_ms).toBe(2000)
		})

		test('should always keep VIP users', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: true,
					successSampleRate: 0,
					vipUserIds: ['vip-user'],
				},
			})
			logger.addTransport(mockTransport)

			// Regular user - should be dropped
			logger.emitWideEvent(
				createTestWideEvent({
					status: 'success',
					context: { userId: 'regular-user' },
				}),
			)

			// VIP user - should be kept
			logger.emitWideEvent(
				createTestWideEvent({
					status: 'success',
					context: { userId: 'vip-user' },
				}),
			)

			expect(mockTransport.entries).toHaveLength(1)
			expect(mockTransport.entries[0].context?.userId).toBe('vip-user')
		})

		test('should always keep VIP tier users', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: true,
					successSampleRate: 0,
					vipTiers: ['enterprise'],
				},
			})
			logger.addTransport(mockTransport)

			// Free tier - should be dropped
			logger.emitWideEvent(
				createTestWideEvent({
					status: 'success',
					fields: { user: { subscription: 'free' } },
				}),
			)

			// Enterprise tier - should be kept
			logger.emitWideEvent(
				createTestWideEvent({
					status: 'success',
					fields: { user: { subscription: 'enterprise' } },
				}),
			)

			expect(mockTransport.entries).toHaveLength(1)
		})

		test('should sample probabilistically with successSampleRate', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: true,
					successSampleRate: 0.5, // 50% sampling
				},
			})
			logger.addTransport(mockTransport)

			// Emit many events
			for (let i = 0; i < 1000; i++) {
				logger.emitWideEvent(createTestWideEvent())
			}

			// Should have roughly 50% (allow 10% margin: 400-600)
			expect(mockTransport.entries.length).toBeGreaterThan(400)
			expect(mockTransport.entries.length).toBeLessThan(600)
		})

		test('should not sample when tail sampling is disabled', () => {
			const logger = createLogger({
				tailSampling: {
					enabled: false,
					successSampleRate: 0, // Would drop all if enabled
				},
			})
			logger.addTransport(mockTransport)

			logger.emitWideEvent(createTestWideEvent({ status: 'success' }))

			expect(mockTransport.entries).toHaveLength(1)
		})
	})

	describe('sanitization', () => {
		test('should sanitize wide event metadata when sanitize is enabled', () => {
			const logger = createLogger({
				sanitize: true,
				// Add custom sanitize fields for flattened wide event format
				sanitizeFields: ['user.password', 'auth.token', 'user.secret'],
			})
			logger.addTransport(mockTransport)

			const event = createWideEvent({ type: 'http.request' })
			event.set('user', 'password', 'secret123')
			event.set('user', 'name', 'John')
			event.set('auth', 'token', 'jwt-token-xyz')

			logger.emitWideEvent(event.end({ status: 'success' }))

			const entry = mockTransport.entries[0]
			expect(entry.metadata?.['user.password']).toBe('[REDACTED]')
			expect(entry.metadata?.['user.name']).toBe('John')
			expect(entry.metadata?.['auth.token']).toBe('[REDACTED]')
		})
	})

	describe('transport filtering', () => {
		test('should respect transport level filter', () => {
			const logger = createLogger()
			const errorOnlyTransport: Transport = {
				name: 'error-only',
				config: { name: 'error-only', level: 'error' },
				log: mock(() => {}),
			}
			logger.addTransport(errorOnlyTransport)

			// Info level wide event - should not go to error-only transport
			logger.emitWideEvent(createTestWideEvent({ level: 'info' }))
			expect(errorOnlyTransport.log).not.toHaveBeenCalled()

			// Error level wide event - should go to transport
			logger.emitWideEvent(createTestWideEvent({ level: 'error', status: 'error' }))
			expect(errorOnlyTransport.log).toHaveBeenCalled()
		})

		test('should respect transport enabled flag', () => {
			const logger = createLogger()
			const disabledTransport: Transport = {
				name: 'disabled',
				config: { name: 'disabled', enabled: false },
				log: mock(() => {}),
			}
			logger.addTransport(disabledTransport)

			logger.emitWideEvent(createTestWideEvent())

			expect(disabledTransport.log).not.toHaveBeenCalled()
		})

		test('should respect transport filter function', () => {
			const logger = createLogger()
			const filteredTransport: Transport = {
				name: 'filtered',
				config: {
					name: 'filtered',
					filter: (entry) => entry.metadata?.['http.method'] === 'GET',
				},
				log: mock(() => {}),
			}
			logger.addTransport(filteredTransport)

			// POST request - should be filtered out
			const postEvent = createWideEvent({ type: 'http.request' })
			postEvent.set('http', 'method', 'POST')
			logger.emitWideEvent(postEvent.end({ status: 'success' }))
			expect(filteredTransport.log).not.toHaveBeenCalled()

			// GET request - should pass filter
			const getEvent = createWideEvent({ type: 'http.request' })
			getEvent.set('http', 'method', 'GET')
			logger.emitWideEvent(getEvent.end({ status: 'success' }))
			expect(filteredTransport.log).toHaveBeenCalled()
		})
	})

	describe('namespace handling', () => {
		test('should include logger namespace in emitted entry', () => {
			const logger = createLogger({ namespace: 'api' })
			logger.addTransport(mockTransport)

			logger.emitWideEvent(createTestWideEvent())

			const entry = mockTransport.entries[0]
			expect(entry.namespace).toBe('api')
		})

		test('child logger should include its namespace', () => {
			const logger = createLogger({ namespace: 'api' })
			const child = logger.child('auth')
			child.addTransport(mockTransport)

			child.emitWideEvent(createTestWideEvent())

			const entry = mockTransport.entries[0]
			// Child loggers use ':' separator, not '.'
			expect(entry.namespace).toBe('api:auth')
		})
	})
})
