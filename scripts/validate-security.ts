#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')

function read(path: string): string {
	return readFileSync(resolve(ROOT, path), 'utf-8')
}

function fail(message: string): never {
	console.error(`security: ${message}`)
	process.exit(1)
}

function requireFile(path: string): string {
	if (!existsSync(resolve(ROOT, path))) {
		fail(`${path} is required`)
	}
	return read(path)
}

function requireIncludes(path: string, needle: string): void {
	const content = requireFile(path)
	if (!content.includes(needle)) {
		fail(`${path} must include ${needle}`)
	}
}

function main(): void {
	const rootPackage = requireFile('package.json')
	const webPackage = requireFile('apps/web/package.json')

	for (const dependency of ['release-it', '@release-it/conventional-changelog', 'recharts']) {
		if (rootPackage.includes(`"${dependency}"`) || webPackage.includes(`"${dependency}"`)) {
			fail(`${dependency} must not be reintroduced without a documented reason`)
		}
	}

	requireIncludes('SECURITY.md', 'https://github.com/Arakiss/vestig/security/advisories/new')
	requireIncludes('SECURITY.md', 'Trusted Publishing')
	requireIncludes('SECURITY.md', 'npm provenance')
	requireIncludes(
		'.github/ISSUE_TEMPLATE/config.yml',
		'https://github.com/Arakiss/vestig/security/advisories/new',
	)

	const ci = requireFile('.github/workflows/ci.yml')
	if (!ci.includes('contents: read')) {
		fail('CI workflow must declare least-privilege contents: read')
	}
	if (ci.includes('pull-requests: write')) {
		fail('CI workflow must not request pull-requests: write')
	}
	if (ci.includes('continue-on-error: true') || ci.includes('bun run test ||')) {
		fail('CI tests must fail the workflow when tests fail')
	}
	if (!ci.includes('bun audit')) {
		fail('CI security scan must run bun audit')
	}
	if (ci.includes('npm install --save-dev @commitlint')) {
		fail('CI commit validation must not install npm packages into the workspace')
	}
	if (!ci.includes('bun scripts/validate-commits.ts')) {
		fail('CI pull-request commit validation must run the Bun commit validator')
	}

	for (const path of ['.github/workflows/release.yml', '.github/workflows/npm-publish.yml']) {
		const workflow = requireFile(path)
		if (!workflow.includes('id-token: write')) {
			fail(`${path} must grant id-token: write for npm trusted publishing`)
		}
		if (!workflow.includes('node-version:')) {
			fail(`${path} must configure Node for npm publish`)
		}
		if (!workflow.includes('--provenance')) {
			fail(`${path} must publish with npm provenance`)
		}
		if (workflow.includes('secrets.NPM_TOKEN')) {
			fail(`${path} must not depend on long-lived NPM_TOKEN for publishing`)
		}
	}

	requireIncludes('.github/dependabot.yml', 'package-ecosystem: "github-actions"')
	requireIncludes('.github/dependabot.yml', 'package-ecosystem: "npm"')

	console.log('security: policy, CI, and publish hardening checks passed')
}

main()
