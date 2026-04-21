#!/usr/bin/env bun

/**
 * Git Hooks Setup Script
 * ======================
 * Automatically installs git hooks when running `bun install` or `npm install`.
 * This runs via the "prepare" script in package.json.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const HOOKS_DIR = join(ROOT, '.git', 'hooks')

interface Hook {
	name: string
	content: string
}

// Pre-push hook: validates versions, docs, and changelog before pushing to remote
const PRE_PUSH_HOOK = `#!/bin/sh
#
# Pre-push hook: Validate version consistency, docs, release notes, security, and LLM context
#

# Only run on pushes to main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    exit 0
fi

echo "🔍 Running version validation before push..."
bun scripts/validate-version.ts

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
bun scripts/validate-docs.ts

if [ $? -eq 1 ]; then
    echo ""
    echo "❌ Push blocked: Documentation validation failed"
    echo "   Please update documentation before pushing to main."
    echo ""
    exit 1
fi

echo ""
echo "🔍 Running changelog sync validation..."
bun scripts/sync-changelog.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push blocked: Changelog is out of sync"
    echo "   Run 'bun scripts/sync-changelog.ts --fix' for suggestions"
    echo ""
    exit 1
fi

echo ""
echo "🔍 Running release notes validation..."
bun scripts/validate-release-notes.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push blocked: Release notes are too thin or out of policy"
    echo ""
    exit 1
fi

echo ""
echo "🔍 Running security policy validation..."
bun scripts/validate-security.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push blocked: Security policy or release hardening validation failed"
    echo ""
    exit 1
fi

echo ""
echo "🔍 Running LLM context validation..."
bun scripts/validate-llms.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push blocked: LLM context is missing required guidance"
    echo ""
    exit 1
fi

exit 0
`

// Pre-commit hook: runs linting and regenerates llms.txt if needed
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

# Regenerate llms.txt if LLM content files changed
if git diff --cached --name-only | grep -qE "apps/web/content/llm/|apps/web/app/docs/"; then
    echo "📝 LLM content changed, regenerating llms.txt..."
    cd apps/web && bun run prebuild && cd ../..
    git add apps/web/public/llms.txt apps/web/public/llms-full.txt
    echo "   ✓ llms.txt regenerated and staged"
fi

exit 0
`

function setupHooks(): void {
	// Check if we're in a git repository
	if (!existsSync(HOOKS_DIR)) {
		console.log('⚠️  Not a git repository or .git/hooks not found. Skipping hook setup.')
		return
	}

	const hooks: Hook[] = [
		{ name: 'pre-push', content: PRE_PUSH_HOOK },
		{ name: 'pre-commit', content: PRE_COMMIT_HOOK },
	]

	console.log('🔧 Setting up git hooks...')

	for (const hook of hooks) {
		const hookPath = join(HOOKS_DIR, hook.name)

		// Check if hook already exists (and is not a sample)
		if (existsSync(hookPath) && !hookPath.endsWith('.sample')) {
			const existing = readFileSync(hookPath, 'utf8')
			if (existing.includes('vestig') || existing.includes('validate-version')) {
				console.log(`   ✓ ${hook.name} hook already installed`)
				continue
			}
			// Backup existing hook
			copyFileSync(hookPath, `${hookPath}.backup`)
			console.log(`   ⚠️  Backed up existing ${hook.name} to ${hook.name}.backup`)
		}

		writeFileSync(hookPath, hook.content, { mode: 0o755 })
		console.log(`   ✓ Installed ${hook.name} hook`)
	}

	console.log('✅ Git hooks setup complete!')
}

// Run setup
setupHooks()
