import { DemoGrid, DemoLinkCard } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { IS_SERVER, RUNTIME } from 'vestig'

/**
 * Demo categories with their pages
 */
const demos = [
	{
		title: 'Server Components',
		description: 'Logging in React Server Components with automatic runtime detection.',
		icon: '🖥️',
		href: '/playground/server',
		tags: ['RSC', 'node/bun', 'structured'],
	},
	{
		title: 'Client Components',
		description: 'Browser-side logging with PII sanitization and graceful degradation.',
		icon: '💻',
		href: '/playground/client',
		tags: ['browser', 'sanitization', 'real-time'],
	},
	{
		title: 'API Routes',
		description: 'Full request lifecycle logging with correlation ID propagation.',
		icon: '🔌',
		href: '/playground/api-routes',
		tags: ['node/bun', 'correlation', 'context'],
	},
	{
		title: 'Edge Runtime',
		description: 'Lightweight logging in edge functions and middleware.',
		icon: '⚡',
		href: '/playground/edge',
		tags: ['edge', 'vercel', 'cloudflare'],
	},
	{
		title: 'Server Actions',
		description: 'Logging in server actions for form handling and mutations.',
		icon: '🎬',
		href: '/playground/actions',
		tags: ['RSC', 'forms', 'mutations'],
	},
	{
		title: 'PII Sanitization',
		description: 'Interactive demo of all sanitization presets side-by-side.',
		icon: '🔒',
		href: '/playground/sanitization',
		tags: ['GDPR', 'HIPAA', 'PCI-DSS'],
	},
	{
		title: 'Transports',
		description: 'Multi-transport configuration with HTTP, File, and Datadog.',
		icon: '📡',
		href: '/playground/transports',
		tags: ['HTTP', 'file', 'datadog'],
	},
]

export default function PlaygroundPage() {
	return (
		<div className="max-w-5xl mx-auto">
			{/* Hero section */}
			<div className="mb-12">
				<div className="flex items-center gap-3 mb-4">
					<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
				</div>
				<h1 className="text-4xl font-bold text-white mb-4">Vestig Playground</h1>
				<p className="text-lg text-gray-400 max-w-2xl">
					Explore vestig's capabilities across all Next.js execution contexts. Each demo shows
					logging in action with real-time log streaming below.
				</p>
			</div>

			{/* Quick stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
				<div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
					<div className="text-2xl font-bold text-white">5</div>
					<div className="text-sm text-gray-500">Runtimes</div>
				</div>
				<div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
					<div className="text-2xl font-bold text-white">6</div>
					<div className="text-sm text-gray-500">Presets</div>
				</div>
				<div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
					<div className="text-2xl font-bold text-white">4</div>
					<div className="text-sm text-gray-500">Transports</div>
				</div>
				<div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
					<div className="text-2xl font-bold text-white">0</div>
					<div className="text-sm text-gray-500">Dependencies</div>
				</div>
			</div>

			{/* Demo cards */}
			<div className="mb-8">
				<h2 className="text-xl font-semibold text-white mb-4">Demos</h2>
				<DemoGrid>
					{demos.map((demo) => (
						<DemoLinkCard
							key={demo.href}
							title={demo.title}
							description={demo.description}
							icon={demo.icon}
							href={demo.href}
							tags={demo.tags}
						/>
					))}
				</DemoGrid>
			</div>

			{/* Instructions */}
			<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-blue-400 mb-2">💡 Getting Started</h3>
				<p className="text-sm text-gray-400">
					Click on any demo to see vestig in action. Logs appear in real-time in the panel at the
					bottom of the page. Try expanding logs to see metadata and context.
				</p>
			</div>
		</div>
	)
}
