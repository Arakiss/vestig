import { describe, expect, test } from 'bun:test'
import {
	CAPABILITIES,
	IS_BROWSER,
	IS_BUN,
	IS_DENO,
	IS_EDGE,
	IS_NODE,
	IS_SERVER,
	IS_WORKER,
	RUNTIME,
} from '../runtime'

describe('RUNTIME detection', () => {
	test('should detect bun runtime', () => {
		// When running in bun, RUNTIME should be 'bun'
		expect(RUNTIME).toBe('bun')
	})

	test('should export a valid runtime type', () => {
		const validRuntimes = ['node', 'bun', 'deno', 'edge', 'browser', 'worker', 'unknown']
		expect(validRuntimes).toContain(RUNTIME)
	})
})

describe('CAPABILITIES', () => {
	test('should have all capability flags', () => {
		expect(CAPABILITIES).toHaveProperty('hasAsyncLocalStorage')
		expect(CAPABILITIES).toHaveProperty('hasProcess')
		expect(CAPABILITIES).toHaveProperty('hasPerformance')
		expect(CAPABILITIES).toHaveProperty('hasConsole')
		expect(CAPABILITIES).toHaveProperty('hasCrypto')
	})

	test('should return boolean values', () => {
		expect(typeof CAPABILITIES.hasAsyncLocalStorage).toBe('boolean')
		expect(typeof CAPABILITIES.hasProcess).toBe('boolean')
		expect(typeof CAPABILITIES.hasPerformance).toBe('boolean')
		expect(typeof CAPABILITIES.hasConsole).toBe('boolean')
		expect(typeof CAPABILITIES.hasCrypto).toBe('boolean')
	})

	test('should detect bun capabilities correctly', () => {
		// Bun has these capabilities
		expect(CAPABILITIES.hasProcess).toBe(true)
		expect(CAPABILITIES.hasConsole).toBe(true)
		expect(CAPABILITIES.hasCrypto).toBe(true)
		expect(CAPABILITIES.hasPerformance).toBe(true)
		expect(CAPABILITIES.hasAsyncLocalStorage).toBe(true)
	})
})

describe('Convenience flags', () => {
	test('IS_BUN should be true in bun runtime', () => {
		expect(IS_BUN).toBe(true)
	})

	test('IS_NODE should be false in bun runtime', () => {
		expect(IS_NODE).toBe(false)
	})

	test('IS_DENO should be false in bun runtime', () => {
		expect(IS_DENO).toBe(false)
	})

	test('IS_EDGE should be false in bun runtime', () => {
		expect(IS_EDGE).toBe(false)
	})

	test('IS_BROWSER should be false in bun runtime', () => {
		expect(IS_BROWSER).toBe(false)
	})

	test('IS_WORKER should be false in bun runtime', () => {
		expect(IS_WORKER).toBe(false)
	})

	test('IS_SERVER should be true for bun', () => {
		expect(IS_SERVER).toBe(true)
	})

	test('IS_SERVER should be IS_NODE || IS_BUN || IS_DENO || IS_EDGE', () => {
		expect(IS_SERVER).toBe(IS_NODE || IS_BUN || IS_DENO || IS_EDGE)
	})
})

describe('Runtime flags consistency', () => {
	test('only one runtime flag should be true', () => {
		const flags = [IS_NODE, IS_BUN, IS_DENO, IS_EDGE, IS_BROWSER, IS_WORKER]
		const trueCount = flags.filter(Boolean).length
		expect(trueCount).toBe(1)
	})

	test('RUNTIME and flags should be consistent', () => {
		if (RUNTIME === 'node') expect(IS_NODE).toBe(true)
		if (RUNTIME === 'bun') expect(IS_BUN).toBe(true)
		if (RUNTIME === 'deno') expect(IS_DENO).toBe(true)
		if (RUNTIME === 'edge') expect(IS_EDGE).toBe(true)
		if (RUNTIME === 'browser') expect(IS_BROWSER).toBe(true)
		if (RUNTIME === 'worker') expect(IS_WORKER).toBe(true)
	})
})
