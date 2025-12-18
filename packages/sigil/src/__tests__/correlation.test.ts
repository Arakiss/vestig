import { describe, expect, test } from 'bun:test'
import {
	createTraceparent,
	generateRequestId,
	generateSpanId,
	generateTraceId,
	parseTraceparent,
} from '../context/correlation'

describe('generateTraceId', () => {
	test('should generate 32 character hex string', () => {
		const traceId = generateTraceId()
		expect(traceId).toHaveLength(32)
		expect(/^[0-9a-f]{32}$/.test(traceId)).toBe(true)
	})

	test('should generate unique trace IDs', () => {
		const ids = new Set<string>()
		for (let i = 0; i < 100; i++) {
			ids.add(generateTraceId())
		}
		expect(ids.size).toBe(100)
	})
})

describe('generateSpanId', () => {
	test('should generate 16 character hex string', () => {
		const spanId = generateSpanId()
		expect(spanId).toHaveLength(16)
		expect(/^[0-9a-f]{16}$/.test(spanId)).toBe(true)
	})

	test('should generate unique span IDs', () => {
		const ids = new Set<string>()
		for (let i = 0; i < 100; i++) {
			ids.add(generateSpanId())
		}
		expect(ids.size).toBe(100)
	})
})

describe('generateRequestId', () => {
	test('should generate valid UUID v4', () => {
		const requestId = generateRequestId()
		// UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)).toBe(
			true,
		)
	})

	test('should generate unique request IDs', () => {
		const ids = new Set<string>()
		for (let i = 0; i < 100; i++) {
			ids.add(generateRequestId())
		}
		expect(ids.size).toBe(100)
	})
})

describe('parseTraceparent', () => {
	test('should parse valid traceparent header', () => {
		const result = parseTraceparent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')
		expect(result).toEqual({
			traceId: '0af7651916cd43dd8448eb211c80319c',
			spanId: 'b7ad6b7169203331',
		})
	})

	test('should return null for invalid version', () => {
		expect(parseTraceparent('01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).toBeNull()
	})

	test('should return null for wrong number of parts', () => {
		expect(parseTraceparent('00-traceId-spanId')).toBeNull()
		expect(
			parseTraceparent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01-extra'),
		).toBeNull()
	})

	test('should return null for wrong trace ID length', () => {
		expect(parseTraceparent('00-short-b7ad6b7169203331-01')).toBeNull()
		expect(parseTraceparent('00-0af7651916cd43dd8448eb211c80319c00-b7ad6b7169203331-01')).toBeNull()
	})

	test('should return null for wrong span ID length', () => {
		expect(parseTraceparent('00-0af7651916cd43dd8448eb211c80319c-short-01')).toBeNull()
		expect(parseTraceparent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b716920333100-01')).toBeNull()
	})

	test('should return null for empty string', () => {
		expect(parseTraceparent('')).toBeNull()
	})
})

describe('createTraceparent', () => {
	test('should create valid traceparent header', () => {
		const traceparent = createTraceparent('0af7651916cd43dd8448eb211c80319c', 'b7ad6b7169203331')
		expect(traceparent).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')
	})

	test('should be parseable by parseTraceparent', () => {
		const traceId = generateTraceId()
		const spanId = generateSpanId()
		const traceparent = createTraceparent(traceId, spanId)
		const parsed = parseTraceparent(traceparent)

		expect(parsed).toEqual({ traceId, spanId })
	})

	test('should use version 00 and flags 01', () => {
		const traceparent = createTraceparent('a'.repeat(32), 'b'.repeat(16))
		expect(traceparent.startsWith('00-')).toBe(true)
		expect(traceparent.endsWith('-01')).toBe(true)
	})
})
