#!/usr/bin/env node

/**
 * Version Validation Script
 * =========================
 * Validates that package versions are:
 * 1. Synchronized across all packages
 * 2. Sequential (no gaps like 0.4.0 → 0.7.0)
 * 3. Consistent with git tags
 *
 * Run: node scripts/validate-version.js
 * Exit codes:
 *   0 = All validations passed
 *   1 = Validation failed
 */

const fs = require('node:fs')
const { execSync } = require('node:child_process')
const path = require('node:path')

// Configuration
const PACKAGES = ['packages/vestig/package.json', 'packages/vestig-next/package.json']

const ROOT_PACKAGE = 'package.json'

// Colors for console output
const colors = {
	red: (text) => `\x1b[31m${text}\x1b[0m`,
	green: (text) => `\x1b[32m${text}\x1b[0m`,
	yellow: (text) => `\x1b[33m${text}\x1b[0m`,
	blue: (text) => `\x1b[34m${text}\x1b[0m`,
	bold: (text) => `\x1b[1m${text}\x1b[0m`,
}

function log(message) {
	console.log(message)
}

function error(message) {
	console.error(colors.red(`❌ ${message}`))
}

function success(message) {
	console.log(colors.green(`✅ ${message}`))
}

function warn(message) {
	console.log(colors.yellow(`⚠️  ${message}`))
}

/**
 * Parse semantic version string
 */
function parseVersion(version) {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
	if (!match) return null
	return {
		major: Number.parseInt(match[1], 10),
		minor: Number.parseInt(match[2], 10),
		patch: Number.parseInt(match[3], 10),
		prerelease: match[4] || null,
		raw: version,
	}
}

/**
 * Get all package versions
 */
function getPackageVersions() {
	const versions = {}

	// Root package
	const rootPkg = JSON.parse(fs.readFileSync(ROOT_PACKAGE, 'utf8'))
	versions.root = rootPkg.version

	// Sub-packages
	for (const pkgPath of PACKAGES) {
		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
		versions[pkg.name] = pkg.version
	}

	return versions
}

/**
 * Get the latest git tag
 */
function getLatestTag() {
	try {
		const tag = execSync('git describe --tags --abbrev=0 2>/dev/null', {
			encoding: 'utf8',
		}).trim()
		return tag.startsWith('v') ? tag.slice(1) : tag
	} catch {
		return null
	}
}

/**
 * Get all git tags sorted by version
 */
function getAllTags() {
	try {
		const tags = execSync('git tag -l "v*" --sort=-version:refname 2>/dev/null', {
			encoding: 'utf8',
		})
			.trim()
			.split('\n')
			.filter(Boolean)
			.map((t) => (t.startsWith('v') ? t.slice(1) : t))
		return tags
	} catch {
		return []
	}
}

/**
 * Get the latest version published on npm
 */
function getNpmVersion(packageName) {
	try {
		const version = execSync(`npm view ${packageName} version 2>/dev/null`, {
			encoding: 'utf8',
		}).trim()
		return version
	} catch {
		return null
	}
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a, b) {
	const vA = parseVersion(a)
	const vB = parseVersion(b)
	if (!vA || !vB) return 0

	if (vA.major !== vB.major) return vA.major > vB.major ? 1 : -1
	if (vA.minor !== vB.minor) return vA.minor > vB.minor ? 1 : -1
	if (vA.patch !== vB.patch) return vA.patch > vB.patch ? 1 : -1
	return 0
}

/**
 * Check if version bump is valid (no gaps)
 */
function isValidBump(from, to) {
	const fromV = parseVersion(from)
	const toV = parseVersion(to)

	if (!fromV || !toV) return { valid: false, reason: 'Invalid version format' }

	// Major bump: X.0.0 → X+1.0.0
	if (toV.major === fromV.major + 1 && toV.minor === 0 && toV.patch === 0) {
		return { valid: true, type: 'major' }
	}

	// Minor bump: X.Y.Z → X.Y+1.0
	if (toV.major === fromV.major && toV.minor === fromV.minor + 1 && toV.patch === 0) {
		return { valid: true, type: 'minor' }
	}

	// Patch bump: X.Y.Z → X.Y.Z+1
	if (toV.major === fromV.major && toV.minor === fromV.minor && toV.patch === fromV.patch + 1) {
		return { valid: true, type: 'patch' }
	}

	// Same version (no bump)
	if (toV.major === fromV.major && toV.minor === fromV.minor && toV.patch === fromV.patch) {
		return { valid: true, type: 'none' }
	}

	// Invalid bump (gap detected)
	return {
		valid: false,
		reason: `Invalid version jump: ${from} → ${to}. Expected patch (+0.0.1), minor (+0.1.0), or major (+1.0.0)`,
	}
}

/**
 * Main validation
 */
function validate() {
	log(colors.bold('\n🔍 Vestig Version Validator\n'))
	log('━'.repeat(50))

	let hasErrors = false

	// 1. Check all packages have same version
	log(colors.blue('\n📦 Checking package version synchronization...\n'))
	const versions = getPackageVersions()
	const uniqueVersions = [...new Set(Object.values(versions))]

	if (uniqueVersions.length > 1) {
		error('Package versions are out of sync!')
		for (const [pkg, ver] of Object.entries(versions)) {
			log(`   ${pkg}: ${ver}`)
		}
		hasErrors = true
	} else {
		success(`All packages synchronized at v${uniqueVersions[0]}`)
		for (const [pkg, ver] of Object.entries(versions)) {
			log(`   ${colors.green('✓')} ${pkg}: ${ver}`)
		}
	}

	// 2. Check version against git tags AND npm (use highest as baseline)
	log(colors.blue('\n🏷️  Checking version against releases...\n'))
	const latestTag = getLatestTag()
	const npmVersion = getNpmVersion('vestig')
	const currentVersion = uniqueVersions[0]

	// Determine the actual latest released version (higher of tag or npm)
	let latestReleased = null
	let releaseSource = null

	if (latestTag && npmVersion) {
		const comparison = compareVersions(latestTag, npmVersion)
		if (comparison >= 0) {
			latestReleased = latestTag
			releaseSource = 'git tag'
		} else {
			latestReleased = npmVersion
			releaseSource = 'npm'
		}
	} else if (latestTag) {
		latestReleased = latestTag
		releaseSource = 'git tag'
	} else if (npmVersion) {
		latestReleased = npmVersion
		releaseSource = 'npm'
	}

	if (!latestReleased) {
		warn('No releases found. Skipping version validation.')
	} else {
		log(`   Latest git tag: ${latestTag ? `v${latestTag}` : 'none'}`)
		log(`   Latest npm: ${npmVersion ? `v${npmVersion}` : 'none'}`)
		log(`   Baseline (${releaseSource}): v${latestReleased}`)
		log(`   Current version: v${currentVersion}`)

		const bumpCheck = isValidBump(latestReleased, currentVersion)

		if (!bumpCheck.valid) {
			error(bumpCheck.reason)
			hasErrors = true
		} else if (bumpCheck.type === 'none') {
			warn(`Version ${currentVersion} matches latest release.`)
			warn('Bump the version if you have new changes to release.')
		} else {
			success(`Valid ${bumpCheck.type} bump: ${latestReleased} → ${currentVersion}`)
		}
	}

	// 4. Check tag history for gaps
	log(colors.blue('\n📜 Checking version history for gaps...\n'))
	const allTags = getAllTags()

	if (allTags.length < 2) {
		warn('Not enough tags to check history.')
	} else {
		let historyValid = true
		for (let i = 0; i < allTags.length - 1; i++) {
			const newer = allTags[i]
			const older = allTags[i + 1]
			const check = isValidBump(older, newer)

			if (!check.valid) {
				error(`Gap detected in history: v${older} → v${newer}`)
				historyValid = false
				hasErrors = true
			}
		}

		if (historyValid) {
			success(`Version history is sequential (${allTags.length} releases)`)
			log(
				`   ${allTags
					.slice(0, 5)
					.map((v) => `v${v}`)
					.join(' → ')}${allTags.length > 5 ? ' → ...' : ''}`,
			)
		}
	}

	// Summary
	log(`\n${'━'.repeat(50)}`)
	if (hasErrors) {
		log(colors.red(colors.bold('\n❌ Validation FAILED\n')))
		log('Please fix the version issues before releasing.')
		log('Run this script again after fixing.\n')
		process.exit(1)
	} else {
		log(colors.green(colors.bold('\n✅ All validations PASSED\n')))
		process.exit(0)
	}
}

// Run validation
validate()
