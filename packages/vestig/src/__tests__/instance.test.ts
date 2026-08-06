import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import {
	getLoadedInstances,
	hasMultipleInstances,
	registerVestigInstance,
	resetInstanceRegistry,
} from '../instance'
import { VERSION } from '../version'

const REGISTRY_KEY = Symbol.for('vestig.instances')

interface Registry {
	instances: { package: string; version: string }[]
	warned: string[]
}

function registry(): Registry {
	return (globalThis as typeof globalThis & { [REGISTRY_KEY]: Registry })[REGISTRY_KEY]
}

/**
 * Simulate a second copy of the package registering itself.
 *
 * A real duplicate is a separate module instance, which cannot be created
 * inside one test process — but every copy writes to the same global registry,
 * so appending an entry reproduces exactly what the guard reads.
 */
function loadSecondCopy(packageName: string, version: string): void {
	registry().instances.push({ package: packageName, version })
}

describe('instance guard', () => {
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

	test('registers the current copy with its version', () => {
		registerVestigInstance()

		expect(getLoadedInstances()).toEqual([{ package: 'vestig', version: VERSION }])
	})

	test('stays silent for a single copy', () => {
		registerVestigInstance()

		expect(warnings).toHaveLength(0)
		expect(hasMultipleInstances()).toBe(false)
	})

	test('registration is idempotent per loaded copy', () => {
		registerVestigInstance()
		registerVestigInstance()
		registerVestigInstance()

		expect(getLoadedInstances()).toHaveLength(1)
		expect(warnings).toHaveLength(0)
	})

	test('warns when a second copy with a different version is loaded', () => {
		registerVestigInstance()
		loadSecondCopy('vestig', '0.22.1')
		registerVestigInstance()

		expect(hasMultipleInstances()).toBe(true)
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('Multiple copies of "vestig"')
		expect(warnings[0]).toContain('0.22.1')
		expect(warnings[0]).toContain(VERSION)
	})

	test('warns when the same version is loaded twice from different paths', () => {
		registerVestigInstance()
		loadSecondCopy('vestig', VERSION)
		registerVestigInstance()

		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('loaded 2 times from different paths')
	})

	test('warns only once for the same set of versions', () => {
		registerVestigInstance()
		loadSecondCopy('vestig', '0.22.1')
		registerVestigInstance()
		registerVestigInstance()
		registerVestigInstance()

		expect(warnings).toHaveLength(1)
	})

	test('explains the consequence and the fix', () => {
		registerVestigInstance()
		loadSecondCopy('vestig', '0.22.1')
		registerVestigInstance()

		expect(warnings[0]).toContain('AsyncLocalStorage')
		expect(warnings[0]).toContain('trace id')
		expect(warnings[0]).toContain('peer dependency')
	})

	test('does not confuse copies of different packages', () => {
		registerVestigInstance()
		loadSecondCopy('@vestig/next', '0.22.1')
		registerVestigInstance()

		expect(hasMultipleInstances()).toBe(false)
		expect(hasMultipleInstances('@vestig/next')).toBe(false)
		expect(warnings).toHaveLength(0)
	})

	test('can be silenced with VESTIG_SILENCE_DUPLICATE_WARNING', () => {
		const previous = process.env.VESTIG_SILENCE_DUPLICATE_WARNING
		process.env.VESTIG_SILENCE_DUPLICATE_WARNING = '1'

		try {
			registerVestigInstance()
			loadSecondCopy('vestig', '0.22.1')
			registerVestigInstance()

			expect(hasMultipleInstances()).toBe(true)
			expect(warnings).toHaveLength(0)
		} finally {
			if (previous === undefined) {
				delete process.env.VESTIG_SILENCE_DUPLICATE_WARNING
			} else {
				process.env.VESTIG_SILENCE_DUPLICATE_WARNING = previous
			}
		}
	})

	test('shares the registry through the global symbol', () => {
		registerVestigInstance()

		// A duplicated copy has nothing in common with this one except the
		// global symbol registry, so that is what the guard must rely on.
		expect(registry().instances).toEqual([{ package: 'vestig', version: VERSION }])
	})

	test('getLoadedInstances returns a copy, not the live registry', () => {
		registerVestigInstance()

		const snapshot = getLoadedInstances()
		snapshot.push({ package: 'vestig', version: 'tampered' })

		expect(getLoadedInstances()).toHaveLength(1)
	})
})

describe('instance guard registration on module load', () => {
	/**
	 * Registration happens at module evaluation, which ESM performs once per
	 * process. Re-importing inside this file would hit the module cache and
	 * prove nothing, so each case runs in a fresh process.
	 */
	function runInFreshProcess(source: string): string {
		const result = Bun.spawnSync(['bun', '-e', source], {
			cwd: `${import.meta.dir}/../..`,
			env: { ...process.env, VESTIG_SILENCE_DUPLICATE_WARNING: undefined },
		})

		const stderr = result.stderr.toString()
		if (result.exitCode !== 0) {
			throw new Error(`Probe failed (${result.exitCode}): ${stderr}`)
		}

		return result.stdout.toString().trim()
	}

	test('importing the context module registers the copy', () => {
		const output = runInFreshProcess(
			`import { getLoadedInstances } from './src/instance.ts'
			 await import('./src/context/index.ts')
			 console.log(JSON.stringify(getLoadedInstances()))`,
		)

		expect(JSON.parse(output)).toEqual([{ package: 'vestig', version: VERSION }])
	})

	test('importing the wide-events context registers the copy', () => {
		const output = runInFreshProcess(
			`import { getLoadedInstances } from './src/instance.ts'
			 await import('./src/wide-events/context.ts')
			 console.log(JSON.stringify(getLoadedInstances()))`,
		)

		expect(JSON.parse(output)).toEqual([{ package: 'vestig', version: VERSION }])
	})

	test('importing the package entry point registers exactly one copy', () => {
		const output = runInFreshProcess(
			`const mod = await import('./src/index.ts')
			 console.log(JSON.stringify(mod.getLoadedInstances()))`,
		)

		expect(JSON.parse(output)).toEqual([{ package: 'vestig', version: VERSION }])
	})
})
