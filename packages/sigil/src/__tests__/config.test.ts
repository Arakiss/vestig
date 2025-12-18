import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { ENV_VARS, getDefaultConfig, mergeConfig } from '../config'

describe('ENV_VARS', () => {
	test('should export correct environment variable names', () => {
		expect(ENV_VARS.LEVEL).toBe('SIGIL_LEVEL')
		expect(ENV_VARS.ENABLED).toBe('SIGIL_ENABLED')
		expect(ENV_VARS.STRUCTURED).toBe('SIGIL_STRUCTURED')
		expect(ENV_VARS.SANITIZE).toBe('SIGIL_SANITIZE')
	})
})

describe('getDefaultConfig', () => {
	const originalEnv = { ...process.env }

	beforeEach(() => {
		// Clean relevant env vars
		process.env.NODE_ENV = undefined
		process.env.SIGIL_LEVEL = undefined
		process.env.SIGIL_ENABLED = undefined
		process.env.SIGIL_STRUCTURED = undefined
		process.env.SIGIL_SANITIZE = undefined
		// Clean context vars
		for (const key of Object.keys(process.env)) {
			if (key.startsWith('SIGIL_CONTEXT_')) {
				delete process.env[key]
			}
		}
	})

	afterEach(() => {
		// Restore env
		process.env = { ...originalEnv }
	})

	test('should return default config in development', () => {
		process.env.NODE_ENV = 'development'
		const config = getDefaultConfig()

		expect(config.level).toBe('info')
		expect(config.enabled).toBe(true)
		expect(config.structured).toBe(false)
		expect(config.sanitize).toBe(true)
		expect(config.sanitizeFields).toEqual([])
		expect(config.context).toEqual({})
		expect(config.namespace).toBe('')
	})

	test('should return production defaults in production', () => {
		process.env.NODE_ENV = 'production'
		const config = getDefaultConfig()

		expect(config.level).toBe('warn')
		expect(config.structured).toBe(true)
	})

	test('should respect SIGIL_LEVEL env var', () => {
		process.env.SIGIL_LEVEL = 'debug'
		const config = getDefaultConfig()

		expect(config.level).toBe('debug')
	})

	test('should respect SIGIL_ENABLED env var', () => {
		process.env.SIGIL_ENABLED = 'false'
		const config = getDefaultConfig()

		expect(config.enabled).toBe(false)
	})

	test('should respect SIGIL_STRUCTURED env var', () => {
		process.env.SIGIL_STRUCTURED = 'true'
		const config = getDefaultConfig()

		expect(config.structured).toBe(true)
	})

	test('should respect SIGIL_SANITIZE env var', () => {
		process.env.SIGIL_SANITIZE = 'false'
		const config = getDefaultConfig()

		expect(config.sanitize).toBe(false)
	})

	test('should parse SIGIL_CONTEXT_* env vars', () => {
		process.env.SIGIL_CONTEXT_APP = 'myapp'
		process.env.SIGIL_CONTEXT_VERSION = '1.0.0'
		const config = getDefaultConfig()

		expect(config.context.app).toBe('myapp')
		expect(config.context.version).toBe('1.0.0')
	})

	test('should handle "1" as true for boolean env vars', () => {
		process.env.SIGIL_ENABLED = '1'
		process.env.SIGIL_STRUCTURED = '1'
		const config = getDefaultConfig()

		expect(config.enabled).toBe(true)
		expect(config.structured).toBe(true)
	})

	test('should handle case-insensitive boolean values', () => {
		process.env.SIGIL_ENABLED = 'TRUE'
		const config = getDefaultConfig()

		expect(config.enabled).toBe(true)
	})
})

describe('mergeConfig', () => {
	const originalEnv = { ...process.env }

	beforeEach(() => {
		process.env.NODE_ENV = undefined
		process.env.SIGIL_LEVEL = undefined
		process.env.SIGIL_ENABLED = undefined
		process.env.SIGIL_STRUCTURED = undefined
		process.env.SIGIL_SANITIZE = undefined
	})

	afterEach(() => {
		process.env = { ...originalEnv }
	})

	test('should return defaults when no user config', () => {
		const config = mergeConfig()

		expect(config.level).toBe('info')
		expect(config.enabled).toBe(true)
		expect(config.sanitize).toBe(true)
	})

	test('should override defaults with user config', () => {
		const config = mergeConfig({
			level: 'debug',
			enabled: false,
			sanitize: false,
		})

		expect(config.level).toBe('debug')
		expect(config.enabled).toBe(false)
		expect(config.sanitize).toBe(false)
	})

	test('should merge sanitizeFields', () => {
		const config = mergeConfig({
			sanitizeFields: ['customField', 'anotherField'],
		})

		expect(config.sanitizeFields).toContain('customField')
		expect(config.sanitizeFields).toContain('anotherField')
	})

	test('should merge context objects', () => {
		process.env.SIGIL_CONTEXT_ENV = 'test'
		const config = mergeConfig({
			context: { userId: '123', requestId: 'abc' },
		})

		expect(config.context.env).toBe('test')
		expect(config.context.userId).toBe('123')
		expect(config.context.requestId).toBe('abc')
	})

	test('should set namespace', () => {
		const config = mergeConfig({
			namespace: 'my-module',
		})

		expect(config.namespace).toBe('my-module')
	})

	test('should handle structured option', () => {
		const config = mergeConfig({
			structured: true,
		})

		expect(config.structured).toBe(true)
	})

	test('should preserve user context over defaults', () => {
		process.env.SIGIL_CONTEXT_APP = 'default-app'
		const config = mergeConfig({
			context: { app: 'custom-app' },
		})

		expect(config.context.app).toBe('custom-app')
	})
})
