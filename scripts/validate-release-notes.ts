#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')

const REQUIRED_RELEASE_DOC_SECTIONS = [
	'## Release Note Standard',
	'## Required Sections',
	'## GitHub Threads',
	'## Changelog Sync',
	'## LLM-Facing Documentation',
	'## Publish Security',
]

const VAGUE_ONLY_PATTERNS = [
	/^[-*]\s+harden log delivery and next exports\s*$/i,
	/^[-*]\s+misc changes\s*$/i,
	/^[-*]\s+updates\s*$/i,
	/^[-*]\s+bug fixes\s*$/i,
]

function read(path: string): string {
	return readFileSync(resolve(ROOT, path), 'utf-8')
}

function fail(message: string): never {
	console.error(`release-notes: ${message}`)
	process.exit(1)
}

function getCurrentVersion(): string {
	const pkg = JSON.parse(read('package.json')) as { version?: string }
	if (!pkg.version) fail('root package.json is missing version')
	return pkg.version
}

function getLatestChangelogEntry(changelog: string, version: string): string {
	const heading = `## [${version}]`
	const start = changelog.indexOf(heading)
	if (start === -1) fail(`CHANGELOG.md is missing v${version}`)

	const next = changelog.indexOf('\n## [', start + heading.length)
	return changelog.slice(start, next === -1 ? changelog.length : next).trim()
}

function getLatestWebEntry(page: string, version: string): string {
	const start = page.indexOf(`version: '${version}'`)
	if (start === -1) fail(`web changelog is missing v${version}`)

	const next = page.indexOf('\n\t{', start + 1)
	return page.slice(start, next === -1 ? page.length : next)
}

function main(): void {
	const version = getCurrentVersion()

	if (!existsSync(resolve(ROOT, 'RELEASE.md'))) {
		fail('RELEASE.md is required')
	}

	const releaseGuide = read('RELEASE.md')
	for (const section of REQUIRED_RELEASE_DOC_SECTIONS) {
		if (!releaseGuide.includes(section)) {
			fail(`RELEASE.md is missing ${section}`)
		}
	}

	const changelogEntry = getLatestChangelogEntry(read('CHANGELOG.md'), version)
	const sectionCount = [...changelogEntry.matchAll(/^###\s+/gm)].length
	const bulletCount = [...changelogEntry.matchAll(/^[-*]\s+/gm)].length

	if (sectionCount < 3) {
		fail(`CHANGELOG.md v${version} needs at least 3 concrete sections`)
	}

	if (bulletCount < 6) {
		fail(`CHANGELOG.md v${version} needs at least 6 concrete bullets`)
	}

	for (const line of changelogEntry.split('\n')) {
		if (VAGUE_ONLY_PATTERNS.some((pattern) => pattern.test(line.trim()))) {
			fail(`CHANGELOG.md v${version} contains a vague standalone bullet: ${line.trim()}`)
		}
	}

	for (const required of ['Verification', 'Publication Status', 'Thanks']) {
		if (!releaseGuide.includes(required) && !changelogEntry.includes(required)) {
			fail(`release notes must document ${required}`)
		}
	}

	const webEntry = getLatestWebEntry(read('apps/web/app/changelog/page.tsx'), version)
	const webItemCount = [...webEntry.matchAll(/'[^']{24,}'/g)].length
	if (webItemCount < 6) {
		fail(`web changelog v${version} is too thin for a public release`)
	}

	console.log(`release-notes: v${version} passes quality checks`)
}

main()
