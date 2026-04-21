import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')

const PACKAGES = [
	{ dir: 'packages/vestig', name: 'vestig' },
	{ dir: 'packages/vestig-next', name: '@vestig/next' },
] as const

const forbiddenPatterns = [
	`${sep}__tests__${sep}`,
	`${sep}__mocks__${sep}`,
	'.test.',
	'.spec.',
] as const

function fail(message: string): never {
	console.error(`package-contents: ${message}`)
	process.exit(1)
}

function readPackageJson(packageDir: string): { files?: string[] } {
	const path = join(ROOT, packageDir, 'package.json')
	return JSON.parse(readFileSync(path, 'utf8')) as { files?: string[] }
}

function walk(dir: string): string[] {
	if (!existsSync(dir)) return []

	const entries = readdirSync(dir)
	const files: string[] = []

	for (const entry of entries) {
		const path = join(dir, entry)
		const stat = statSync(path)

		if (stat.isDirectory()) {
			files.push(...walk(path))
		} else if (stat.isFile()) {
			files.push(path)
		}
	}

	return files
}

for (const pkg of PACKAGES) {
	const packageJson = readPackageJson(pkg.dir)

	if (!packageJson.files?.includes('dist')) {
		fail(`${pkg.name} package.json must publish dist explicitly via "files"`)
	}

	const distDir = join(ROOT, pkg.dir, 'dist')
	if (!existsSync(distDir)) {
		fail(
			`${pkg.name} dist directory is missing; run package builds before validating package contents`,
		)
	}

	const files = walk(distDir)
	const forbidden = files
		.map((file) => relative(join(ROOT, pkg.dir), file))
		.filter((file) => forbiddenPatterns.some((pattern) => file.includes(pattern)))

	if (forbidden.length > 0) {
		fail(
			`${pkg.name} dist contains test-only artifacts:\n${forbidden.map((file) => `  - ${file}`).join('\n')}`,
		)
	}
}

console.log('package-contents: dist outputs contain no test-only artifacts')
