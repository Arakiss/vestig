'use client'

import {
	Book,
	Code,
	Rocket,
	Settings,
	Server,
	Laptop,
	Flash,
	MediaVideo,
	PlugTypeA,
	Lock,
	Antenna,
	GitFork,
	Timer,
	Shield,
	Terminal,
} from 'iconoir-react'
import { InnerNav, Sidebar, type SidebarSection } from '@/components/layout'

const navigation: SidebarSection[] = [
	{
		title: 'Getting Started',
		items: [
			{ title: 'Introduction', href: '/docs', icon: <Book className="h-4 w-4" /> },
			{
				title: 'Installation',
				href: '/docs/getting-started',
				icon: <Rocket className="h-4 w-4" />,
			},
		],
	},
	{
		title: 'Core Concepts',
		items: [
			{ title: 'Logging Basics', href: '/docs/core/logging' },
			{ title: 'Log Levels', href: '/docs/core/levels' },
			{ title: 'Structured Output', href: '/docs/core/structured' },
			{ title: 'Child Loggers', href: '/docs/core/child-loggers' },
		],
	},
	{
		title: 'Next.js Integration',
		items: [
			{ title: 'Overview', href: '/docs/nextjs', icon: <Server className="h-4 w-4" /> },
			{ title: 'Middleware', href: '/docs/nextjs/middleware' },
			{ title: 'Server Components', href: '/docs/nextjs/server-components' },
			{ title: 'Route Handlers', href: '/docs/nextjs/route-handlers' },
			{ title: 'Server Actions', href: '/docs/nextjs/server-actions' },
			{
				title: 'Client Components',
				href: '/docs/nextjs/client',
				icon: <Laptop className="h-4 w-4" />,
			},
		],
	},
	{
		title: 'Tracing',
		items: [
			{ title: 'Overview', href: '/docs/tracing', icon: <GitFork className="h-4 w-4" /> },
			{ title: 'Spans', href: '/docs/tracing/spans' },
			{ title: 'Context Propagation', href: '/docs/tracing/context' },
			{ title: 'W3C Trace Context', href: '/docs/tracing/w3c' },
		],
	},
	{
		title: 'Transports',
		items: [
			{ title: 'Overview', href: '/docs/transports', icon: <Antenna className="h-4 w-4" /> },
			{
				title: 'Console',
				href: '/docs/transports/console',
				icon: <Terminal className="h-4 w-4" />,
			},
			{ title: 'HTTP', href: '/docs/transports/http' },
			{ title: 'File', href: '/docs/transports/file' },
			{ title: 'Datadog', href: '/docs/transports/datadog' },
			{ title: 'Custom Transports', href: '/docs/transports/custom' },
		],
	},
	{
		title: 'Sampling',
		items: [
			{ title: 'Overview', href: '/docs/sampling', icon: <Timer className="h-4 w-4" /> },
			{ title: 'Probability Sampling', href: '/docs/sampling/probability' },
			{ title: 'Rate Limiting', href: '/docs/sampling/rate-limit' },
			{ title: 'Namespace Sampling', href: '/docs/sampling/namespace' },
		],
	},
	{
		title: 'Security',
		items: [
			{
				title: 'PII Sanitization',
				href: '/docs/security/sanitization',
				icon: <Lock className="h-4 w-4" />,
			},
			{ title: 'Presets (GDPR, HIPAA)', href: '/docs/security/presets' },
			{ title: 'Custom Patterns', href: '/docs/security/custom-patterns' },
		],
	},
	{
		title: 'API Reference',
		items: [
			{ title: 'vestig', href: '/docs/api', icon: <Code className="h-4 w-4" /> },
			{ title: '@vestig/next', href: '/docs/api/next' },
			{ title: '@vestig/express', href: '/docs/api/express', badge: 'Soon' },
		],
	},
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<InnerNav section="Documentation" />
			<Sidebar sections={navigation} />

			{/* Main content */}
			<main className="lg:pl-64 pt-14">
				<div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
					{/* Clean article wrapper - styling handled by mdx-components */}
					<article className="min-h-[calc(100vh-8rem)]">{children}</article>

					{/* Footer navigation placeholder */}
					<footer className="mt-16 pt-8 border-t border-white/[0.06]">
						<p className="text-sm text-white/30">
							© {new Date().getFullYear()} Vestig. Open source under MIT License.
						</p>
					</footer>
				</div>
			</main>
		</div>
	)
}
