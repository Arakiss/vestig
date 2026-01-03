import { describe, expect, test } from 'bun:test'
import {
	type TracestateEntry,
	createTracestate,
	deleteTracestateKey,
	getTracestateValue,
	parseTracestate,
	setTracestateValue,
} from '../context/correlation'

describe('parseTracestate', () => {
	describe('valid inputs', () => {
		test('should parse single entry', () => {
			const result = parseTracestate('vestig=abc123')
			expect(result).toEqual([{ key: 'vestig', value: 'abc123' }])
		})

		test('should parse multiple entries', () => {
			const result = parseTracestate('vestig=abc,dd=xyz,zipkin=123')
			expect(result).toHaveLength(3)
			expect(result[0]).toEqual({ key: 'vestig', value: 'abc' })
			expect(result[1]).toEqual({ key: 'dd', value: 'xyz' })
			expect(result[2]).toEqual({ key: 'zipkin', value: '123' })
		})

		test('should handle spaces around entries', () => {
			const result = parseTracestate('  vestig=abc  ,  dd=xyz  ')
			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({ key: 'vestig', value: 'abc' })
			expect(result[1]).toEqual({ key: 'dd', value: 'xyz' })
		})

		test('should parse multi-tenant key format', () => {
			const result = parseTracestate('vendor@tenant=value123')
			expect(result).toEqual([{ key: 'vendor@tenant', value: 'value123' }])
		})

		test('should allow hyphens in keys', () => {
			const result = parseTracestate('my-vendor=value')
			expect(result).toEqual([{ key: 'my-vendor', value: 'value' }])
		})

		test('should allow underscores in keys', () => {
			const result = parseTracestate('my_vendor=value')
			expect(result).toEqual([{ key: 'my_vendor', value: 'value' }])
		})

		test('should allow numbers in keys (not first char)', () => {
			const result = parseTracestate('vendor123=value')
			expect(result).toEqual([{ key: 'vendor123', value: 'value' }])
		})

		test('should allow colons in values', () => {
			const result = parseTracestate('dd=host:server-01')
			expect(result).toEqual([{ key: 'dd', value: 'host:server-01' }])
		})

		test('should allow slashes in values', () => {
			const result = parseTracestate('path=/api/v1/users')
			expect(result).toEqual([{ key: 'path', value: '/api/v1/users' }])
		})

		test('should allow special characters in values', () => {
			// Note: equals (=) is not allowed in values per W3C spec
			const result = parseTracestate('info=key:value;type-span')
			expect(result).toEqual([{ key: 'info', value: 'key:value;type-span' }])
		})
	})

	describe('invalid inputs', () => {
		test('should return empty array for empty string', () => {
			expect(parseTracestate('')).toEqual([])
		})

		test('should return empty array for null-ish inputs', () => {
			expect(parseTracestate(null as unknown as string)).toEqual([])
			expect(parseTracestate(undefined as unknown as string)).toEqual([])
		})

		test('should skip entries without equals sign', () => {
			const result = parseTracestate('vestig=abc,invalid,dd=xyz')
			expect(result).toHaveLength(2)
			expect(result[0]?.key).toBe('vestig')
			expect(result[1]?.key).toBe('dd')
		})

		test('should skip entries with uppercase keys', () => {
			const result = parseTracestate('VESTIG=abc,dd=xyz')
			expect(result).toHaveLength(1)
			expect(result[0]?.key).toBe('dd')
		})

		test('should skip entries with numeric first char in key', () => {
			const result = parseTracestate('123vendor=abc,dd=xyz')
			expect(result).toHaveLength(1)
			expect(result[0]?.key).toBe('dd')
		})

		test('should skip empty entries', () => {
			const result = parseTracestate('vestig=abc,,,dd=xyz')
			expect(result).toHaveLength(2)
		})

		test('should skip entries with empty values', () => {
			const result = parseTracestate('vestig=,dd=xyz')
			expect(result).toHaveLength(1)
			expect(result[0]?.key).toBe('dd')
		})

		test('should skip entries with empty keys', () => {
			const result = parseTracestate('=value,dd=xyz')
			expect(result).toHaveLength(1)
			expect(result[0]?.key).toBe('dd')
		})
	})

	describe('W3C spec compliance', () => {
		test('should limit to 32 entries maximum', () => {
			const entries = Array.from({ length: 40 }, (_, i) => `vendor${i}=value${i}`)
			const header = entries.join(',')
			const result = parseTracestate(header)
			expect(result).toHaveLength(32)
		})

		test('should reject keys longer than 256 characters', () => {
			const longKey = 'a'.repeat(257)
			const result = parseTracestate(`${longKey}=value`)
			expect(result).toHaveLength(0)
		})

		test('should reject values longer than 256 characters', () => {
			const longValue = 'a'.repeat(257)
			const result = parseTracestate(`vendor=${longValue}`)
			expect(result).toHaveLength(0)
		})

		test('should reject values with control characters', () => {
			const result = parseTracestate('vendor=value\x00invalid')
			expect(result).toHaveLength(0)
		})

		test('should reject values with tab characters', () => {
			const result = parseTracestate('vendor=value\ttab')
			expect(result).toHaveLength(0)
		})
	})
})

describe('createTracestate', () => {
	test('should create header from single entry', () => {
		const entries: TracestateEntry[] = [{ key: 'vestig', value: 'abc123' }]
		expect(createTracestate(entries)).toBe('vestig=abc123')
	})

	test('should create header from multiple entries', () => {
		const entries: TracestateEntry[] = [
			{ key: 'vestig', value: 'abc' },
			{ key: 'dd', value: 'xyz' },
		]
		expect(createTracestate(entries)).toBe('vestig=abc,dd=xyz')
	})

	test('should return empty string for empty array', () => {
		expect(createTracestate([])).toBe('')
	})

	test('should return empty string for null-ish input', () => {
		expect(createTracestate(null as unknown as TracestateEntry[])).toBe('')
		expect(createTracestate(undefined as unknown as TracestateEntry[])).toBe('')
	})

	test('should limit to 32 entries', () => {
		const entries: TracestateEntry[] = Array.from({ length: 40 }, (_, i) => ({
			key: `vendor${i}`,
			value: `value${i}`,
		}))
		const result = createTracestate(entries)
		const parsedBack = parseTracestate(result)
		expect(parsedBack).toHaveLength(32)
	})

	test('should filter out invalid entries', () => {
		const entries: TracestateEntry[] = [
			{ key: 'valid', value: 'ok' },
			{ key: 'INVALID', value: 'uppercase key' },
			{ key: 'valid2', value: 'ok2' },
		]
		expect(createTracestate(entries)).toBe('valid=ok,valid2=ok2')
	})

	test('should preserve multi-tenant key format', () => {
		const entries: TracestateEntry[] = [{ key: 'vendor@tenant', value: 'value' }]
		expect(createTracestate(entries)).toBe('vendor@tenant=value')
	})
})

describe('getTracestateValue', () => {
	const entries: TracestateEntry[] = [
		{ key: 'vestig', value: 'trace123' },
		{ key: 'dd', value: 'span456' },
		{ key: 'zipkin', value: 'ctx789' },
	]

	test('should find existing key', () => {
		expect(getTracestateValue(entries, 'vestig')).toBe('trace123')
		expect(getTracestateValue(entries, 'dd')).toBe('span456')
		expect(getTracestateValue(entries, 'zipkin')).toBe('ctx789')
	})

	test('should return undefined for non-existent key', () => {
		expect(getTracestateValue(entries, 'notfound')).toBeUndefined()
	})

	test('should return undefined for empty entries', () => {
		expect(getTracestateValue([], 'vestig')).toBeUndefined()
	})
})

describe('setTracestateValue', () => {
	test('should add new entry to empty array', () => {
		const result = setTracestateValue([], 'vestig', 'newvalue')
		expect(result).toHaveLength(1)
		expect(result[0]).toEqual({ key: 'vestig', value: 'newvalue' })
	})

	test('should prepend new entry (most recently updated first)', () => {
		const entries: TracestateEntry[] = [{ key: 'dd', value: 'existing' }]
		const result = setTracestateValue(entries, 'vestig', 'new')
		expect(result[0]).toEqual({ key: 'vestig', value: 'new' })
		expect(result[1]).toEqual({ key: 'dd', value: 'existing' })
	})

	test('should update existing entry and move to front', () => {
		const entries: TracestateEntry[] = [
			{ key: 'dd', value: 'first' },
			{ key: 'vestig', value: 'second' },
			{ key: 'zipkin', value: 'third' },
		]
		const result = setTracestateValue(entries, 'vestig', 'updated')
		expect(result[0]).toEqual({ key: 'vestig', value: 'updated' })
		expect(result[1]).toEqual({ key: 'dd', value: 'first' })
		expect(result[2]).toEqual({ key: 'zipkin', value: 'third' })
	})

	test('should limit to 32 entries after adding', () => {
		const entries: TracestateEntry[] = Array.from({ length: 32 }, (_, i) => ({
			key: `vendor${i}`,
			value: `value${i}`,
		}))
		const result = setTracestateValue(entries, 'newvendor', 'newvalue')
		expect(result).toHaveLength(32)
		expect(result[0]).toEqual({ key: 'newvendor', value: 'newvalue' })
	})
})

describe('deleteTracestateKey', () => {
	test('should remove existing key', () => {
		const entries: TracestateEntry[] = [
			{ key: 'vestig', value: 'a' },
			{ key: 'dd', value: 'b' },
			{ key: 'zipkin', value: 'c' },
		]
		const result = deleteTracestateKey(entries, 'dd')
		expect(result).toHaveLength(2)
		expect(result.find((e) => e.key === 'dd')).toBeUndefined()
		expect(result[0]).toEqual({ key: 'vestig', value: 'a' })
		expect(result[1]).toEqual({ key: 'zipkin', value: 'c' })
	})

	test('should return same array if key not found', () => {
		const entries: TracestateEntry[] = [{ key: 'vestig', value: 'a' }]
		const result = deleteTracestateKey(entries, 'notfound')
		expect(result).toHaveLength(1)
		expect(result[0]).toEqual({ key: 'vestig', value: 'a' })
	})

	test('should return empty array if last key deleted', () => {
		const entries: TracestateEntry[] = [{ key: 'vestig', value: 'a' }]
		const result = deleteTracestateKey(entries, 'vestig')
		expect(result).toHaveLength(0)
	})
})

describe('roundtrip (parse -> create)', () => {
	test('should preserve data through roundtrip', () => {
		const original = 'vestig=abc123,dd=span456,zipkin=ctx789'
		const parsed = parseTracestate(original)
		const recreated = createTracestate(parsed)
		expect(recreated).toBe(original)
	})

	test('should normalize spacing in roundtrip', () => {
		const original = '  vestig=abc  ,  dd=xyz  '
		const parsed = parseTracestate(original)
		const recreated = createTracestate(parsed)
		expect(recreated).toBe('vestig=abc,dd=xyz')
	})

	test('should handle complex values in roundtrip', () => {
		const original = 'dd=host:server-01/region:us-east'
		const parsed = parseTracestate(original)
		const recreated = createTracestate(parsed)
		expect(recreated).toBe(original)
	})
})

describe('integration scenarios', () => {
	test('should handle vendor-specific data propagation', () => {
		// Simulate receiving headers from upstream service
		const incoming = 'dd=host:server-01,vestig=trace-abc'
		const entries = parseTracestate(incoming)

		// Add/update our own vendor data
		const updated = setTracestateValue(entries, 'vestig', 'trace-xyz-local')

		// Create header for downstream
		const outgoing = createTracestate(updated)

		// Our entry should be first (most recently updated)
		expect(outgoing.startsWith('vestig=trace-xyz-local')).toBe(true)
		expect(outgoing).toContain('dd=host:server-01')
	})

	test('should handle adding to empty tracestate', () => {
		const entries: TracestateEntry[] = []

		// Add vestig entry
		let updated = setTracestateValue(entries, 'vestig', 'span-123')

		// Add additional context
		updated = setTracestateValue(updated, 'env', 'production')

		const header = createTracestate(updated)
		expect(header).toBe('env=production,vestig=span-123')
	})

	test('should handle removing vendor from propagated state', () => {
		const incoming = 'internal=secret,dd=public,vestig=context'
		const entries = parseTracestate(incoming)

		// Remove internal-only data before propagating externally
		const filtered = deleteTracestateKey(entries, 'internal')

		const outgoing = createTracestate(filtered)
		expect(outgoing).toBe('dd=public,vestig=context')
		expect(outgoing).not.toContain('internal')
	})
})

describe('exports from main package', () => {
	test('should export all tracestate utilities', async () => {
		const vestig = await import('../index')

		expect(vestig.parseTracestate).toBeDefined()
		expect(vestig.createTracestate).toBeDefined()
		expect(vestig.getTracestateValue).toBeDefined()
		expect(vestig.setTracestateValue).toBeDefined()
		expect(vestig.deleteTracestateKey).toBeDefined()
	})
})
