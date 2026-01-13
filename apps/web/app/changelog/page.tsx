import { InnerNav } from '@/components/layout'
import { ArrowLeft, Calendar, GitCommit, OpenNewWindow } from 'iconoir-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Changelog',
	description:
		'All notable changes to Vestig. Release notes, new features, bug fixes, and breaking changes.',
	openGraph: {
		title: 'Changelog | Vestig',
		description: 'Release notes and version history for Vestig logging library.',
	},
}

interface ChangelogEntry {
	version: string
	date: string
	githubCompare?: string
	features?: string[]
	fixes?: string[]
	docs?: string[]
	tests?: string[]
	breaking?: string[]
	refactoring?: string[]
	cicd?: string[]
}

const changelog: ChangelogEntry[] = [
	{
		version: '0.18.0',
		date: '2026-01-13',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.17.0...v0.18.0',
		docs: [
			'update README and landing page for v0.18.0',
			'update hero badge to v0.18.0 — Auto-Instrumentation & OTLP',
		],
	},
	{
		version: '0.17.0',
		date: '2026-01-13',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.16.0...v0.17.0',
		features: [
			'add instrumentFetch() for automatic fetch() span creation',
			'add registerVestig() unified setup for Next.js instrumentation',
			'auto-propagate trace context via traceparent header',
			'configurable URL filtering and header capture',
			'automatic OTLP environment variable detection',
		],
		docs: ['add Auto-Instrumentation API documentation', 'add @vestig/next instrumentation guide'],
	},
	{
		version: '0.16.0',
		date: '2026-01-13',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.15.1...v0.16.0',
		features: [
			'add OpenTelemetry Protocol (OTLP) export support',
			'add OTLPExporter for exporting spans to OTLP backends',
			'add SpanProcessor interface with global registry',
			'automatic span capture on start/end via registerSpanProcessor()',
		],
	},
	{
		version: '0.15.1',
		date: '2026-01-12',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.15.0...v0.15.1',
		fixes: ['fetch remote tags before changelog validation'],
		docs: ['add v0.14.4 and v0.15.0 to changelog page'],
	},
	{
		version: '0.15.0',
		date: '2026-01-12',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.14.4...v0.15.0',
		features: ['add LLMs.txt button with copy/download in docs sidebar'],
		docs: [
			'update llms.txt with complete API documentation (Wide Events, Metrics, Runtime detection)',
		],
	},
	{
		version: '0.14.4',
		date: '2026-01-12',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.14.3...v0.14.4',
		fixes: ['add Cloudflare Workers compatibility for FinalizationRegistry'],
	},
	{
		version: '0.14.3',
		date: '2026-01-07',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.14.2...v0.14.3',
		fixes: ['create .npmrc in package dir for bun publish auth'],
	},
	{
		version: '0.14.2',
		date: '2026-01-07',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.14.1...v0.14.2',
		fixes: ['remove deprecated @vestig/express from workflows'],
	},
	{
		version: '0.14.1',
		date: '2026-01-07',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.14.0...v0.14.1',
		fixes: ['configure npm auth for bun publish'],
	},
	{
		version: '0.14.0',
		date: '2026-01-07',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.13.0...v0.14.0',
		features: ['enhanced code blocks with line numbers and highlighting'],
		fixes: [
			'skip git hooks during release push',
			'update README version in release hook',
			'use bun publish to resolve workspace:* dependencies',
			'properly extract nested spans from Shiki HTML output',
			'reduce excessive line-height in code blocks',
		],
		docs: [
			'sync sidebar navigation with all documentation pages',
			'add attribution for wide events concept',
			'add Wide Events release notes for v0.13.0',
		],
		refactoring: ['convert scripts to TypeScript and add strict validation'],
	},
	{
		version: '0.13.0',
		date: '2026-01-06',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.12.0...v0.13.0',
		features: [
			'Wide Events (Canonical Log Lines) - comprehensive single-event records per operation',
			'Tail Sampling for wide events - outcome-based sampling (100% errors, sample success)',
			'WideEventBuilder for accumulating context throughout request lifecycle',
			'Request-scoped wide event context via AsyncLocalStorage',
			'HTTP request and background job event schemas',
			'Next.js wide events integration with middleware and server actions',
		],
		docs: [
			'Add Wide Events documentation with tail sampling guide',
			'Add Next.js wide events integration guide',
			'Update README with Wide Events section and examples',
		],
		tests: ['Add comprehensive tests for wide events builder, context, and schemas'],
	},
	{
		version: '0.12.0',
		date: '2026-01-06',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.11.5...v0.12.0',
		features: [
			'Implement emitWideEvent() method in Logger for wide event emission',
			'Add TailSampler for outcome-based wide event sampling',
			'Export wide events module from main package entry point',
		],
		fixes: ['Resolve all BiomeJS linting errors (import ordering, non-null assertions)'],
	},
	{
		version: '0.11.5',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.11.4...v0.11.5',
		fixes: ['Replace Unicode box-drawing characters with ASCII in documentation'],
	},
	{
		version: '0.11.4',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.11.3...v0.11.4',
		features: ['Enable GFM (GitHub Flavored Markdown) support for tables in MDX'],
		docs: ['Update README to reflect current v0.11.3 release'],
		refactoring: ['Redesign error page with enhanced visuals'],
	},
	{
		version: '0.11.3',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.11.2...v0.11.3',
		fixes: ['Correct error page button styling'],
	},
	{
		version: '0.11.2',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.11.1...v0.11.2',
		fixes: ['Remove double border from MDX code blocks'],
	},
	{
		version: '0.11.1',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.11.0...v0.11.1',
		fixes: ['Resolve critical issues from codebase analysis'],
	},
	{
		version: '0.11.0',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.10.1...v0.11.0',
		features: [
			'Add SentryTransport for Sentry error monitoring integration',
			'Add error boundary stack trace filtering for production',
			'Add duplicate log suppression option to logger',
			'Add CircularBuffer iterator pattern for efficient memory usage',
			'Add Connection keep-alive to HTTP transport',
			'Add async logger initialization option',
			'Add Prometheus metrics export format',
		],
		docs: [
			'Add SentryTransport documentation and examples',
			'Add Pino migration guide',
			'Add performance tuning, memory management, and error recovery guides',
			'Add documentation validation to pre-push hooks',
		],
		fixes: [
			'Improve query logger table extraction patterns',
			'Wrap all HTTP transport errors in HTTPTransportError consistently',
		],
		tests: [
			'Add dev-overlay stress tests for 500+ logs',
			'Add W3C trace context malformed input tests',
			'Add sanitizer performance and sampling edge case tests',
		],
	},
	{
		version: '0.10.2',
		date: '2026-01-04',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.10.1...v0.10.2',
		features: [
			'Add RSS feed and dynamic blog infrastructure with centralized manifest',
			'Add useScrollPosition hook with RAF throttling for performance',
		],
		fixes: [
			'Improve hooks with proper cleanup and memory management',
			'Add CSP and HSTS security headers to next.config',
		],
		docs: ['Add metadata exports to all 21 documentation pages for improved SEO'],
		refactoring: [
			'Split log context into separate contexts for performance optimization',
			'Improve landing page and MDX components accessibility',
		],
	},
	{
		version: '0.10.1',
		date: '2026-01-03',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.10.0...v0.10.1',
		fixes: ['Improve docs links and navigation accessibility'],
	},
	{
		version: '0.10.0',
		date: '2026-01-03',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.9.1...v0.10.0',
		features: [
			'Add error boundary with proper error handling and loading states',
			'Add centralized constants for API limits and configuration',
		],
		fixes: ['Add Zod validation and Content-Type checks for API security'],
	},
	{
		version: '0.9.1',
		date: '2026-01-03',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.9.0...v0.9.1',
		fixes: ['Optimize font loading and improve accessibility'],
	},
	{
		version: '0.9.0',
		date: '2026-01-03',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.8.1...v0.9.0',
		features: ['Automate version display in web app from package.json'],
		fixes: [
			'Make FileTransport batching test deterministic',
			'Remove duplicate tests from release-it hooks',
			'Ensure sequential package builds for CI',
			'Resolve all Biome lint errors for CI pass',
		],
	},
	{
		version: '0.8.1',
		date: '2026-01-03',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.8.0...v0.8.1',
		features: [
			'Add changelog, 404, and core documentation pages',
			'Add new playground demos, API routes and documentation',
			'Improve API route logging with withVestig wrapper',
			'Add security headers and accessibility improvements',
		],
		fixes: [
			'Resolve race conditions and storage quota handling in client',
			'Prevent memory leaks and crashes in core logger',
			'Correct broken links and update sitemap',
		],
		refactoring: [
			'Improve log context with exponential backoff reconnection',
			'Replace useSyncExternalStore with useState+useEffect in @vestig/next',
		],
	},
	{
		version: '0.8.0',
		date: '2025-12-23',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.7.0...v0.8.0',
		features: [
			'Add database logging for Prisma and Drizzle (@vestig/next)',
			'Add Dev Overlay for real-time log viewing (@vestig/next)',
			'Add enhanced Error Boundary with breadcrumbs (@vestig/next)',
			'Add WebVitals and Route Metrics module (@vestig/next)',
			'Add comprehensive SEO infrastructure and blog section (web)',
		],
		fixes: ['Remove broken links to non-existent pages', 'Update landing page content for v0.7.0'],
		docs: ['Update documentation for v0.7.0 release', 'Add new documentation pages'],
		breaking: ['Remove @vestig/express package - Vestig now focuses exclusively on Next.js'],
	},
	{
		version: '0.7.0',
		date: '2025-12-22',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.6.0...v0.7.0',
		features: [
			'Add full Deno support with runtime detection and AsyncLocalStorage',
			'Add W3C Trace Context tracestate support (parseTracestate, createTracestate, get/set/delete utilities)',
			'Export VestigErrorBoundary component with breadcrumb trail for error context',
			'Add offline queue with localStorage persistence for client-side logs',
			'Add probability, rate-limit, namespace-based, and composite samplers',
		],
		docs: [
			'Update README with Sampling documentation section',
			'Clarify browser support requirements',
			'Mark Deno as fully supported runtime',
		],
		tests: [
			'Add 47 tests for W3C tracestate support',
			'Add 38 tests for DatadogTransport',
			'Add 41 tests for FileTransport',
			'Add 29 tests for VestigErrorBoundary component',
			'Add 15 tests for offline queue persistence',
			'Add React hooks tests for @vestig/next/client',
			'Total: 898 tests passing (1,706 assertions)',
		],
	},
	{
		version: '0.6.0',
		date: '2025-12-21',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.5.0...v0.6.0',
		features: ['Add span support to route handler and action contexts (@vestig/next)'],
	},
	{
		version: '0.5.0',
		date: '2025-12-21',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.4.0...v0.5.0',
		features: [
			'Add interactive playground pages for all features',
			'Add native tracing API with span(), startSpan(), and context propagation',
		],
		docs: ['Add v1.0.0 roadmap'],
		tests: ['Add comprehensive test suite with 205 tests (@vestig/next)'],
	},
	{
		version: '0.4.0',
		date: '2025-12-20',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.3.1...v0.4.0',
		features: ['Add @vestig/express middleware package'],
	},
	{
		version: '0.3.1',
		date: '2025-12-20',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.3.0...v0.3.1',
		fixes: ['Improve release workflow with robust npm publishing'],
	},
	{
		version: '0.3.0',
		date: '2025-12-20',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.2.1...v0.3.0',
		features: [
			'Add interactive playground with server, client, and API demos',
			'Add logging infrastructure with SSE streaming',
			'Add UI components for playground',
			'Add @vestig/next Next.js integration package',
		],
		fixes: [
			'Reorder release workflow to build before typecheck',
			'Prevent undefined values in correlation context',
		],
		refactoring: ['Migrate demo to @vestig/next integration'],
		tests: ['Add comprehensive transport tests'],
		cicd: ['Fix lint errors and update biome config', 'Reorder workflow to build before typecheck'],
	},
	{
		version: '0.2.1',
		date: '2025-12-19',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.2.0...v0.2.1',
		refactoring: ['Complete vestig rename across entire codebase'],
	},
	{
		version: '0.2.0',
		date: '2025-12-19',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.1.1...v0.2.0',
		features: ['Add multi-transport system, sanitization presets, and benchmarks'],
		refactoring: ['Rename package to vestig'],
	},
	{
		version: '0.1.1',
		date: '2025-12-18',
		githubCompare: 'https://github.com/Arakiss/vestig/compare/v0.1.0...v0.1.1',
		fixes: ['Disable autoGenerate and clean up changelog in release workflow'],
	},
	{
		version: '0.1.0',
		date: '2025-12-18',
		features: [
			'Core Logger: Full-featured structured logging with multiple log levels',
			'Runtime Agnostic: Works across Node.js, Bun, Deno, browsers, and edge',
			'PII Sanitization: Automatic detection and masking of sensitive data',
			'Context Propagation: AsyncLocalStorage-based context flow',
			'Correlation IDs: Automatic request tracing',
			'Child Loggers: Create scoped loggers with inherited context',
			'Console Transport: Beautiful, colorized output with emoji support',
			'Zero Dependencies: Lightweight with no runtime dependencies',
		],
		docs: ['Add demo documentation site with Next.js 16', 'Getting started guide', 'API reference'],
		breaking: ['Package renamed from logpulse to vestig'],
	},
]

const sectionConfig = {
	features: { emoji: '✨', title: 'Features', color: 'text-green-400' },
	fixes: { emoji: '🐛', title: 'Bug Fixes', color: 'text-yellow-400' },
	docs: { emoji: '📚', title: 'Documentation', color: 'text-blue-400' },
	tests: { emoji: '✅', title: 'Tests', color: 'text-cyan-400' },
	breaking: { emoji: '⚠️', title: 'Breaking Changes', color: 'text-red-400' },
	refactoring: { emoji: '♻️', title: 'Refactoring', color: 'text-purple-400' },
	cicd: { emoji: '🔧', title: 'CI/CD', color: 'text-gray-400' },
}

function ChangeSection({
	items,
	type,
}: { items: string[] | undefined; type: keyof typeof sectionConfig }) {
	if (!items || items.length === 0) return null
	const config = sectionConfig[type]

	return (
		<div className="mt-4">
			<h4 className={`text-sm font-medium ${config.color} mb-2`}>
				{config.emoji} {config.title}
			</h4>
			<ul className="space-y-1.5">
				{items.map((item) => (
					<li
						key={item}
						className="text-sm text-white/70 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-white/50"
					>
						{item}
					</li>
				))}
			</ul>
		</div>
	)
}

export default function ChangelogPage() {
	return (
		<div className="min-h-screen bg-background">
			<InnerNav section="Changelog" />

			<main id="main-content" className="pt-14">
				<div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
					{/* Back link */}
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors mb-8"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Home
					</Link>

					{/* Header */}
					<div className="mb-12">
						<h1 className="text-4xl font-bold tracking-tight text-white mb-4">Changelog</h1>
						<p className="text-lg text-white/70">
							All notable changes to Vestig. Following{' '}
							<a
								href="https://semver.org"
								target="_blank"
								rel="noopener noreferrer"
								className="text-orange-400 hover:text-orange-300 transition-colors"
							>
								Semantic Versioning
							</a>
							.
						</p>
					</div>

					{/* Changelog entries */}
					<div className="space-y-8">
						{changelog.map((entry, index) => (
							<article
								key={entry.version}
								className={`relative pl-8 pb-8 ${index !== changelog.length - 1 ? 'border-l border-white/[0.08]' : ''}`}
							>
								{/* Timeline dot */}
								<div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-orange-500 flex items-center justify-center">
									<div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
								</div>

								{/* Version header */}
								<div className="flex flex-wrap items-center gap-3 mb-4">
									<h2 className="text-xl font-bold text-white">v{entry.version}</h2>
									<span className="flex items-center gap-1.5 text-sm text-white/60">
										<Calendar className="h-3.5 w-3.5" />
										{new Date(entry.date).toLocaleDateString('en-US', {
											month: 'long',
											day: 'numeric',
											year: 'numeric',
										})}
									</span>
									{entry.githubCompare && (
										<a
											href={entry.githubCompare}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 text-sm text-white/60 hover:text-orange-400 transition-colors"
										>
											<GitCommit className="h-3.5 w-3.5" />
											Compare
											<OpenNewWindow className="h-3 w-3" />
										</a>
									)}
								</div>

								{/* Changes */}
								<div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
									<ChangeSection items={entry.breaking} type="breaking" />
									<ChangeSection items={entry.features} type="features" />
									<ChangeSection items={entry.fixes} type="fixes" />
									<ChangeSection items={entry.docs} type="docs" />
									<ChangeSection items={entry.tests} type="tests" />
									<ChangeSection items={entry.refactoring} type="refactoring" />
									<ChangeSection items={entry.cicd} type="cicd" />
								</div>
							</article>
						))}
					</div>

					{/* Footer */}
					<footer className="mt-16 pt-8 border-t border-white/[0.06]">
						<p className="text-sm text-white/50">
							© {new Date().getFullYear()} Vestig. Open source under MIT License.
						</p>
					</footer>
				</div>
			</main>
		</div>
	)
}
