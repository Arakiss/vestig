import { describe, expect, test } from 'bun:test'
import {
	createQueryLogEntry,
	extractAllTableNames,
	formatDuration,
	mergeConfig,
} from '../../db/query-logger'

describe('formatDuration', () => {
	test('should format microseconds', () => {
		expect(formatDuration(0.5)).toBe('500μs')
		expect(formatDuration(0.001)).toBe('1μs')
	})

	test('should format milliseconds', () => {
		expect(formatDuration(1)).toBe('1.00ms')
		expect(formatDuration(100.5)).toBe('100.50ms')
		expect(formatDuration(999.99)).toBe('999.99ms')
	})

	test('should format seconds', () => {
		expect(formatDuration(1000)).toBe('1.00s')
		expect(formatDuration(2500)).toBe('2.50s')
	})
})

describe('mergeConfig', () => {
	test('should return defaults when no config provided', () => {
		const config = mergeConfig()
		expect(config.slowQueryThreshold).toBe(100)
		expect(config.sanitizeParams).toBe(true)
		expect(config.namespace).toBe('db')
	})

	test('should merge custom config', () => {
		const config = mergeConfig({
			slowQueryThreshold: 200,
			namespace: 'custom-db',
		})
		expect(config.slowQueryThreshold).toBe(200)
		expect(config.namespace).toBe('custom-db')
		expect(config.sanitizeParams).toBe(true) // default preserved
	})
})

describe('createQueryLogEntry', () => {
	const config = mergeConfig()

	describe('table extraction', () => {
		test('should extract table from SELECT query', () => {
			const entry = createQueryLogEntry('SELECT * FROM users WHERE id = $1', [1], 10, config)
			expect(entry.table).toBe('users')
			expect(entry.operation).toBe('SELECT')
		})

		test('should extract table from INSERT query', () => {
			const entry = createQueryLogEntry(
				'INSERT INTO users (name, email) VALUES ($1, $2)',
				['John', 'john@example.com'],
				5,
				config,
			)
			expect(entry.table).toBe('users')
			expect(entry.operation).toBe('INSERT')
		})

		test('should extract table from UPDATE query', () => {
			const entry = createQueryLogEntry(
				'UPDATE users SET name = $1 WHERE id = $2',
				['Jane', 1],
				8,
				config,
			)
			expect(entry.table).toBe('users')
			expect(entry.operation).toBe('UPDATE')
		})

		test('should extract table from DELETE query', () => {
			const entry = createQueryLogEntry('DELETE FROM users WHERE id = $1', [1], 3, config)
			expect(entry.table).toBe('users')
			expect(entry.operation).toBe('DELETE')
		})

		test('should handle schema-qualified table names', () => {
			const entry = createQueryLogEntry('SELECT * FROM public.users WHERE id = $1', [1], 10, config)
			expect(entry.table).toBe('public.users')
		})

		test('should handle quoted table names', () => {
			const entry = createQueryLogEntry('SELECT * FROM "Users" WHERE id = $1', [1], 10, config)
			expect(entry.table).toBe('Users')
		})

		test('should handle backtick quoted table names (MySQL)', () => {
			const entry = createQueryLogEntry('SELECT * FROM `users` WHERE id = $1', [1], 10, config)
			expect(entry.table).toBe('users')
		})

		test('should handle multiline queries', () => {
			const query = `
				SELECT *
				FROM users
				WHERE id = $1
				AND status = 'active'
			`
			const entry = createQueryLogEntry(query, [1], 10, config)
			expect(entry.table).toBe('users')
		})

		test('should handle TRUNCATE query', () => {
			const entry = createQueryLogEntry('TRUNCATE users', [], 50, config)
			expect(entry.table).toBe('users')
		})

		test('should handle TRUNCATE TABLE query', () => {
			const entry = createQueryLogEntry('TRUNCATE TABLE users', [], 50, config)
			expect(entry.table).toBe('users')
		})
	})

	describe('slow query detection', () => {
		test('should mark slow queries', () => {
			const entry = createQueryLogEntry('SELECT * FROM users', [], 150, config)
			expect(entry.isSlow).toBe(true)
		})

		test('should not mark fast queries as slow', () => {
			const entry = createQueryLogEntry('SELECT * FROM users', [], 50, config)
			expect(entry.isSlow).toBe(false)
		})

		test('should respect custom threshold', () => {
			const customConfig = mergeConfig({ slowQueryThreshold: 50 })
			const entry = createQueryLogEntry('SELECT * FROM users', [], 75, customConfig)
			expect(entry.isSlow).toBe(true)
		})
	})

	describe('query truncation', () => {
		test('should truncate long queries', () => {
			const longQuery = `SELECT * FROM users WHERE ${'x'.repeat(2000)}`
			const entry = createQueryLogEntry(longQuery, [], 10, config)
			expect(entry.query.length).toBeLessThan(longQuery.length)
			expect(entry.query).toContain('[truncated]')
		})

		test('should not truncate short queries', () => {
			const shortQuery = 'SELECT * FROM users'
			const entry = createQueryLogEntry(shortQuery, [], 10, config)
			expect(entry.query).toBe(shortQuery)
		})
	})

	describe('parameter sanitization', () => {
		test('should redact password-related params', () => {
			const entry = createQueryLogEntry(
				'UPDATE users SET password = $1 WHERE id = $2',
				['secret123', 1],
				10,
				config,
			)
			expect(entry.params?.[0]).toBe('[REDACTED]')
			expect(entry.params?.[1]).toBe(1)
		})

		test('should redact object properties with sensitive names', () => {
			const entry = createQueryLogEntry(
				'INSERT INTO users',
				[{ name: 'John', password: 'secret' }],
				10,
				config,
			)
			expect(entry.params?.[0]).toEqual({ name: 'John', password: '[REDACTED]' })
		})

		test('should preserve non-sensitive params', () => {
			const entry = createQueryLogEntry('SELECT * FROM users WHERE name = $1', ['John'], 10, config)
			expect(entry.params?.[0]).toBe('John')
		})

		test('should skip sanitization when disabled', () => {
			const noSanitizeConfig = mergeConfig({ sanitizeParams: false })
			const entry = createQueryLogEntry(
				'UPDATE users SET password = $1',
				['secret123'],
				10,
				noSanitizeConfig,
			)
			expect(entry.params?.[0]).toBe('secret123')
		})
	})

	describe('context', () => {
		test('should include context when provided', () => {
			const entry = createQueryLogEntry('SELECT * FROM users', [], 10, config, {
				requestId: 'req-123',
				traceId: 'trace-456',
			})
			expect(entry.context?.requestId).toBe('req-123')
			expect(entry.context?.traceId).toBe('trace-456')
		})
	})
})

describe('extractAllTableNames', () => {
	test('should extract single table from SELECT', () => {
		const tables = extractAllTableNames('SELECT * FROM users')
		expect(tables).toEqual(['users'])
	})

	test('should extract tables from JOIN query', () => {
		const tables = extractAllTableNames(
			'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id',
		)
		expect(tables).toContain('users')
		expect(tables).toContain('orders')
	})

	test('should extract tables from multiple JOINs', () => {
		const tables = extractAllTableNames(`
			SELECT u.name, o.total, p.name as product
			FROM users u
			LEFT JOIN orders o ON u.id = o.user_id
			INNER JOIN order_items oi ON o.id = oi.order_id
			JOIN products p ON oi.product_id = p.id
		`)
		expect(tables).toContain('users')
		expect(tables).toContain('orders')
		expect(tables).toContain('order_items')
		expect(tables).toContain('products')
	})

	test('should extract schema-qualified tables', () => {
		const tables = extractAllTableNames('SELECT * FROM public.users JOIN auth.sessions ON ...')
		expect(tables).toContain('public.users')
		expect(tables).toContain('auth.sessions')
	})

	test('should extract tables from INSERT', () => {
		const tables = extractAllTableNames('INSERT INTO users (name) VALUES ($1)')
		expect(tables).toContain('users')
	})

	test('should extract tables from UPDATE', () => {
		const tables = extractAllTableNames('UPDATE users SET name = $1')
		expect(tables).toContain('users')
	})

	test('should extract tables from DELETE', () => {
		const tables = extractAllTableNames('DELETE FROM users WHERE id = $1')
		expect(tables).toContain('users')
	})

	test('should handle quoted identifiers', () => {
		const tables = extractAllTableNames('SELECT * FROM "Users" JOIN `orders` ON ...')
		expect(tables).toContain('Users')
		expect(tables).toContain('orders')
	})

	test('should deduplicate table names', () => {
		const tables = extractAllTableNames(
			'SELECT * FROM users WHERE id IN (SELECT user_id FROM users)',
		)
		expect(tables.filter((t) => t === 'users').length).toBe(1)
	})
})
