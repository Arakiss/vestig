/**
 * Benchmark Suite for Sigil
 *
 * Compares Sigil's performance against Pino and Winston
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
const sigil = createLogger({ structured: true })
sigil.disable() // Disable output for fair comparison

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
	bench('Sigil', () => {
		sigil.info(simpleMessage)
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
	bench('Sigil', () => {
		sigil.info('User action', objectWithFields)
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
	bench('Sigil', () => {
		sigil.info('Complex data', nestedObject)
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
	bench('Sigil', () => {
		const child = sigil.child('database')
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

// Benchmark: Sanitization (Sigil only - unique feature)
group('Sanitization (Sigil-specific)', () => {
	const sanitizer = Sanitizer.fromPreset('default')
	const gdprSanitizer = Sanitizer.fromPreset('gdpr')

	bench('Sigil (default preset)', () => {
		sanitizer.sanitize(sensitiveData)
	})

	bench('Sigil (GDPR preset)', () => {
		gdprSanitizer.sanitize(sensitiveData)
	})

	bench('Sigil (no sanitization)', () => {
		// Raw logging without sanitization
		sigil.info('Data', sensitiveData)
	})
})

// Benchmark: Error logging
group('Error logging with stack trace', () => {
	const error = new Error('Something went wrong')

	bench('Sigil', () => {
		sigil.error('Operation failed', { error })
	})

	bench('Pino', () => {
		pinoLogger.error({ err: error }, 'Operation failed')
	})

	bench('Winston', () => {
		winstonLogger.error('Operation failed', { error })
	})
})

// Run all benchmarks
console.log('\n📊 Sigil Performance Benchmark\n')
console.log('Comparing against Pino and Winston\n')
console.log('─'.repeat(60))

await run({
	colors: true,
	percentiles: false,
})

console.log('\n─'.repeat(60))
console.log('\n✨ Benchmark complete!\n')
