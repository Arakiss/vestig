#!/usr/bin/env bun

/**
 * Changelog Sync Script
 * =====================
 * This script validates that the web changelog page is up-to-date with git tags.
 * Run during CI or as a pre-push hook to ensure changelog stays synchronized.
 *
 * STRICT MODE: Fails (exit 1) if changelog is out of sync.
 *
 * Usage:
 *   bun scripts/sync-changelog.ts        # Check mode (exits with error if out of sync)
 *   bun scripts/sync-changelog.ts --fix  # Show instructions for what's missing
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
} as const

type ColorName = keyof typeof colors

interface CategorizedCommits {
	features: string[]
	fixes: string[]
	docs: string[]
	tests: string[]
	breaking: string[]
	refactoring: string[]
	cicd: string[]
}

function log(color: ColorName, message: string): void {
	console.log(`${colors[color] || ''}${message}${colors.reset}`)
}

function getGitTags(): string[] {
	try {
		// Fetch latest tags from remote to ensure we have all tags
		// This is important because CI may have created new tags that we don't have locally
		try {
			execSync('git fetch --tags --quiet', { cwd: ROOT, encoding: 'utf-8' })
		} catch {
			// Ignore fetch errors (e.g., no network) and continue with local tags
		}

		const output = execSync('git tag --sort=-version:refname', {
			cwd: ROOT,
			encoding: 'utf-8',
		})
		return output
			.split('\n')
			.filter((tag) => tag.startsWith('v'))
			.map((tag) => tag.slice(1))
	} catch {
		log('red', 'Error: Failed to get git tags')
		process.exit(1)
	}
}

function getChangelogVersions(): string[] {
	try {
		const changelogPath = resolve(ROOT, 'apps/web/app/changelog/page.tsx')
		const content = readFileSync(changelogPath, 'utf-8')

		// Extract versions from changelog entries
		const versionMatches = content.matchAll(/version:\s*['"]([0-9]+\.[0-9]+\.[0-9]+)['"]/g)
		return [...versionMatches].map((m) => m[1])
	} catch {
		log('red', 'Error: Failed to read changelog page')
		process.exit(1)
	}
}

function getTagDate(tag: string): string {
	try {
		const output = execSync(`git log -1 --format=%ci v${tag}`, {
			cwd: ROOT,
			encoding: 'utf-8',
		})
		return output.trim().split(' ')[0]
	} catch {
		return 'unknown'
	}
}

function getTagCommits(fromTag: string | null, toTag: string): string[] {
	try {
		const range = fromTag ? `v${fromTag}..v${toTag}` : `v${toTag}`
		const output = execSync(`git log ${range} --oneline`, {
			cwd: ROOT,
			encoding: 'utf-8',
		})
		return output.trim().split('\n').filter(Boolean)
	} catch {
		return []
	}
}

type CommitCategory = keyof CategorizedCommits | null

function categorizeCommit(message: string): CommitCategory {
	const lower = message.toLowerCase()
	if (lower.includes('feat:') || lower.includes('feat(')) return 'features'
	if (lower.includes('fix:') || lower.includes('fix(')) return 'fixes'
	if (lower.includes('docs:') || lower.includes('docs(')) return 'docs'
	if (lower.includes('test:') || lower.includes('test(')) return 'tests'
	if (lower.includes('refactor:') || lower.includes('refactor(')) return 'refactoring'
	if (lower.includes('perf:') || lower.includes('perf(')) return 'features'
	if (lower.includes('security:') || lower.includes('security(')) return 'fixes'
	if (lower.includes('ci:') || lower.includes('ci(') || lower.includes('chore(ci)')) return 'cicd'
	if (lower.includes('breaking:') || lower.includes('!:')) return 'breaking'
	return null
}

function generateEntryCode(version: string, prevVersion: string | null, date: string): string {
	const commits = getTagCommits(prevVersion, version)
	const categorized: CategorizedCommits = {
		features: [],
		fixes: [],
		docs: [],
		tests: [],
		breaking: [],
		refactoring: [],
		cicd: [],
	}

	for (const commit of commits) {
		// Skip version bump commits
		if (commit.includes('chore(release)') || commit.includes('chore: bump')) continue

		const category = categorizeCommit(commit)
		if (category) {
			// Extract the message after the hash
			const message = commit.replace(/^[a-f0-9]+\s+/, '')
			// Clean up conventional commit prefix
			const cleanMessage = message.replace(
				/^(feat|fix|docs|test|refactor|perf|security|ci|chore)(\([^)]+\))?:\s*/i,
				'',
			)
			categorized[category].push(cleanMessage)
		}
	}

	const lines: string[] = [
		'\t{',
		`\t\tversion: '${version}',`,
		`\t\tdate: '${date}',`,
		`\t\tgithubCompare: 'https://github.com/Arakiss/vestig/compare/v${prevVersion}...v${version}',`,
	]

	for (const [key, items] of Object.entries(categorized)) {
		if (items.length > 0) {
			lines.push(`\t\t${key}: [`)
			for (const item of items) {
				lines.push(`\t\t\t'${item.replace(/'/g, "\\'")}',`)
			}
			lines.push('\t\t],')
		}
	}

	lines.push('\t},')

	return lines.join('\n')
}

function main(): void {
	const fixMode = process.argv.includes('--fix')

	log('bold', '\n🔍 Changelog Sync Validator\n')
	console.log('━'.repeat(50))

	const gitTags = getGitTags()
	const changelogVersions = getChangelogVersions()

	log('cyan', `\n📦 Git tags found: ${gitTags.length}`)
	log('cyan', `📄 Changelog entries: ${changelogVersions.length}`)

	// Find missing versions (in git tags but not in changelog)
	const missingVersions = gitTags.filter((v) => !changelogVersions.includes(v))

	if (missingVersions.length === 0) {
		log('green', '\n✅ Changelog is up-to-date with all git tags!\n')
		process.exit(0)
	}

	log('red', `\n❌ Missing ${missingVersions.length} version(s) in changelog:`)
	for (const version of missingVersions) {
		console.log(`   - v${version} (tagged on ${getTagDate(version)})`)
	}

	if (fixMode) {
		log('blue', '\n📝 Suggested changelog entries:\n')
		console.log('Add these entries to apps/web/app/changelog/page.tsx:\n')

		for (let i = 0; i < missingVersions.length; i++) {
			const version = missingVersions[i]
			const prevVersionIndex = gitTags.indexOf(version) + 1
			const prevVersion = prevVersionIndex < gitTags.length ? gitTags[prevVersionIndex] : null
			const date = getTagDate(version)

			console.log(generateEntryCode(version, prevVersion, date))
			console.log('')
		}
	} else {
		log('yellow', '\nRun with --fix to see suggested changelog entries:')
		console.log('  bun scripts/sync-changelog.ts --fix\n')
	}

	// STRICT: Always fail if changelog is out of sync
	log('red', '\n❌ Push blocked: Changelog is out of sync with git tags.')
	log('yellow', '   Please update apps/web/app/changelog/page.tsx before pushing.\n')
	process.exit(1)
}

main()
