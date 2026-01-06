#!/usr/bin/env node

/**
 * Documentation Validation Script
 * ================================
 * Validates that documentation stays in sync with code:
 * 1. All transports are documented in README and docs
 * 2. New exports are mentioned in documentation
 * 3. Changed files have corresponding doc updates
 *
 * Run: node scripts/validate-docs.js
 * Exit codes:
 *   0 = All validations passed
 *   1 = Validation failed (missing docs)
 *   2 = Warning (should update docs)
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

// Colors for console output
const colors = {
	red: (text) => `\x1b[31m${text}\x1b[0m`,
	green: (text) => `\x1b[32m${text}\x1b[0m`,
	yellow: (text) => `\x1b[33m${text}\x1b[0m`,
	blue: (text) => `\x1b[34m${text}\x1b[0m`,
	cyan: (text) => `\x1b[36m${text}\x1b[0m`,
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

function info(message) {
	console.log(colors.cyan(`ℹ️  ${message}`))
}

// ============================================================================
// Transport Documentation Validation
// ============================================================================

function getTransportFiles() {
	const transportsDir = path.join(__dirname, '../packages/vestig/src/transports')
	const files = fs.readdirSync(transportsDir)

	return (
		files
			.filter((f) => f.endsWith('.ts') && !f.includes('.test.') && f !== 'index.ts')
			.map((f) => {
				const name = f.replace('.ts', '')
				const filePath = path.join(transportsDir, f)
				const content = fs.readFileSync(filePath, 'utf-8')

				// Extract actual class name from file
				const classMatch = content.match(/export\s+class\s+(\w+Transport)/)
				const className = classMatch
					? classMatch[1]
					: `${name.charAt(0).toUpperCase() + name.slice(1)}Transport`

				return { file: f, name, className }
			})
			// Filter out base classes
			.filter((t) => !['batch', 'base'].includes(t.name) && !t.className.includes('Base'))
	)
}

function checkReadmeTransports(transports) {
	const readmePath = path.join(__dirname, '../packages/vestig/README.md')
	const readme = fs.readFileSync(readmePath, 'utf-8')

	const missing = []
	for (const transport of transports) {
		// Check if transport is in the Available Transports table
		if (!readme.includes(`\`${transport.className}\``)) {
			missing.push(transport.className)
		}
	}

	return missing
}

function checkDocsTransports(transports) {
	const docsPath = path.join(__dirname, '../apps/web/app/docs/transports/page.mdx')

	if (!fs.existsSync(docsPath)) {
		return { missing: transports.map((t) => t.className), exists: false }
	}

	const docs = fs.readFileSync(docsPath, 'utf-8')

	const missing = []
	for (const transport of transports) {
		// Check if transport has a section in docs
		if (
			!docs.includes(`## ${transport.className}`) &&
			!docs.includes(`\`${transport.className}\``)
		) {
			missing.push(transport.className)
		}
	}

	return { missing, exists: true }
}

function checkIndexExports(transports) {
	const indexPath = path.join(__dirname, '../packages/vestig/src/index.ts')
	const index = fs.readFileSync(indexPath, 'utf-8')

	const missing = []
	for (const transport of transports) {
		if (!index.includes(transport.className)) {
			missing.push(transport.className)
		}
	}

	return missing
}

// ============================================================================
// Git-based Change Detection
// ============================================================================

function getChangedFiles() {
	try {
		// Get files changed compared to origin/main
		const result = execSync(
			'git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1',
			{
				encoding: 'utf-8',
			},
		)
		return result.trim().split('\n').filter(Boolean)
	} catch {
		return []
	}
}

function detectNewFeatures(changedFiles) {
	const newFeatures = []

	for (const file of changedFiles) {
		// New transport added
		if (
			file.match(/packages\/vestig\/src\/transports\/[^/]+\.ts$/) &&
			!file.includes('.test.') &&
			!file.includes('batch.ts') &&
			!file.includes('index.ts')
		) {
			const name = path.basename(file, '.ts')
			newFeatures.push({
				type: 'transport',
				name: `${name.charAt(0).toUpperCase() + name.slice(1)}Transport`,
				file,
				docsNeeded: ['packages/vestig/README.md', 'apps/web/app/docs/transports/page.mdx'],
			})
		}

		// New utility added
		if (file.match(/packages\/vestig\/src\/utils\/[^/]+\.ts$/) && !file.includes('.test.')) {
			const name = path.basename(file, '.ts')
			newFeatures.push({
				type: 'utility',
				name,
				file,
				docsNeeded: ['packages/vestig/README.md'],
			})
		}

		// New sampling strategy
		if (
			file.match(/packages\/vestig\/src\/sampling\/[^/]+\.ts$/) &&
			!file.includes('.test.') &&
			!file.includes('index.ts')
		) {
			const name = path.basename(file, '.ts')
			newFeatures.push({
				type: 'sampler',
				name,
				file,
				docsNeeded: ['apps/web/app/docs/sampling/page.mdx'],
			})
		}
	}

	return newFeatures
}

function checkDocsUpdated(newFeatures, changedFiles) {
	const missingDocs = []

	for (const feature of newFeatures) {
		const docsUpdated = feature.docsNeeded.some((doc) => changedFiles.includes(doc))
		if (!docsUpdated) {
			missingDocs.push(feature)
		}
	}

	return missingDocs
}

// ============================================================================
// Main Validation
// ============================================================================

function main() {
	log(colors.bold('\n🔍 Documentation Validator\n'))
	log('━'.repeat(50))

	let hasErrors = false
	let hasWarnings = false

	// 1. Check all transports are documented
	log(colors.blue('\n📦 Checking transport documentation...\n'))

	const transports = getTransportFiles()
	info(`Found ${transports.length} transports: ${transports.map((t) => t.className).join(', ')}`)

	// Check exports
	const notExported = checkIndexExports(transports)
	if (notExported.length > 0) {
		error(`Transports not exported from index.ts: ${notExported.join(', ')}`)
		hasErrors = true
	} else {
		success('All transports exported from index.ts')
	}

	// Check README
	const missingReadme = checkReadmeTransports(transports)
	if (missingReadme.length > 0) {
		error(`Transports missing from README.md: ${missingReadme.join(', ')}`)
		hasErrors = true
	} else {
		success('All transports documented in README.md')
	}

	// Check docs page
	const docsCheck = checkDocsTransports(transports)
	if (!docsCheck.exists) {
		warn('Transports docs page not found')
		hasWarnings = true
	} else if (docsCheck.missing.length > 0) {
		error(`Transports missing from docs/transports: ${docsCheck.missing.join(', ')}`)
		hasErrors = true
	} else {
		success('All transports documented in docs/transports')
	}

	// 2. Check if new features have documentation
	log(colors.blue('\n📝 Checking for undocumented new features...\n'))

	const changedFiles = getChangedFiles()
	if (changedFiles.length === 0) {
		info('No changed files detected (or not in git context)')
	} else {
		const newFeatures = detectNewFeatures(changedFiles)

		if (newFeatures.length === 0) {
			success('No new features requiring documentation')
		} else {
			const missingDocs = checkDocsUpdated(newFeatures, changedFiles)

			if (missingDocs.length > 0) {
				for (const feature of missingDocs) {
					warn(`New ${feature.type} "${feature.name}" may need documentation in:`)
					for (const doc of feature.docsNeeded) {
						log(`   - ${doc}`)
					}
				}
				hasWarnings = true
			} else {
				success('All new features have documentation updates')
			}
		}
	}

	// Summary
	log(`\n${'━'.repeat(50)}`)

	if (hasErrors) {
		log(colors.bold(colors.red('\n❌ Documentation validation FAILED\n')))
		log('Please update documentation before pushing.')
		log('Run this script again after fixing.\n')
		process.exit(1)
	} else if (hasWarnings) {
		log(colors.bold(colors.yellow('\n⚠️  Documentation validation passed with WARNINGS\n')))
		log('Consider updating documentation for new features.\n')
		process.exit(0) // Don't block, just warn
	} else {
		log(colors.bold(colors.green('\n✅ All documentation validations PASSED\n')))
		process.exit(0)
	}
}

main()
