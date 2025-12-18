/**
 * Default sensitive field patterns
 */
const SENSITIVE_FIELDS = new Set([
	'password',
	'pass',
	'pwd',
	'secret',
	'token',
	'api_key',
	'apikey',
	'api-key',
	'access_token',
	'accesstoken',
	'refresh_token',
	'private_key',
	'privatekey',
	'credit_card',
	'creditcard',
	'card_number',
	'cvv',
	'ssn',
	'social_security',
	'authorization',
	'bearer',
	'session_id',
	'sessionid',
	'cookie',
	'auth',
])

/**
 * Patterns for detecting sensitive data in strings
 */
const SENSITIVE_PATTERNS: Array<{
	pattern: RegExp
	replacement: string | ((match: string) => string)
}> = [
	// Email (partial mask)
	{
		pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
		replacement: (match: string) => {
			const [local, domain] = match.split('@')
			if (!local || !domain) return '[EMAIL]'
			const maskedLocal = `${local.slice(0, 2)}***`
			return `${maskedLocal}@${domain}`
		},
	},
	// Credit card (show last 4)
	{
		pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
		replacement: (match: string) => {
			const digits = match.replace(/[- ]/g, '')
			return `****${digits.slice(-4)}`
		},
	},
	// JWT tokens
	{
		pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
		replacement: '[JWT_REDACTED]',
	},
]

/**
 * Maximum depth for sanitization recursion
 */
const MAX_DEPTH = 10

/**
 * Mask string for redacted values
 */
const REDACTED = '[REDACTED]'

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string, additionalFields: string[] = []): boolean {
	const lower = fieldName.toLowerCase()
	if (SENSITIVE_FIELDS.has(lower)) return true
	for (const field of additionalFields) {
		if (lower.includes(field.toLowerCase())) return true
	}
	return false
}

/**
 * Sanitize a string value using patterns
 */
function sanitizeString(value: string): string {
	let result = value
	for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
		if (typeof replacement === 'function') {
			result = result.replace(pattern, replacement)
		} else {
			result = result.replace(pattern, replacement)
		}
	}
	return result
}

/**
 * Sanitize a value recursively
 */
export function sanitize(value: unknown, additionalFields: string[] = [], depth = 0): unknown {
	if (depth > MAX_DEPTH) return value

	// Handle null/undefined
	if (value === null || value === undefined) return value

	// Handle strings
	if (typeof value === 'string') {
		return sanitizeString(value)
	}

	// Handle arrays
	if (Array.isArray(value)) {
		return value.map((item) => sanitize(item, additionalFields, depth + 1))
	}

	// Handle objects
	if (typeof value === 'object') {
		const result: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(value)) {
			if (isSensitiveField(key, additionalFields)) {
				result[key] = REDACTED
			} else {
				result[key] = sanitize(val, additionalFields, depth + 1)
			}
		}
		return result
	}

	// Return primitives as-is
	return value
}

/**
 * Create a sanitizer function with custom fields
 */
export function createSanitizer(additionalFields: string[] = []): (value: unknown) => unknown {
	return (value: unknown) => sanitize(value, additionalFields)
}
