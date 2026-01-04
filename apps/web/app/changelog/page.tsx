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
