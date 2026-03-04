#!/usr/bin/env bun
/**
 * Generate llms.txt files for AI context
 *
 * Following the llms.txt standard (https://llmstxt.org/):
 * - /public/llms.txt - Directory with links to all documentation
 * - /public/llms-full.txt - Complete documentation in one file
 *
 * Run: bun scripts/generate-llms.ts
 */

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const docsDir = join(rootDir, 'app', 'docs')
const contentDir = join(rootDir, 'content', 'llm')
const publicDir = join(rootDir, 'public')

const SITE_URL = 'https://vestig.dev'

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true })

/**
 * Navigation structure mirroring the sidebar
 * Each entry: [title, href] or [sectionTitle, entries[]]
 */
type NavEntry = { title: string; href: string }
type NavSection = { section: string; entries: NavEntry[] }

const navigation: NavSection[] = [
	{
		section: 'Getting Started',
		entries: [
			{ title: 'Introduction', href: '/docs' },
			{ title: 'Installation', href: '/docs/getting-started' },
			{ title: 'Features Overview', href: '/docs/features' },
		],
	},
	{
		section: 'Core Concepts',
		entries: [
			{ title: 'Logging Basics', href: '/docs/core/logging' },
			{ title: 'Log Levels', href: '/docs/core/levels' },
			{ title: 'Structured Output', href: '/docs/core/structured' },
			{ title: 'Child Loggers', href: '/docs/core/child-loggers' },
			{ title: 'Runtime Detection', href: '/docs/runtime' },
		],
	},
	{
		section: 'Tracing',
		entries: [
			{ title: 'Overview', href: '/docs/tracing' },
			{ title: 'Spans', href: '/docs/tracing/spans' },
			{ title: 'Context Propagation', href: '/docs/tracing/context' },
			{ title: 'W3C Trace Context', href: '/docs/tracing/w3c' },
			{ title: 'OTLP Export', href: '/docs/tracing/otlp' },
		],
	},
	{
		section: 'Transports',
		entries: [{ title: 'Overview', href: '/docs/transports' }],
	},
	{
		section: 'Sampling',
		entries: [
			{ title: 'Overview', href: '/docs/sampling' },
			{ title: 'Advanced Sampling', href: '/docs/sampling/advanced' },
		],
	},
	{
		section: 'Wide Events',
		entries: [
			{ title: 'Overview', href: '/docs/wide-events' },
			{ title: 'Tail Sampling', href: '/docs/wide-events/tail-sampling' },
		],
	},
	{
		section: 'Security',
		entries: [{ title: 'PII Sanitization', href: '/docs/security/sanitization' }],
	},
	{
		section: 'Integrations',
		entries: [
			{ title: 'Next.js', href: '/docs/nextjs' },
			{ title: 'Next.js Middleware', href: '/docs/nextjs/middleware' },
			{ title: 'Server Components', href: '/docs/nextjs/server-components' },
			{ title: 'Route Handlers', href: '/docs/nextjs/route-handlers' },
			{ title: 'Server Actions', href: '/docs/nextjs/server-actions' },
			{ title: 'Client Components', href: '/docs/nextjs/client' },
			{ title: 'Wide Events', href: '/docs/nextjs/wide-events' },
			{ title: 'Dev Overlay', href: '/docs/nextjs/dev-overlay' },
			{ title: 'Web Vitals', href: '/docs/nextjs/web-vitals' },
			{ title: 'Error Boundary', href: '/docs/nextjs/error-boundary' },
			{ title: 'Database Logging', href: '/docs/nextjs/database' },
			{ title: 'Instrumentation', href: '/docs/nextjs/instrumentation' },
		],
	},
	{
		section: 'Deployments',
		entries: [{ title: 'Cloudflare & Edge', href: '/docs/deployments/cloudflare' }],
	},
	{
		section: 'Advanced',
		entries: [
			{ title: 'Error Handling', href: '/docs/advanced/error-handling' },
			{ title: 'Error Recovery', href: '/docs/advanced/error-recovery' },
			{ title: 'Performance Tuning', href: '/docs/advanced/performance' },
			{ title: 'Memory Management', href: '/docs/advanced/memory-management' },
			{ title: 'Custom Transports', href: '/docs/advanced/custom-transports' },
		],
	},
	{
		section: 'Guides',
		entries: [{ title: 'Migration from Pino', href: '/docs/guides/migration-from-pino' }],
	},
	{
		section: 'API Reference',
		entries: [
			{ title: 'vestig', href: '/docs/api' },
			{ title: '@vestig/next', href: '/docs/api/next' },
		],
	},
]

/**
 * Convert a docs href to a file path
 * /docs -> app/docs/page.mdx
 * /docs/tracing -> app/docs/tracing/page.mdx
 */
function hrefToFilePath(href: string): string {
	const path = href.replace(/^\/docs\/?/, '') || ''
	if (path === '') {
		return join(docsDir, 'page.mdx')
	}
	return join(docsDir, path, 'page.mdx')
}

/**
 * Strip `export const metadata = {...}` block from MDX content
 */
function stripMetadata(content: string): string {
	// Match export const metadata = { ... } with nested braces
	return content.replace(
		/export\s+const\s+metadata\s*=\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*;?\n*/g,
		'',
	)
}

/**
 * Strip MDX/JSX component imports
 */
function stripMdxImports(content: string): string {
	return content.replace(/^import\s+.*$/gm, '')
}

/**
 * Strip JSX components (Table, etc.) and convert to plain text tables if possible
 */
function stripJsxComponents(content: string): string {
	// Remove Table components but try to preserve content
	let result = content

	// Simple approach: remove all JSX tags
	result = result.replace(/<Table[^>]*>/g, '')
	result = result.replace(/<\/Table>/g, '')
	result = result.replace(/<TableHead[^>]*>/g, '')
	result = result.replace(/<\/TableHead>/g, '')
	result = result.replace(/<TableBody[^>]*>/g, '')
	result = result.replace(/<\/TableBody>/g, '')
	result = result.replace(/<TableRow[^>]*>/g, '')
	result = result.replace(/<\/TableRow>/g, '\n')
	result = result.replace(/<TableHeader[^>]*>/g, '| ')
	result = result.replace(/<\/TableHeader>/g, ' ')
	result = result.replace(/<TableCell[^>]*>/g, '| ')
	result = result.replace(/<\/TableCell>/g, ' ')

	// Remove any other JSX-like tags (self-closing and paired)
	result = result.replace(/<[A-Z][a-zA-Z]*\s*[^>]*\/>/g, '')
	result = result.replace(/<[A-Z][a-zA-Z]*[^>]*>|<\/[A-Z][a-zA-Z]*>/g, '')

	return result
}

/**
 * Clean MDX content for plain text output
 */
function cleanContent(content: string): string {
	let cleaned = content
	cleaned = stripMetadata(cleaned)
	cleaned = stripMdxImports(cleaned)
	cleaned = stripJsxComponents(cleaned)
	// Remove multiple consecutive blank lines
	cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
	return cleaned.trim()
}

/**
 * Read a page file and return cleaned content, or null if not found
 */
function readPage(filePath: string): string | null {
	try {
		const content = readFileSync(filePath, 'utf-8')
		return cleanContent(content)
	} catch {
		return null
	}
}

// ─── Generate llms.txt (directory format) ────────────────────────────

const llmsTxtLines: string[] = [
	'# Vestig',
	'',
	'> Zero-dependency TypeScript logging with auto PII sanitization, native tracing, and multi-runtime support.',
	'',
	`- [Full documentation](${SITE_URL}/llms-full.txt)`,
	'',
]

for (const section of navigation) {
	llmsTxtLines.push(`## ${section.section}`)
	for (const entry of section.entries) {
		llmsTxtLines.push(`- [${entry.title}](${SITE_URL}${entry.href}): ${entry.title}`)
	}
	llmsTxtLines.push('')
}

const llmsTxt = llmsTxtLines.join('\n')
writeFileSync(join(publicDir, 'llms.txt'), llmsTxt)
console.log('✓ Generated /public/llms.txt')

// ─── Generate llms-full.txt (all docs content) ──────────────────────

const fullParts: string[] = []
let pageCount = 0

for (const section of navigation) {
	for (const entry of section.entries) {
		const filePath = hrefToFilePath(entry.href)
		const content = readPage(filePath)
		if (content) {
			fullParts.push(content)
			pageCount++
		} else {
			console.warn(`⚠ Page not found: ${entry.href} (expected: ${relative(rootDir, filePath)})`)
		}
	}
}

// Append the API reference from content/llm/
try {
	const apiRef = readFileSync(join(contentDir, 'api-reference.md'), 'utf-8')
	fullParts.push(apiRef.trim())
	pageCount++
	console.log('  + Appended api-reference.md')
} catch {
	console.warn('⚠ api-reference.md not found')
}

const llmsFullTxt = fullParts.join('\n\n---\n\n')
writeFileSync(join(publicDir, 'llms-full.txt'), llmsFullTxt)
console.log(`✓ Generated /public/llms-full.txt (${pageCount} pages)`)

console.log('\nDone! LLM context files generated.')
