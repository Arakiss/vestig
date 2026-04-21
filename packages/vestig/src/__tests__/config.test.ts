import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { ENV_VARS, getDefaultConfig, mergeConfig } from '../config'

describe('ENV_VARS', () => {
	test('should export correct environment variable names', () => {
		expect(ENV_VARS.LEVEL).toBe('VESTIG_LEVEL')
		expect(ENV_VARS.ENABLED).toBe('VESTIG_ENABLED')
		expect(ENV_VARS.STRUCTURED).toBe('VESTIG_STRUCTURED')
		expect(ENV_VARS.SANITIZE).toBe('VESTIG_SANITIZE')
		expect(ENV_VARS.SANITIZE_PRESET).toBe('VESTIG_SANITIZE_PRESET')
	})
})

describe('getDefaultConfig', () => {
	const originalEnv = { ...process.env }

	beforeEach(() => {
		// Clean relevant env vars
		process.env.NODE_ENV = undefined
		process.env.VESTIG_LEVEL = undefined
		process.env.VESTIG_ENABLED = undefined
		process.env.VESTIG_STRUCTURED = undefined
		process.env.VESTIG_SANITIZE = undefined
		process.env.VESTIG_SANITIZE_PRESET = undefined
		// Clean context vars
		for (const key of Object.keys(process.env)) {
			if (key.startsWith('VESTIG_CONTEXT_')) {
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

	test('should respect VESTIG_LEVEL env var', () => {
		process.env.VESTIG_LEVEL = 'debug'
		const config = getDefaultConfig()

		expect(config.level).toBe('debug')
	})

	test('should respect VESTIG_ENABLED env var', () => {
		process.env.VESTIG_ENABLED = 'false'
		const config = getDefaultConfig()

		expect(config.enabled).toBe(false)
	})

	test('should respect VESTIG_STRUCTURED env var', () => {
		process.env.VESTIG_STRUCTURED = 'true'
		const config = getDefaultConfig()

		expect(config.structured).toBe(true)
	})

	test('should respect VESTIG_SANITIZE env var', () => {
		process.env.VESTIG_SANITIZE = 'false'
		const config = getDefaultConfig()

		expect(config.sanitize).toBe(false)
	})

	test('should parse preset from VESTIG_SANITIZE env var', () => {
		process.env.VESTIG_SANITIZE = 'gdpr'
		const config = getDefaultConfig()

		expect(config.sanitize).toBe('gdpr')
	})

	test('should parse VESTIG_SANITIZE_PRESET env var', () => {
		process.env.VESTIG_SANITIZE_PRESET = 'hipaa'
		const config = getDefaultConfig()

		expect(config.sanitize).toBe('hipaa')
	})

	test('should let VESTIG_SANITIZE=false disable preset env var', () => {
		process.env.VESTIG_SANITIZE = 'false'
		process.env.VESTIG_SANITIZE_PRESET = 'gdpr'
		const config = getDefaultConfig()

		expect(config.sanitize).toBe(false)
	})

	test('should parse VESTIG_CONTEXT_* env vars', () => {
		process.env.VESTIG_CONTEXT_APP = 'myapp'
		process.env.VESTIG_CONTEXT_VERSION = '1.0.0'
		const config = getDefaultConfig()

		expect(config.context.app).toBe('myapp')
		expect(config.context.version).toBe('1.0.0')
	})

	test('should handle "1" as true for boolean env vars', () => {
		process.env.VESTIG_ENABLED = '1'
		process.env.VESTIG_STRUCTURED = '1'
		const config = getDefaultConfig()

		expect(config.enabled).toBe(true)
		expect(config.structured).toBe(true)
	})

	test('should handle case-insensitive boolean values', () => {
		process.env.VESTIG_ENABLED = 'TRUE'
		const config = getDefaultConfig()

		expect(config.enabled).toBe(true)
	})
})

describe('mergeConfig', () => {
	const originalEnv = { ...process.env }

	beforeEach(() => {
		process.env.NODE_ENV = undefined
		process.env.VESTIG_LEVEL = undefined
		process.env.VESTIG_ENABLED = undefined
		process.env.VESTIG_STRUCTURED = undefined
		process.env.VESTIG_SANITIZE = undefined
		process.env.VESTIG_SANITIZE_PRESET = undefined
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
		process.env.VESTIG_CONTEXT_ENV = 'test'
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
		process.env.VESTIG_CONTEXT_APP = 'default-app'
		const config = mergeConfig({
			context: { app: 'custom-app' },
		})

		expect(config.context.app).toBe('custom-app')
	})

	test('should preserve configured transports', () => {
		const transport = {
			name: 'configured',
			config: { name: 'configured', enabled: true },
			log: () => {},
		}
		const config = mergeConfig({
			transports: [transport],
		})

		expect(config.transports).toEqual([transport])
	})
})
