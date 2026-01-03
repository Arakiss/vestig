import { GlassCard, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { getLogger, getRequestContext } from '@vestig/next'
import { Check, Code, Flash, Search, Settings, Xmark } from 'iconoir-react'
import type { Metadata } from 'next'
import { CAPABILITIES, IS_EDGE, IS_SERVER, RUNTIME } from 'vestig'

export const metadata: Metadata = {
	title: 'Edge Runtime',
	description:
		'Lightweight logging in Edge functions with automatic runtime detection and capability-aware features.',
}

export const runtime = 'edge'

export default async function EdgePage() {
	const log = await getLogger('edge-demo')
	const ctx = await getRequestContext()

	log.info('Edge Runtime demo page rendering', {
		route: '/playground/edge',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		isEdge: IS_EDGE,
		requestId: ctx.requestId,
	})

	log.debug('Runtime capabilities', {
		hasAsyncLocalStorage: CAPABILITIES.hasAsyncLocalStorage,
		hasProcess: CAPABILITIES.hasProcess,
		hasPerformance: CAPABILITIES.hasPerformance,
		hasConsole: CAPABILITIES.hasConsole,
		hasCrypto: CAPABILITIES.hasCrypto,
	})

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
							<Flash className="h-6 w-6 text-yellow-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Edge Runtime</h1>
							<p className="text-white/50 text-sm">
								Lightweight logging in Edge Functions and Middleware
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="px-2 py-1 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded">
							{RUNTIME}
						</span>
						<span className="px-2 py-1 text-xs bg-white/5 border border-white/10 text-white/50 rounded">
							Edge: {IS_EDGE ? 'true' : 'false'}
						</span>
					</div>
				</div>
			</div>

			{/* Runtime Detection */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Search className="h-5 w-5 text-yellow-400" />
					Runtime Detection
				</h2>
				<GlassCard variant="glow" padding="lg" className="border-yellow-500/20">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{RUNTIME}</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Runtime</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{IS_EDGE ? 'Yes' : 'No'}</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Is Edge</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-mono text-yellow-400 truncate">
								{ctx.requestId?.slice(0, 12)}...
							</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Request ID</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-mono text-orange-400 truncate">
								{ctx.traceId?.slice(0, 12)}...
							</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Trace ID</div>
						</div>
					</div>
				</GlassCard>
			</div>

			{/* Capabilities */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Settings className="h-5 w-5 text-yellow-400" />
					Runtime Capabilities
				</h2>
				<GlassCard variant="default" padding="lg">
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						{Object.entries(CAPABILITIES).map(([key, value]) => (
							<div
								key={key}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
									value
										? 'bg-emerald-500/10 border border-emerald-500/20'
										: 'bg-white/5 border border-white/10'
								}`}
							>
								{value ? (
									<Check className="h-4 w-4 text-emerald-400" />
								) : (
									<Xmark className="h-4 w-4 text-white/30" />
								)}
								<span className={value ? 'text-white' : 'text-white/40'}>
									{key.replace('has', '')}
								</span>
							</div>
						))}
					</div>
				</GlassCard>
			</div>

			{/* Code Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Code className="h-5 w-5 text-yellow-400" />
					Edge Middleware Example
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`// middleware.ts
import { createVestigMiddleware } from '@vestig/next/middleware'

export const middleware = createVestigMiddleware({
  skipPaths: ['/_next', '/favicon.ico', '/api/health'],
  requestIdHeader: 'x-request-id',
  requestLogLevel: 'debug',
  responseLogLevel: 'info',
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Edge Considerations */}
			<div className="mb-8">
				<GlassCard variant="default" padding="lg" className="border-amber-500/20">
					<h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
						⚠️ Edge Considerations
					</h3>
					<GlassGrid cols={2}>
						{[
							{ title: 'No File System', desc: 'FileTransport is not available in edge runtime' },
							{ title: 'Limited APIs', desc: 'Some Node.js APIs may be restricted' },
							{ title: 'Global Context', desc: 'Uses global context instead of AsyncLocalStorage' },
							{ title: 'Bundle Size', desc: 'Vestig automatically tree-shakes unused features' },
						].map((item) => (
							<div key={item.title} className="flex items-start gap-2">
								<span className="text-amber-400 mt-0.5">›</span>
								<div>
									<span className="text-sm text-white font-medium">{item.title}</span>
									<span className="text-sm text-white/40"> — {item.desc}</span>
								</div>
							</div>
						))}
					</GlassGrid>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-yellow-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{ title: 'Zero Config', desc: 'Works in Vercel Edge and Cloudflare Workers' },
						{ title: 'Auto Detection', desc: 'Vestig detects edge runtime and adapts' },
						{ title: 'Correlation IDs', desc: 'Request correlation across edge and origin' },
						{ title: 'Same API', desc: 'Use the same logging API as server and client' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-yellow-400 mt-0.5">›</span>
							<div>
								<span className="text-sm text-white font-medium">{feature.title}</span>
								<span className="text-sm text-white/40"> — {feature.desc}</span>
							</div>
						</div>
					))}
				</GlassGrid>
			</GlassCard>
		</Container>
	)
}
