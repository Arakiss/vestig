import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'

function walkJsFiles(dir: string): string[] {
	const entries = readdirSync(dir, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const path = resolve(dir, entry.name)
		if (entry.isDirectory()) {
			files.push(...walkJsFiles(path))
		} else if (entry.isFile() && path.endsWith('.js')) {
			files.push(path)
		}
	}

	return files
}

function resolveRelativeSpecifier(specifier: string, importerPath: string): string {
	if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
		return specifier
	}

	if (extname(specifier)) {
		return specifier
	}

	const basePath = resolve(dirname(importerPath), specifier)
	if (existsSync(`${basePath}.js`)) {
		return `${specifier}.js`
	}

	if (existsSync(resolve(basePath, 'index.js'))) {
		return `${specifier}/index.js`
	}

	return specifier
}

export function rewriteEsmSpecifiers(source: string, importerPath: string): string {
	const rewrites: Array<[RegExp, string]> = [
		[/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, '$1__SPEC__$3'],
		[/(import\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, '$1__SPEC__$3'],
		[/(import\s*\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g, '$1__SPEC__$3'],
	]

	let output = source
	for (const [pattern, replacement] of rewrites) {
		output = output.replace(pattern, (match, prefix: string, specifier: string, suffix: string) => {
			const resolved = resolveRelativeSpecifier(specifier, importerPath)
			return replacement.replace('$1', prefix).replace('__SPEC__', resolved).replace('$3', suffix)
		})
	}

	return output
}

export function fixEsmImports(distDir: string): number {
	const absoluteDistDir = resolve(distDir)
	if (!existsSync(absoluteDistDir) || !statSync(absoluteDistDir).isDirectory()) {
		throw new Error(`Dist directory not found: ${distDir}`)
	}

	let changed = 0
	for (const file of walkJsFiles(absoluteDistDir)) {
		const source = readFileSync(file, 'utf8')
		const rewritten = rewriteEsmSpecifiers(source, file)
		if (rewritten !== source) {
			writeFileSync(file, rewritten)
			changed++
		}
	}

	return changed
}

if (import.meta.main) {
	const distDir = process.argv[2]
	if (!distDir) {
		console.error('Usage: bun scripts/fix-esm-imports.ts <dist-dir>')
		process.exit(1)
	}

	const changed = fixEsmImports(distDir)
	console.log(`[fix-esm-imports] Rewrote ${changed} file(s) in ${distDir}`)
}
