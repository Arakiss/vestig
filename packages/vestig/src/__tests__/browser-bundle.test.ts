import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const TEST_DIR = join(PACKAGE_DIR, '.test-bundles')
const ENTRY_PATH = join(TEST_DIR, 'browser-entry.ts')

describe('browser bundling', () => {
	afterEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true, force: true })
		}
	})

	test('root entrypoint does not force Node-only transports into browser bundles', async () => {
		mkdirSync(TEST_DIR, { recursive: true })
		writeFileSync(
			ENTRY_PATH,
			[
				"import { RUNTIME, createLogger } from '../src/index'",
				'',
				'const log = createLogger({ structured: false })',
				"log.info('browser bundle smoke', { runtime: RUNTIME })",
			].join('\n'),
		)

		const result = await Bun.build({
			entrypoints: [ENTRY_PATH],
			target: 'browser',
			format: 'esm',
			write: false,
		})

		expect(result.success).toBe(true)
		const output = await result.outputs[0]?.text()
		expect(output).toBeDefined()
		expect(output).not.toContain("import('node:fs/promises')")
		expect(output).not.toContain("import('node:zlib')")
	})
})
