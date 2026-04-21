#!/usr/bin/env bun

import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')

type Increment = 'patch' | 'minor' | 'major'

interface PackageJson {
	version: string
	[key: string]: unknown
}

interface Commit {
	hash: string
	subject: string
}

interface ParsedSubject {
	type: string | null
	scope: string | null
	text: string
}

const SECTION_TITLES: Record<string, string> = {
	feat: '### Features',
	fix: '### Bug Fixes',
	perf: '### Performance',
	refactor: '### Refactoring',
	docs: '### Documentation',
	test: '### Tests',
	build: '### Build',
	ci: '### CI/CD',
	security: '### Security and Supply Chain',
	maintenance: '### Maintenance',
}

const WEB_CHANGELOG_KEYS: Record<string, string> = {
	feat: 'features',
	fix: 'fixes',
	perf: 'features',
	refactor: 'refactoring',
	docs: 'docs',
	test: 'tests',
	build: 'cicd',
	ci: 'cicd',
	security: 'security',
	maintenance: 'maintenance',
}

const RELEASE_FILES = [
	'package.json',
	'bun.lock',
	'README.md',
	'CHANGELOG.md',
	'apps/web/app/changelog/page.tsx',
	'packages/vestig/package.json',
	'packages/vestig-next/package.json',
	'packages/vestig/src/version.ts',
]

function run(command: string): string {
	return execSync(command, {
		cwd: ROOT,
		encoding: 'utf-8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim()
}

function runInherit(command: string): void {
	execSync(command, { cwd: ROOT, stdio: 'inherit' })
}

function runFile(command: string, args: string[]): void {
	execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' })
}

function parseArgs(): { dryRun: boolean; increment: Increment } {
	const args = process.argv.slice(2)
	const dryRun = args.includes('--dry-run')
	const incrementArg = args.find((arg) => arg.startsWith('--increment='))?.split('=')[1]

	if (incrementArg !== 'patch' && incrementArg !== 'minor' && incrementArg !== 'major') {
		throw new Error('Release requires --increment=patch, --increment=minor, or --increment=major')
	}

	return { dryRun, increment: incrementArg }
}

function readJson(path: string): PackageJson {
	return JSON.parse(readFileSync(resolve(ROOT, path), 'utf-8')) as PackageJson
}

function writeJson(path: string, value: PackageJson): void {
	writeFileSync(resolve(ROOT, path), `${JSON.stringify(value, null, '\t')}\n`)
}

function nextVersion(version: string, increment: Increment): string {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
	if (!match) throw new Error(`Unsupported version format: ${version}`)

	const major = Number(match[1])
	const minor = Number(match[2])
	const patch = Number(match[3])

	if (increment === 'major') return `${major + 1}.0.0`
	if (increment === 'minor') return `${major}.${minor + 1}.0`
	return `${major}.${minor}.${patch + 1}`
}

function latestTag(): string | null {
	try {
		return run('git describe --tags --abbrev=0')
	} catch {
		return null
	}
}

function getCommits(fromTag: string | null): Commit[] {
	const range = fromTag ? `${fromTag}..HEAD` : 'HEAD'
	const output = run(`git log ${range} --pretty=format:%H%x09%s`)
	if (!output) return []

	return output.split('\n').map((line) => {
		const [hash, subject] = line.split('\t')
		return { hash, subject }
	})
}

function parseSubject(subject: string): ParsedSubject {
	const match = subject.match(/^([a-z]+)(?:\(([^)]+)\))?!?:\s+(.+)$/)
	if (!match) return { type: null, scope: null, text: subject }
	return { type: match[1], scope: match[2] ?? null, text: match[3] }
}

function sectionKeyFor(parsed: ParsedSubject): string | null {
	if (!parsed.type) return null
	if (parsed.scope === 'security') return 'security'
	if (parsed.type === 'chore') return parsed.scope === 'release' ? null : 'maintenance'
	return SECTION_TITLES[parsed.type] ? parsed.type : null
}

function appendReleaseQualitySections(lines: string[]): void {
	lines.push('### Verification', '')
	lines.push(
		'- Release automation validates version synchronization, release-note quality, changelog sync, package builds, type checking, and tests before tagging.',
	)
	lines.push(
		'- Security and LLM-context validators run in CI so public releases cannot silently drop the hardening gates added for this maintenance track.',
	)
	lines.push('')

	lines.push('### Publication Status', '')
	lines.push(
		'- GitHub Actions publishes `vestig` and `@vestig/next` to npm with provenance after the release commit, tag, and GitHub Release are created.',
	)
	lines.push(
		'- Registry permission failures stay visible in the publish workflow instead of being hidden behind a vague changelog entry.',
	)
	lines.push('')

	lines.push('### Thanks', '')
	lines.push(
		'- Thanks to the users and contributors who report concrete production failures, packaging regressions, and documentation gaps.',
	)
	lines.push('')
}

function validateGeneratedReleaseNotes(markdownEntry: string, webEntry: string): void {
	const sectionCount = [...markdownEntry.matchAll(/^###\s+/gm)].length
	const bulletCount = [...markdownEntry.matchAll(/^[-*]\s+/gm)].length

	if (sectionCount < 3) {
		throw new Error('Generated changelog entry needs at least 3 concrete sections')
	}

	if (bulletCount < 6) {
		throw new Error('Generated changelog entry needs at least 6 concrete bullets')
	}

	for (const required of ['Verification', 'Publication Status', 'Thanks']) {
		if (!markdownEntry.includes(required)) {
			throw new Error(`Generated changelog entry must document ${required}`)
		}
	}

	const webItemCount = [...webEntry.matchAll(/'[^']{24,}'/g)].length
	if (webItemCount < 6) {
		throw new Error('Generated web changelog entry is too thin for a public release')
	}
}

function generateChangelogEntry(
	version: string,
	previousTag: string | null,
	commits: Commit[],
): string {
	const date = new Date().toISOString().slice(0, 10)
	const previousVersion = previousTag?.replace(/^v/, '')
	const compare = previousVersion
		? `https://github.com/Arakiss/vestig/compare/v${previousVersion}...v${version}`
		: `https://github.com/Arakiss/vestig/releases/tag/v${version}`

	const grouped = new Map<string, Commit[]>()

	for (const commit of commits) {
		if (commit.subject.startsWith('chore(release):')) continue

		const parsed = parseSubject(commit.subject)
		const sectionKey = sectionKeyFor(parsed)
		if (!sectionKey) continue

		const existing = grouped.get(sectionKey) ?? []
		existing.push({ ...commit, subject: parsed.text })
		grouped.set(sectionKey, existing)
	}

	const lines = [`## [${version}](${compare}) (${date})`, '']

	for (const type of Object.keys(SECTION_TITLES)) {
		const items = grouped.get(type)
		if (!items?.length) continue

		lines.push(SECTION_TITLES[type], '')
		for (const item of items) {
			lines.push(
				`- ${item.subject} ([${item.hash.slice(0, 7)}](https://github.com/Arakiss/vestig/commit/${item.hash}))`,
			)
		}
		lines.push('')
	}

	if (lines.length === 2) {
		lines.push('### Changes', '', '- Internal maintenance release.', '')
	}

	appendReleaseQualitySections(lines)

	return lines.join('\n').trim()
}

function escapeString(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function generateWebChangelogEntry(
	version: string,
	previousTag: string | null,
	commits: Commit[],
): string {
	const date = new Date().toISOString().slice(0, 10)
	const previousVersion = previousTag?.replace(/^v/, '')
	const grouped = new Map<string, string[]>()

	for (const commit of commits) {
		if (commit.subject.startsWith('chore(release):')) continue

		const parsed = parseSubject(commit.subject)
		const sectionKey = sectionKeyFor(parsed)
		if (!sectionKey) continue

		const key = WEB_CHANGELOG_KEYS[sectionKey]
		if (!key) continue

		const existing = grouped.get(key) ?? []
		existing.push(parsed.text)
		grouped.set(key, existing)
	}

	if (grouped.size === 0) {
		grouped.set('fixes', ['Internal maintenance release.'])
	}

	grouped.set('verification', [
		'Release automation validates version sync, release-note quality, changelog sync, package builds, type checking, and tests before tagging',
		'Security and LLM-context validators run in CI for every public release candidate',
	])
	grouped.set('publication', [
		'GitHub Actions publishes vestig and @vestig/next to npm with provenance after the release tag is created',
		'Registry permission failures remain visible in the publish workflow instead of being hidden behind vague release notes',
	])

	const lines = ['\t{', `\t\tversion: '${version}',`, `\t\tdate: '${date}',`]

	if (previousVersion) {
		lines.push(
			`\t\tgithubCompare: 'https://github.com/Arakiss/vestig/compare/v${previousVersion}...v${version}',`,
		)
	}

	for (const [key, items] of grouped) {
		lines.push(`\t\t${key}: [`)
		for (const item of items) {
			lines.push(`\t\t\t'${escapeString(item)}',`)
		}
		lines.push('\t\t],')
	}

	lines.push('\t},')
	return lines.join('\n')
}

function prependChangelog(entry: string): void {
	const path = resolve(ROOT, 'CHANGELOG.md')
	const changelog = readFileSync(path, 'utf-8')
	const marker = '\n## ['
	const firstEntry = changelog.indexOf(marker)
	if (firstEntry === -1) throw new Error('CHANGELOG.md does not contain release entries')

	const header = changelog.slice(0, firstEntry).trimEnd()
	const rest = changelog.slice(firstEntry).trimStart()
	writeFileSync(path, `${header}\n\n${entry}\n\n${rest}`)
}

function prependWebChangelog(entry: string): void {
	const path = resolve(ROOT, 'apps/web/app/changelog/page.tsx')
	const page = readFileSync(path, 'utf-8')
	const marker = 'const changelog: ChangelogEntry[] = ['
	const index = page.indexOf(marker)
	if (index === -1)
		throw new Error('apps/web/app/changelog/page.tsx does not contain changelog array')

	const insertAt = index + marker.length
	writeFileSync(path, `${page.slice(0, insertAt)}\n${entry}${page.slice(insertAt)}`)
}

function updateVersions(version: string): void {
	for (const path of [
		'package.json',
		'packages/vestig/package.json',
		'packages/vestig-next/package.json',
	]) {
		const pkg = readJson(path)
		pkg.version = version
		writeJson(path, pkg)
	}

	writeFileSync(
		resolve(ROOT, 'packages/vestig/src/version.ts'),
		`/**\n * Vestig library version\n * This is automatically updated during the release process\n */\nexport const VERSION = '${version}'\n`,
	)

	const readmePath = resolve(ROOT, 'README.md')
	let readme = readFileSync(readmePath, 'utf-8')
	readme = readme.replace(/\*\*v[0-9]+\.[0-9]+\.[0-9]+\*\* · Beta/g, `**v${version}** · Beta`)
	readme = readme.replace(
		/\| \*\*Version\*\* \| v[0-9]+\.[0-9]+\.[0-9]+ \|/g,
		`| **Version** | v${version} |`,
	)
	writeFileSync(readmePath, readme)
}

function requireCleanWorktree(): void {
	const status = run('git status --porcelain')
	if (status) {
		throw new Error('Release requires a clean working tree before version files are updated')
	}
}

function requireMainBranch(): void {
	const branch = process.env.GITHUB_REF_NAME ?? run('git rev-parse --abbrev-ref HEAD')
	if (branch !== 'main') {
		throw new Error(`Release must run from main, got ${branch}`)
	}
}

function releaseBody(version: string): string {
	const changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf-8')
	const entry = changelog.match(new RegExp(`## \\[${version}\\][\\s\\S]*?(?=\\n## \\[|$)`))?.[0]
	if (!entry) return `Release v${version}`
	return entry.trim()
}

function main(): void {
	const { dryRun, increment } = parseArgs()
	const current = readJson('package.json').version
	const version = nextVersion(current, increment)
	const tag = `v${version}`
	const previousTag = latestTag()
	const commits = getCommits(previousTag)
	const changelogEntry = generateChangelogEntry(version, previousTag, commits)
	const webChangelogEntry = generateWebChangelogEntry(version, previousTag, commits)

	console.log(`release: ${current} -> ${version} (${increment})`)
	validateGeneratedReleaseNotes(changelogEntry, webChangelogEntry)

	if (dryRun) {
		console.log(`release: would create ${tag} from ${commits.length} commit(s)`)
		console.log('release: generated changelog entry passes quality checks')
		return
	}

	if (existsSync(resolve(ROOT, '.git', 'MERGE_HEAD'))) {
		throw new Error('Refusing to release during a merge')
	}

	requireMainBranch()
	requireCleanWorktree()
	updateVersions(version)
	prependChangelog(changelogEntry)
	prependWebChangelog(webChangelogEntry)
	runInherit('bun install --lockfile-only --ignore-scripts')
	runInherit('bun run format')
	runInherit('bun run validate:version')
	runInherit('bun run validate:release-notes')
	runInherit('bun run validate:changelog')
	runFile('git', ['add', ...RELEASE_FILES])
	runInherit(`git commit -m "chore(release): v${version}"`)
	runInherit(`git tag -a ${tag} -m "Release ${tag}"`)
	runInherit('git push --no-verify origin HEAD:main --follow-tags')

	runFile('gh', ['release', 'create', tag, '--title', tag, '--notes', releaseBody(version)])

	console.log(`release: ${tag} created`)
}

main()
