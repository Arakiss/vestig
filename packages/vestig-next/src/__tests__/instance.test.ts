import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { VERSION as CORE_VERSION } from 'vestig'
import {
	describeCoreMismatch,
	getLoadedInstances,
	registerNextInstance,
	resetInstanceRegistry,
} from '../instance'
import { VERSION } from '../version'

const REGISTRY_KEY = Symbol.for('vestig.instances')

interface Registry {
	instances: { package: string; version: string }[]
	warned: string[]
}

function registry(): Registry {
	const holder = globalThis as typeof globalThis & { [REGISTRY_KEY]?: Registry }
	if (!holder[REGISTRY_KEY]) {
		holder[REGISTRY_KEY] = { instances: [], warned: [] }
	}
	return holder[REGISTRY_KEY] as Registry
}

/**
 * Simulate another copy registering itself in the shared registry.
 *
 * The registry is the only thing duplicated copies have in common, so writing
 * to it reproduces exactly what the guard sees in a real duplicated install.
 */
function loadCopy(packageName: string, version: string): void {
	registry().instances.push({ package: packageName, version })
}

describe('@vestig/next instance guard', () => {
	let warnings: string[]
	let originalWarn: typeof console.warn

	beforeEach(() => {
		resetInstanceRegistry()
		warnings = []
		originalWarn = console.warn
		console.warn = mock((message: string) => {
			warnings.push(message)
		})
	})

	afterEach(() => {
		console.warn = originalWarn
		resetInstanceRegistry()
	})

	test('registers itself with its own version', () => {
		registerNextInstance()

		expect(getLoadedInstances()).toContainEqual({ package: '@vestig/next', version: VERSION })
	})

	test('stays silent when core and integration are aligned', () => {
		registerNextInstance()

		expect(warnings).toHaveLength(0)
	})

	test('registration is idempotent per loaded copy', () => {
		registerNextInstance()
		registerNextInstance()

		expect(getLoadedInstances().filter((e) => e.package === '@vestig/next')).toHaveLength(1)
	})

	test('warns when a second copy of the integration is loaded', () => {
		registerNextInstance()
		loadCopy('@vestig/next', '0.22.1')
		registerNextInstance()

		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('Multiple copies of "@vestig/next"')
		expect(warnings[0]).toContain('0.22.1')
	})

	test('warns only once for the same set of versions', () => {
		registerNextInstance()
		loadCopy('@vestig/next', '0.22.1')
		registerNextInstance()
		registerNextInstance()

		expect(warnings).toHaveLength(1)
	})

	test('shares the registry with the core package', () => {
		loadCopy('vestig', CORE_VERSION)
		registerNextInstance()

		expect(getLoadedInstances().map((e) => e.package)).toEqual(['vestig', '@vestig/next'])
	})

	test('can be silenced with VESTIG_SILENCE_DUPLICATE_WARNING', () => {
		const previous = process.env.VESTIG_SILENCE_DUPLICATE_WARNING
		process.env.VESTIG_SILENCE_DUPLICATE_WARNING = '1'

		try {
			registerNextInstance()
			loadCopy('@vestig/next', '0.22.1')
			registerNextInstance()

			expect(warnings).toHaveLength(0)
		} finally {
			if (previous === undefined) {
				delete process.env.VESTIG_SILENCE_DUPLICATE_WARNING
			} else {
				process.env.VESTIG_SILENCE_DUPLICATE_WARNING = previous
			}
		}
	})

	test('getLoadedInstances returns a copy, not the live registry', () => {
		registerNextInstance()
		const snapshot = getLoadedInstances()
		snapshot.push({ package: 'vestig', version: 'tampered' })

		expect(getLoadedInstances().some((e) => e.version === 'tampered')).toBe(false)
	})
})

/**
 * The mismatch case is what actually happened downstream: a consumer resolving
 * vestig@0.23.0 while @vestig/next@0.22.1 dragged in a nested vestig@0.22.1.
 */
describe('@vestig/next core alignment', () => {
	test('reports a core from an older minor line', () => {
		const message = describeCoreMismatch('0.22.1', '0.23.0')

		expect(message).toContain('Version mismatch')
		expect(message).toContain('@vestig/next@0.23.0')
		expect(message).toContain('vestig@0.22.1')
	})

	test('names the consequence and the fix', () => {
		const message = describeCoreMismatch('0.22.1', '0.23.0') ?? ''

		expect(message).toContain('trace id')
		expect(message).toContain('nested copy')
		expect(message).toContain('peer dependency')
	})

	test('accepts any patch on the same minor line', () => {
		expect(describeCoreMismatch('0.23.9', '0.23.0')).toBeNull()
		expect(describeCoreMismatch('0.23.0', '0.23.4')).toBeNull()
	})

	test('reports a core from a newer minor line too', () => {
		expect(describeCoreMismatch('0.24.0', '0.23.0')).toContain('Version mismatch')
	})

	test('reports across major versions', () => {
		expect(describeCoreMismatch('1.0.0', '0.23.0')).toContain('Version mismatch')
	})

	test('the shipped pair is aligned', () => {
		expect(describeCoreMismatch(CORE_VERSION)).toBeNull()
	})
})
