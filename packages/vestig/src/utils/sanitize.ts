import type { FieldMatcher, SanitizeConfig, SanitizePattern, SanitizePreset } from '../types'
import { COMMON_PATTERNS, getPreset, mergeConfigs } from './sanitize-presets'

/**
 * Default replacement string
 */
const DEFAULT_REPLACEMENT = '[REDACTED]'

/**
 * Default maximum recursion depth
 */
const DEFAULT_MAX_DEPTH = 10

/**
 * Configurable sanitizer for PII and sensitive data
 *
 * @example
 * ```typescript
 * // Using a preset
 * const sanitizer = Sanitizer.fromPreset('gdpr')
 * const safe = sanitizer.sanitize({ email: 'user@example.com', password: 'secret' })
 *
 * // Custom configuration
 * const sanitizer = new Sanitizer({
 *   fields: ['customSecret', { type: 'prefix', value: 'private_' }],
 *   patterns: [{ name: 'custom', pattern: /secret-\w+/g, replacement: '[SECRET]' }],
 * })
 * ```
 */
export class Sanitizer {
	private readonly config: Required<SanitizeConfig>
	private readonly fieldSet: Set<string>
	private readonly fieldMatchers: FieldMatcher[]

	constructor(config: SanitizeConfig = {}) {
		this.config = {
			enabled: config.enabled ?? true,
			fields: config.fields ?? [],
			patterns: config.patterns ?? [],
			replacement: config.replacement ?? DEFAULT_REPLACEMENT,
			depth: config.depth ?? DEFAULT_MAX_DEPTH,
		}

		// Separate simple fields from matchers for faster lookup
		this.fieldSet = new Set<string>()
		this.fieldMatchers = []

		for (const field of this.config.fields) {
			if (typeof field === 'string') {
				this.fieldSet.add(field.toLowerCase())
			} else {
				this.fieldMatchers.push(field)
			}
		}
	}

	/**
	 * Create a sanitizer from a preset
	 */
	static fromPreset(preset: SanitizePreset): Sanitizer {
		return new Sanitizer(getPreset(preset))
	}

	/**
	 * Create a sanitizer by merging a preset with custom config
	 */
	static fromPresetWithOverrides(
		preset: SanitizePreset,
		overrides: Partial<SanitizeConfig>,
	): Sanitizer {
		return new Sanitizer(mergeConfigs(getPreset(preset), overrides))
	}

	/**
	 * Sanitize a value recursively
	 */
	sanitize<T>(value: T): T {
		if (!this.config.enabled) return value
		return this.sanitizeValue(value, 0, '') as T
	}

	/**
	 * Add a field to sanitize
	 */
	addField(field: string | FieldMatcher): void {
		this.config.fields.push(field)
		if (typeof field === 'string') {
			this.fieldSet.add(field.toLowerCase())
		} else {
			this.fieldMatchers.push(field)
		}
	}

	/**
	 * Add a pattern to sanitize
	 */
	addPattern(pattern: SanitizePattern): void {
		this.config.patterns.push(pattern)
	}

	/**
	 * Check if a field name or path should be sanitized
	 *
	 * Supports:
	 * - Simple field names: 'password' matches any field named 'password'
	 * - Dot notation paths: 'user.password' matches password under user
	 * - Glob patterns: '**.password' matches password at any depth
	 * - Wildcard: 'config.*' matches any direct child of config
	 */
	private isSensitiveField(fieldName: string, path: string): boolean {
		const lower = fieldName.toLowerCase()
		const fullPath = path ? `${path}.${fieldName}` : fieldName
		const fullPathLower = fullPath.toLowerCase()

		// Check simple field set (matches by key name or full path)
		if (this.fieldSet.has(lower)) return true
		if (this.fieldSet.has(fullPathLower)) return true

		// Check field matchers
		for (const matcher of this.fieldMatchers) {
			// Check against key name
			if (this.matchField(lower, matcher)) return true
			// Check against full path
			if (this.matchFieldPath(fullPathLower, matcher)) return true
		}

		return false
	}

	/**
	 * Match a field path against a FieldMatcher with glob support
	 */
	private matchFieldPath(path: string, matcher: FieldMatcher): boolean {
		const value = matcher.caseSensitive ? matcher.value : matcher.value.toLowerCase()
		const targetPath = matcher.caseSensitive ? path : path.toLowerCase()

		// Handle glob patterns
		if (value.includes('**') || value.includes('*')) {
			return this.matchGlobPattern(targetPath, value)
		}

		// For non-glob patterns, check if the pattern matches the full path
		switch (matcher.type) {
			case 'exact':
				return targetPath === value
			case 'prefix':
				return targetPath.startsWith(value)
			case 'suffix':
				return targetPath.endsWith(value)
			case 'contains':
				return targetPath.includes(value)
			case 'regex':
				return new RegExp(matcher.value, matcher.caseSensitive ? '' : 'i').test(path)
			default:
				return false
		}
	}

	/**
	 * Match a path against a glob pattern
	 *
	 * Supports:
	 * - ** matches any number of path segments (including zero)
	 * - * matches exactly one path segment
	 */
	private matchGlobPattern(path: string, pattern: string): boolean {
		const segments = pattern.split('.')
		const regexParts: string[] = []
		let addDotPrefix = false // Track if next segment needs a dot prefix

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i] as string // Always defined within loop bounds
			const isLast = i === segments.length - 1

			if (segment === '**') {
				// ** matches any number of segments (including zero)
				if (i === 0 && isLast) {
					// Just "**" matches everything
					regexParts.push('.*')
				} else if (i === 0) {
					// "**.foo" - optional prefix with dot included
					regexParts.push('(?:.*\\.)?')
					// Don't add dot prefix to next segment - it's included in (?:.*\.)?
				} else if (isLast) {
					// "foo.**" - match foo followed by anything
					regexParts.push('(?:\\..*)?')
				} else {
					// "foo.**.bar" - match zero or more segments in between
					regexParts.push('(?:\\.[^.]+)*')
					addDotPrefix = true
				}
			} else if (segment === '*') {
				// * matches exactly one segment
				if (addDotPrefix) {
					regexParts.push('\\.[^.]+')
				} else {
					regexParts.push('[^.]+')
				}
				addDotPrefix = true
			} else {
				// Literal segment
				const escaped = segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
				if (addDotPrefix) {
					regexParts.push(`\\.${escaped}`)
				} else {
					regexParts.push(escaped)
				}
				addDotPrefix = true
			}
		}

		const regexPattern = regexParts.join('')
		return new RegExp(`^${regexPattern}$`, 'i').test(path)
	}

	/**
	 * Match a field against a FieldMatcher
	 */
	private matchField(fieldName: string, matcher: FieldMatcher): boolean {
		const value = matcher.caseSensitive ? matcher.value : matcher.value.toLowerCase()
		const name = matcher.caseSensitive ? fieldName : fieldName.toLowerCase()

		switch (matcher.type) {
			case 'exact':
				return name === value
			case 'prefix':
				return name.startsWith(value)
			case 'suffix':
				return name.endsWith(value)
			case 'contains':
				return name.includes(value)
			case 'regex':
				return new RegExp(matcher.value, matcher.caseSensitive ? '' : 'i').test(fieldName)
			default:
				return false
		}
	}

	/**
	 * Apply patterns to sanitize a string
	 */
	private sanitizeString(value: string): string {
		let result = value

		for (const { pattern, replacement } of this.config.patterns) {
			const rep = replacement ?? this.config.replacement
			if (typeof rep === 'function') {
				result = result.replace(pattern, rep)
			} else {
				result = result.replace(pattern, rep)
			}
		}

		return result
	}

	/**
	 * Recursively sanitize a value
	 *
	 * @param value - The value to sanitize
	 * @param depth - Current recursion depth
	 * @param path - Dot-notation path to current position (e.g., 'user.credentials')
	 */
	private sanitizeValue(value: unknown, depth: number, path: string): unknown {
		if (depth > this.config.depth) return value

		// Handle null/undefined
		if (value === null || value === undefined) return value

		// Handle strings
		if (typeof value === 'string') {
			return this.sanitizeString(value)
		}

		// Handle arrays
		if (Array.isArray(value)) {
			return value.map((item, index) =>
				this.sanitizeValue(item, depth + 1, path ? `${path}[${index}]` : `[${index}]`),
			)
		}

		// Handle objects
		if (typeof value === 'object') {
			const result: Record<string, unknown> = {}
			for (const [key, val] of Object.entries(value)) {
				if (this.isSensitiveField(key, path)) {
					result[key] = this.config.replacement
				} else {
					const newPath = path ? `${path}.${key}` : key
					result[key] = this.sanitizeValue(val, depth + 1, newPath)
				}
			}
			return result
		}

		// Return primitives as-is
		return value
	}

	/**
	 * Get the current configuration
	 */
	getConfig(): Readonly<Required<SanitizeConfig>> {
		return this.config
	}
}

// Default sanitizer instance using 'default' preset
const defaultSanitizer = Sanitizer.fromPreset('default')

/**
 * Sanitize a value using the default preset
 * (Backwards compatible function)
 */
export function sanitize(value: unknown, additionalFields: string[] = [], depth = 0): unknown {
	if (additionalFields.length > 0) {
		// Create custom sanitizer with additional fields
		// Use 'contains' matcher for backwards compatibility (old behavior used includes())
		const sanitizer = Sanitizer.fromPresetWithOverrides('default', {
			fields: additionalFields.map((field) => ({
				type: 'contains' as const,
				value: field,
			})),
		})
		return sanitizer.sanitize(value)
	}
	return defaultSanitizer.sanitize(value)
}

/**
 * Create a sanitizer function with custom fields
 * (Backwards compatible function)
 */
export function createSanitizer(additionalFields: string[] = []): (value: unknown) => unknown {
	const sanitizer = Sanitizer.fromPresetWithOverrides('default', {
		// Use 'contains' matcher for backwards compatibility
		fields: additionalFields.map((field) => ({
			type: 'contains' as const,
			value: field,
		})),
	})
	return (value: unknown) => sanitizer.sanitize(value)
}

// Re-export presets and patterns for convenience
export { COMMON_PATTERNS, getPreset, mergeConfigs, PRESETS } from './sanitize-presets'
