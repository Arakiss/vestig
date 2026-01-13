import { describe, expect, test } from 'bun:test'
import {
	OTLPSpanKind,
	OTLPStatusCode,
	isoToNano,
	msToNano,
	toOTLPAttributeValue,
	toOTLPAttributes,
	toOTLPSpan,
	toOTLPStatusCode,
} from '../../otlp/types'
import { SpanImpl } from '../../tracing/span'

describe('OTLP Type Conversions', () => {
	describe('toOTLPStatusCode', () => {
		test('should convert "ok" to OK', () => {
			expect(toOTLPStatusCode('ok')).toBe(OTLPStatusCode.OK)
		})

		test('should convert "error" to ERROR', () => {
			expect(toOTLPStatusCode('error')).toBe(OTLPStatusCode.ERROR)
		})

		test('should convert "unset" to UNSET', () => {
			expect(toOTLPStatusCode('unset')).toBe(OTLPStatusCode.UNSET)
		})
	})

	describe('toOTLPAttributeValue', () => {
		test('should convert string', () => {
			const result = toOTLPAttributeValue('hello')
			expect(result).toEqual({ stringValue: 'hello' })
		})

		test('should convert integer', () => {
			const result = toOTLPAttributeValue(42)
			expect(result).toEqual({ intValue: '42' })
		})

		test('should convert float', () => {
			const result = toOTLPAttributeValue(3.14)
			expect(result).toEqual({ doubleValue: 3.14 })
		})

		test('should convert boolean true', () => {
			const result = toOTLPAttributeValue(true)
			expect(result).toEqual({ boolValue: true })
		})

		test('should convert boolean false', () => {
			const result = toOTLPAttributeValue(false)
			expect(result).toEqual({ boolValue: false })
		})

		test('should convert array', () => {
			const result = toOTLPAttributeValue([1, 'two', true])
			expect(result).toEqual({
				arrayValue: {
					values: [{ intValue: '1' }, { stringValue: 'two' }, { boolValue: true }],
				},
			})
		})

		test('should convert object to kvlist', () => {
			const result = toOTLPAttributeValue({ name: 'test', count: 5 })
			expect(result).toEqual({
				kvlistValue: {
					values: [
						{ key: 'name', value: { stringValue: 'test' } },
						{ key: 'count', value: { intValue: '5' } },
					],
				},
			})
		})

		test('should convert null to empty string', () => {
			const result = toOTLPAttributeValue(null)
			expect(result).toEqual({ stringValue: '' })
		})

		test('should convert undefined to empty string', () => {
			const result = toOTLPAttributeValue(undefined)
			expect(result).toEqual({ stringValue: '' })
		})
	})

	describe('toOTLPAttributes', () => {
		test('should convert record to key-value pairs', () => {
			const result = toOTLPAttributes({
				'http.method': 'GET',
				'http.status_code': 200,
				'http.url': '/api/users',
			})

			expect(result).toEqual([
				{ key: 'http.method', value: { stringValue: 'GET' } },
				{ key: 'http.status_code', value: { intValue: '200' } },
				{ key: 'http.url', value: { stringValue: '/api/users' } },
			])
		})

		test('should skip undefined values', () => {
			const result = toOTLPAttributes({
				defined: 'yes',
				notDefined: undefined,
			})

			expect(result).toEqual([{ key: 'defined', value: { stringValue: 'yes' } }])
		})

		test('should handle empty object', () => {
			const result = toOTLPAttributes({})
			expect(result).toEqual([])
		})
	})

	describe('msToNano', () => {
		test('should convert milliseconds to nanoseconds', () => {
			expect(msToNano(1000)).toBe('1000000000')
		})

		test('should handle large timestamps', () => {
			// Current timestamp in ms (around 1.7 trillion)
			const ms = 1704067200000 // 2024-01-01 00:00:00 UTC
			expect(msToNano(ms)).toBe('1704067200000000000')
		})

		test('should handle zero', () => {
			expect(msToNano(0)).toBe('0')
		})

		test('should handle fractional milliseconds by rounding', () => {
			// Note: performance.now() can return fractional values
			expect(msToNano(1000.5)).toBe('1001000000') // Rounds to 1001ms
		})
	})

	describe('isoToNano', () => {
		test('should convert ISO string to nanoseconds', () => {
			const result = isoToNano('2024-01-01T00:00:00.000Z')
			expect(result).toBe('1704067200000000000')
		})

		test('should handle ISO string with timezone', () => {
			// Both should resolve to the same UTC time
			const utc = isoToNano('2024-01-01T00:00:00.000Z')
			const offset = isoToNano('2024-01-01T01:00:00.000+01:00')
			expect(utc).toBe(offset)
		})
	})

	describe('toOTLPSpan', () => {
		// Use a fixed epoch for testing
		const epochStartMs = Date.now() - 1000 // 1 second ago

		test('should convert basic span', () => {
			const span = new SpanImpl('test-operation')
			span.setStatus('ok')
			span.end()

			const otlpSpan = toOTLPSpan(span, epochStartMs)

			expect(otlpSpan.name).toBe('test-operation')
			expect(otlpSpan.traceId).toBe(span.traceId)
			expect(otlpSpan.spanId).toBe(span.spanId)
			expect(otlpSpan.kind).toBe(OTLPSpanKind.INTERNAL)
			expect(otlpSpan.status?.code).toBe(OTLPStatusCode.OK)
		})

		test('should include parent span ID when present', () => {
			const parent = new SpanImpl('parent')
			const child = new SpanImpl('child', { parentSpan: parent })
			child.end()
			parent.end()

			const otlpSpan = toOTLPSpan(child, epochStartMs)

			expect(otlpSpan.parentSpanId).toBe(parent.spanId)
		})

		test('should convert attributes', () => {
			const span = new SpanImpl('test')
			span.setAttribute('http.method', 'GET')
			span.setAttribute('http.status_code', 200)
			span.end()

			const otlpSpan = toOTLPSpan(span, epochStartMs)

			expect(otlpSpan.attributes).toEqual([
				{ key: 'http.method', value: { stringValue: 'GET' } },
				{ key: 'http.status_code', value: { intValue: '200' } },
			])
		})

		test('should convert events', () => {
			const span = new SpanImpl('test')
			span.addEvent('cache-hit', { key: 'user:123' })
			span.end()

			const otlpSpan = toOTLPSpan(span, epochStartMs)

			expect(otlpSpan.events).toBeDefined()
			expect(otlpSpan.events?.length).toBe(1)
			expect(otlpSpan.events?.[0].name).toBe('cache-hit')
			expect(otlpSpan.events?.[0].attributes).toEqual([
				{ key: 'key', value: { stringValue: 'user:123' } },
			])
		})

		test('should convert error status with message', () => {
			const span = new SpanImpl('test')
			span.setStatus('error', 'Database connection failed')
			span.end()

			const otlpSpan = toOTLPSpan(span, epochStartMs)

			expect(otlpSpan.status?.code).toBe(OTLPStatusCode.ERROR)
			expect(otlpSpan.status?.message).toBe('Database connection failed')
		})

		test('should have valid nanosecond timestamps', () => {
			const span = new SpanImpl('test')
			span.end()

			const otlpSpan = toOTLPSpan(span, epochStartMs)

			// Timestamps should be numeric strings
			expect(typeof otlpSpan.startTimeUnixNano).toBe('string')
			expect(typeof otlpSpan.endTimeUnixNano).toBe('string')

			// Should be parseable as bigint
			const start = BigInt(otlpSpan.startTimeUnixNano)
			const end = BigInt(otlpSpan.endTimeUnixNano)

			// End should be >= start
			expect(end >= start).toBe(true)
		})
	})
})
