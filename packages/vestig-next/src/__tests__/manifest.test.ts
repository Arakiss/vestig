import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { VERSION as CORE_VERSION } from 'vestig'
import { VERSION } from '../version'

const PACKAGE_ROOT = resolve(import.meta.dir, '../..')

interface Manifest {
	version: string
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	peerDependencies?: Record<string, string>
}

function readManifest(path: string): Manifest {
	return JSON.parse(readFileSync(resolve(PACKAGE_ROOT, path), 'utf-8')) as Manifest
}

/**
 * The dependency shape of this package is load-bearing, not cosmetic.
 *
 * vestig keeps its context in module-level AsyncLocalStorage. Declaring it as a
 * normal dependency makes package managers install a nested copy alongside the
 * one the consumer already resolved, and two copies mean two context stores:
 * spans created by the application never share a trace id with the ones
 * registerVestig() emits, silently. These tests exist so that regression cannot
 * ship again.
 */
describe('@vestig/next manifest', () => {
	const manifest = readManifest('package.json')

	test('does not declare vestig as a runtime dependency', () => {
		expect(manifest.dependencies?.vestig).toBeUndefined()
	})

	test('declares vestig as a peer dependency', () => {
		expect(manifest.peerDependencies?.vestig).toBeDefined()
	})

	test('pins the peer range to the version it ships with', () => {
		// Both packages are released together, so the integration must never be
		// paired with a core older than the one it was built against. The caret
		// still stops the range at the next breaking boundary.
		expect(manifest.peerDependencies?.vestig).toBe(`^${VERSION}`)
	})

	test('does not accept core versions predating module-state context', () => {
		expect(manifest.peerDependencies?.vestig).not.toBe('>=0.2.0')
	})

	test('keeps vestig available for local builds without publishing it', () => {
		expect(manifest.devDependencies?.vestig).toBe('workspace:*')
	})

	test('version.ts matches the manifest version', () => {
		expect(VERSION).toBe(manifest.version)
	})

	test('ships in lockstep with the core package', () => {
		expect(VERSION).toBe(CORE_VERSION)
	})

	test('the resolved core satisfies the declared peer range', () => {
		expect(manifest.peerDependencies?.vestig).toBe(`^${CORE_VERSION}`)
	})
})
