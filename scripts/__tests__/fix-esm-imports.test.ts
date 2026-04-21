import { describe, expect, test } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rewriteEsmSpecifiers } from '../fix-esm-imports'

describe('rewriteEsmSpecifiers', () => {
	test('adds .js extensions and directory index paths for relative imports', () => {
		const dir = join(tmpdir(), `vestig-fix-esm-${crypto.randomUUID()}`)
		const importer = join(dir, 'index.js')

		mkdirSync(join(dir, 'utils'), { recursive: true })
		writeFileSync(join(dir, 'version.js'), '')
		writeFileSync(join(dir, 'utils', 'index.js'), '')
		writeFileSync(importer, '')

		try {
			const source = [
				"import { VERSION } from './version';",
				"export { thing } from './utils';",
				"import './version';",
				"const mod = await import('./utils');",
				"import { external } from 'external-package';",
			].join('\n')

			expect(rewriteEsmSpecifiers(source, importer)).toBe(
				[
					"import { VERSION } from './version.js';",
					"export { thing } from './utils/index.js';",
					"import './version.js';",
					"const mod = await import('./utils/index.js');",
					"import { external } from 'external-package';",
				].join('\n'),
			)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	test('does not rewrite specifiers that already have extensions', () => {
		const importer = join(tmpdir(), `vestig-fix-esm-${crypto.randomUUID()}`, 'index.js')
		const source = "export { VERSION } from './version.js';"

		expect(rewriteEsmSpecifiers(source, importer)).toBe(source)
	})
})
