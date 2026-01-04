#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * ======================
 * Automatically installs git hooks when running `bun install` or `npm install`.
 * This runs via the "prepare" script in package.json.
 */

const fs = require('node:fs')
const path = require('node:path')

const HOOKS_DIR = path.join(__dirname, '..', '.git', 'hooks')

// Pre-push hook: validates versions, docs, and changelog before pushing to remote
const PRE_PUSH_HOOK = `#!/bin/sh
#
# Pre-push hook: Validate version consistency, docs, and changelog before pushing
# This prevents version jumps, sync issues, outdated changelogs, and missing docs
#

# Only run on pushes to main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    exit 0
fi

echo "🔍 Running version validation before push..."
node scripts/validate-version.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push blocked: Version validation failed"
    echo "   Please fix version issues before pushing to main."
    echo ""
    exit 1
fi

echo "✅ Version validation passed"

echo ""
echo "🔍 Running documentation validation..."
node scripts/validate-docs.js

if [ $? -eq 1 ]; then
    echo ""
    echo "❌ Push blocked: Documentation validation failed"
    echo "   Please update documentation before pushing to main."
    echo ""
    exit 1
fi

echo ""
echo "🔍 Running changelog sync validation..."
node scripts/sync-changelog.js

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Warning: Changelog may be out of sync"
    echo "   Run 'node scripts/sync-changelog.js --fix' for suggestions"
    echo ""
    # Just warn, don't block push
fi

exit 0
`

// Pre-commit hook: runs linting
const PRE_COMMIT_HOOK = `#!/bin/sh
#
# Pre-commit hook: Run basic checks before commit
#

# Run format check (fast)
bun run format:check
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Commit blocked: Code formatting issues found"
    echo "   Run 'bun run format' to fix."
    echo ""
    exit 1
fi

exit 0
`

function setupHooks() {
	// Check if we're in a git repository
	if (!fs.existsSync(HOOKS_DIR)) {
		console.log('⚠️  Not a git repository or .git/hooks not found. Skipping hook setup.')
		return
	}

	const hooks = [
		{ name: 'pre-push', content: PRE_PUSH_HOOK },
		{ name: 'pre-commit', content: PRE_COMMIT_HOOK },
	]

	console.log('🔧 Setting up git hooks...')

	for (const hook of hooks) {
		const hookPath = path.join(HOOKS_DIR, hook.name)

		// Check if hook already exists (and is not a sample)
		if (fs.existsSync(hookPath) && !hookPath.endsWith('.sample')) {
			const existing = fs.readFileSync(hookPath, 'utf8')
			if (existing.includes('vestig') || existing.includes('validate-version')) {
				console.log(`   ✓ ${hook.name} hook already installed`)
				continue
			}
			// Backup existing hook
			fs.copyFileSync(hookPath, `${hookPath}.backup`)
			console.log(`   ⚠️  Backed up existing ${hook.name} to ${hook.name}.backup`)
		}

		fs.writeFileSync(hookPath, hook.content, { mode: 0o755 })
		console.log(`   ✓ Installed ${hook.name} hook`)
	}

	console.log('✅ Git hooks setup complete!')
}

// Run setup
setupHooks()
