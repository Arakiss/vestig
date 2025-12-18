import { describe, expect, test } from 'bun:test'
import { createSanitizer, sanitize } from '../utils/sanitize'

describe('sanitize', () => {
	describe('sensitive field detection', () => {
		test('should redact password fields', () => {
			const result = sanitize({ password: 'secret123' })
			expect(result).toEqual({ password: '[REDACTED]' })
		})

		test('should redact various password variations', () => {
			const result = sanitize({
				password: 'secret',
				pass: 'secret',
				pwd: 'secret',
			})
			expect(result).toEqual({
				password: '[REDACTED]',
				pass: '[REDACTED]',
				pwd: '[REDACTED]',
			})
		})

		test('should redact token fields', () => {
			const result = sanitize({
				token: 'abc123',
				access_token: 'xyz789',
				accesstoken: 'def456',
				refresh_token: 'ghi012',
			})
			expect(result).toEqual({
				token: '[REDACTED]',
				access_token: '[REDACTED]',
				accesstoken: '[REDACTED]',
				refresh_token: '[REDACTED]',
			})
		})

		test('should redact API key fields', () => {
			const result = sanitize({
				api_key: 'key123',
				apikey: 'key456',
				'api-key': 'key789',
			})
			expect(result).toEqual({
				api_key: '[REDACTED]',
				apikey: '[REDACTED]',
				'api-key': '[REDACTED]',
			})
		})

		test('should redact authorization fields', () => {
			const result = sanitize({
				authorization: 'Bearer token',
				bearer: 'token123',
				auth: 'credentials',
			})
			expect(result).toEqual({
				authorization: '[REDACTED]',
				bearer: '[REDACTED]',
				auth: '[REDACTED]',
			})
		})

		test('should redact session fields', () => {
			const result = sanitize({
				session_id: 'sess123',
				sessionid: 'sess456',
				cookie: 'session=abc',
			})
			expect(result).toEqual({
				session_id: '[REDACTED]',
				sessionid: '[REDACTED]',
				cookie: '[REDACTED]',
			})
		})

		test('should redact secret and key fields', () => {
			const result = sanitize({
				secret: 'mysecret',
				private_key: 'privatekey123',
				privatekey: 'privatekey456',
			})
			expect(result).toEqual({
				secret: '[REDACTED]',
				private_key: '[REDACTED]',
				privatekey: '[REDACTED]',
			})
		})

		test('should redact financial fields', () => {
			const result = sanitize({
				credit_card: '1234567890123456',
				creditcard: '1234567890123456',
				card_number: '1234567890123456',
				cvv: '123',
				ssn: '123-45-6789',
				social_security: '123-45-6789',
			})
			expect(result).toEqual({
				credit_card: '[REDACTED]',
				creditcard: '[REDACTED]',
				card_number: '[REDACTED]',
				cvv: '[REDACTED]',
				ssn: '[REDACTED]',
				social_security: '[REDACTED]',
			})
		})

		test('should be case-insensitive for field names', () => {
			const result = sanitize({
				PASSWORD: 'secret',
				Token: 'abc123',
				API_KEY: 'key123',
			})
			expect(result).toEqual({
				PASSWORD: '[REDACTED]',
				Token: '[REDACTED]',
				API_KEY: '[REDACTED]',
			})
		})
	})

	describe('pattern-based sanitization', () => {
		test('should partially mask email addresses', () => {
			const result = sanitize({ email: 'john.doe@example.com' })
			expect(result).toEqual({ email: 'jo***@example.com' })
		})

		test('should mask email in strings', () => {
			const result = sanitize('Contact: john.doe@example.com')
			expect(result).toBe('Contact: jo***@example.com')
		})

		test('should mask multiple emails in string', () => {
			const result = sanitize('From: alice@test.com To: bob@example.org')
			expect(result).toBe('From: al***@test.com To: bo***@example.org')
		})

		test('should mask credit card numbers', () => {
			const result = sanitize({ card: '1234 5678 9012 3456' })
			expect(result).toEqual({ card: '****3456' })
		})

		test('should mask credit cards with different formats', () => {
			expect(sanitize('Card: 1234-5678-9012-3456')).toBe('Card: ****3456')
			expect(sanitize('Card: 1234567890123456')).toBe('Card: ****3456')
		})

		test('should redact JWT tokens', () => {
			const jwt =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
			// Note: 'token' is a sensitive field, so it gets redacted first
			// For JWT detection, use a non-sensitive field name
			const result = sanitize({ jwtValue: jwt })
			expect(result).toEqual({ jwtValue: '[JWT_REDACTED]' })
		})

		test('should redact JWT in strings', () => {
			const jwt =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
			const result = sanitize(`Bearer ${jwt}`)
			expect(result).toBe('Bearer [JWT_REDACTED]')
		})
	})

	describe('nested object sanitization', () => {
		test('should sanitize nested objects', () => {
			const result = sanitize({
				user: {
					name: 'John',
					credentials: {
						password: 'secret',
						token: 'abc123',
					},
				},
			})
			expect(result).toEqual({
				user: {
					name: 'John',
					credentials: {
						password: '[REDACTED]',
						token: '[REDACTED]',
					},
				},
			})
		})

		test('should sanitize arrays', () => {
			const result = sanitize([{ password: 'secret1' }, { password: 'secret2' }])
			expect(result).toEqual([{ password: '[REDACTED]' }, { password: '[REDACTED]' }])
		})

		test('should sanitize arrays of strings', () => {
			const result = sanitize(['user@example.com', 'other@test.com'])
			expect(result).toEqual(['us***@example.com', 'ot***@test.com'])
		})

		test('should handle deeply nested structures', () => {
			const result = sanitize({
				level1: {
					level2: {
						level3: {
							password: 'deep-secret',
						},
					},
				},
			})
			expect(result).toEqual({
				level1: {
					level2: {
						level3: {
							password: '[REDACTED]',
						},
					},
				},
			})
		})
	})

	describe('primitive values', () => {
		test('should return null/undefined as-is', () => {
			expect(sanitize(null)).toBeNull()
			expect(sanitize(undefined)).toBeUndefined()
		})

		test('should return numbers as-is', () => {
			expect(sanitize(123)).toBe(123)
			expect(sanitize(0)).toBe(0)
			expect(sanitize(-1)).toBe(-1)
		})

		test('should return booleans as-is', () => {
			expect(sanitize(true)).toBe(true)
			expect(sanitize(false)).toBe(false)
		})

		test('should sanitize strings', () => {
			expect(sanitize('plain text')).toBe('plain text')
		})
	})

	describe('additional fields', () => {
		test('should redact custom additional fields', () => {
			const result = sanitize({ customSecret: 'value', other: 'safe' }, ['customSecret'])
			expect(result).toEqual({
				customSecret: '[REDACTED]',
				other: 'safe',
			})
		})

		test('should match partial field names with additional fields', () => {
			const result = sanitize(
				{
					myCustomSecretKey: 'secret',
					normalField: 'value',
				},
				['custom'],
			)
			expect(result).toEqual({
				myCustomSecretKey: '[REDACTED]',
				normalField: 'value',
			})
		})
	})

	describe('max depth protection', () => {
		test('should handle circular-like deep nesting', () => {
			// Create a very deep structure (but not circular)
			let obj: Record<string, unknown> = { value: 'deep' }
			for (let i = 0; i < 15; i++) {
				obj = { nested: obj }
			}

			// Should not throw
			const result = sanitize(obj)
			expect(result).toBeDefined()
		})
	})
})

describe('createSanitizer', () => {
	test('should create a sanitizer function', () => {
		const customSanitizer = createSanitizer(['customField'])
		expect(typeof customSanitizer).toBe('function')
	})

	test('should sanitize with custom fields', () => {
		const customSanitizer = createSanitizer(['mySecret'])
		const result = customSanitizer({ mySecret: 'value', other: 'safe' })
		expect(result).toEqual({
			mySecret: '[REDACTED]',
			other: 'safe',
		})
	})

	test('should still apply default sensitive fields', () => {
		const customSanitizer = createSanitizer(['custom'])
		const result = customSanitizer({
			password: 'secret',
			custom: 'value',
			other: 'safe',
		})
		expect(result).toEqual({
			password: '[REDACTED]',
			custom: '[REDACTED]',
			other: 'safe',
		})
	})

	test('should work with empty additional fields', () => {
		const sanitizer = createSanitizer([])
		const result = sanitizer({ password: 'secret' })
		expect(result).toEqual({ password: '[REDACTED]' })
	})
})
