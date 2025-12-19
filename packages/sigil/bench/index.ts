/**
 * Benchmark Suite for Vestig
 *
 * Compares Vestig's performance against Pino and Winston
 *
 * Run with: bun run bench
 */

import { bench, group, run } from 'mitata'
import pino from 'pino'
import winston from 'winston'
import { Sanitizer, createLogger } from '../src'

// Suppress console output during benchmarks
const nullDestination = pino.destination('/dev/null')

// Create a proper null stream for Winston
const { Writable } = require('node:stream')
const nullStream = new Writable({
	write(chunk: unknown, encoding: unknown, callback: () => void) {
		callback()
	},
})
const nullTransport = new winston.transports.Stream({ stream: nullStream })

// Create logger instances
const vestig = createLogger({ structured: true })
vestig.disable() // Disable output for fair comparison

const pinoLogger = pino({ level: 'info' }, nullDestination)

const winstonLogger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [nullTransport],
})

// Test data
const simpleMessage = 'Hello, world!'
const objectWithFields = {
	userId: 123,
	action: 'login',
	success: true,
	timestamp: Date.now(),
	ip: '192.168.1.1',
}
const nestedObject = {
	user: {
		id: 123,
		profile: {
			name: 'John Doe',
			email: 'john@example.com',
			settings: {
				theme: 'dark',
				notifications: true,
			},
		},
	},
	request: {
		method: 'POST',
		path: '/api/login',
		headers: {
			'content-type': 'application/json',
			'user-agent': 'Mozilla/5.0',
		},
	},
}
const sensitiveData = {
	password: 'secret123',
	email: 'user@example.com',
	creditCard: '4111-1111-1111-1111',
	apiKey: 'sk_live_abc123',
	normalField: 'normal value',
}

// Benchmark: Simple string logging
group('Simple string message', () => {
	bench('Vestig', () => {
		vestig.info(simpleMessage)
	})

	bench('Pino', () => {
		pinoLogger.info(simpleMessage)
	})

	bench('Winston', () => {
		winstonLogger.info(simpleMessage)
	})
})

// Benchmark: Object logging
group('Object with 5 fields', () => {
	bench('Vestig', () => {
		vestig.info('User action', objectWithFields)
	})

	bench('Pino', () => {
		pinoLogger.info(objectWithFields, 'User action')
	})

	bench('Winston', () => {
		winstonLogger.info('User action', objectWithFields)
	})
})

// Benchmark: Nested object logging
group('Nested object (3 levels)', () => {
	bench('Vestig', () => {
		vestig.info('Complex data', nestedObject)
	})

	bench('Pino', () => {
		pinoLogger.info(nestedObject, 'Complex data')
	})

	bench('Winston', () => {
		winstonLogger.info('Complex data', nestedObject)
	})
})

// Benchmark: Child logger creation
group('Child logger creation', () => {
	bench('Vestig', () => {
		const child = vestig.child('database')
		child.info('Query executed')
	})

	bench('Pino', () => {
		const child = pinoLogger.child({ namespace: 'database' })
		child.info('Query executed')
	})

	bench('Winston', () => {
		const child = winstonLogger.child({ namespace: 'database' })
		child.info('Query executed')
	})
})

// Benchmark: Sanitization (Vestig only - unique feature)
group('Sanitization (Vestig-specific)', () => {
	const sanitizer = Sanitizer.fromPreset('default')
	const gdprSanitizer = Sanitizer.fromPreset('gdpr')

	bench('Vestig (default preset)', () => {
		sanitizer.sanitize(sensitiveData)
	})

	bench('Vestig (GDPR preset)', () => {
		gdprSanitizer.sanitize(sensitiveData)
	})

	bench('Vestig (no sanitization)', () => {
		// Raw logging without sanitization
		vestig.info('Data', sensitiveData)
	})
})

// Benchmark: Error logging
group('Error logging with stack trace', () => {
	const error = new Error('Something went wrong')

	bench('Vestig', () => {
		vestig.error('Operation failed', { error })
	})

	bench('Pino', () => {
		pinoLogger.error({ err: error }, 'Operation failed')
	})

	bench('Winston', () => {
		winstonLogger.error('Operation failed', { error })
	})
})

// Run all benchmarks
console.log('\n📊 Vestig Performance Benchmark\n')
console.log('Comparing against Pino and Winston\n')
console.log('─'.repeat(60))

await run({
	colors: true,
	percentiles: false,
})

console.log('\n─'.repeat(60))
console.log('\n✨ Benchmark complete!\n')
