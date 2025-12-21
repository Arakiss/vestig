import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME, CAPABILITIES, IS_EDGE } from 'vestig'

// Force edge runtime for this page
export const runtime = 'edge'

/**
 * Edge Runtime Demo Page
 *
 * Demonstrates logging in Edge Runtime (Vercel Edge, Cloudflare Workers).
 */
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

	// Log capabilities available in this runtime
	log.debug('Runtime capabilities', {
		hasAsyncLocalStorage: CAPABILITIES.hasAsyncLocalStorage,
		hasProcess: CAPABILITIES.hasProcess,
		hasPerformance: CAPABILITIES.hasPerformance,
		hasConsole: CAPABILITIES.hasConsole,
		hasCrypto: CAPABILITIES.hasCrypto,
	})

	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">⚡</span>
					<h1 className="text-2xl font-bold text-white">Edge Runtime</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Lightweight logging in Edge Functions and Middleware. Vestig automatically adapts to the
					edge environment with reduced bundle size.
				</p>
				<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
			</div>

			{/* Runtime detection */}
			<DemoCard
				title="Runtime Detection"
				description="Vestig automatically detects the edge environment"
				icon="🔍"
			>
				<DemoResult>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-gray-500">Runtime:</span>{' '}
							<span className="text-green-400 font-mono">{RUNTIME}</span>
						</div>
						<div>
							<span className="text-gray-500">Is Edge:</span>{' '}
							<span className={`font-mono ${IS_EDGE ? 'text-green-400' : 'text-gray-400'}`}>
								{IS_EDGE ? 'true' : 'false'}
							</span>
						</div>
						<div>
							<span className="text-gray-500">Request ID:</span>{' '}
							<span className="text-cyan-400 font-mono text-xs">{ctx.requestId}</span>
						</div>
						<div>
							<span className="text-gray-500">Trace ID:</span>{' '}
							<span className="text-cyan-400 font-mono text-xs">{ctx.traceId}</span>
						</div>
					</div>
				</DemoResult>
			</DemoCard>

			{/* Capabilities */}
			<div className="mt-6">
				<DemoCard
					title="Runtime Capabilities"
					description="APIs available in the current edge environment"
					icon="🧰"
				>
					<DemoResult>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
							{Object.entries(CAPABILITIES).map(([key, value]) => (
								<div
									key={key}
									className={`flex items-center gap-2 px-3 py-2 rounded ${
										value ? 'bg-green-500/10' : 'bg-gray-800/50'
									}`}
								>
									<span>{value ? '✅' : '❌'}</span>
									<span className={value ? 'text-green-400' : 'text-gray-500'}>
										{key.replace('has', '')}
									</span>
								</div>
							))}
						</div>
					</DemoResult>
				</DemoCard>
			</div>

			{/* Edge middleware example */}
			<div className="mt-6">
				<DemoCard
					title="Edge Middleware"
					description="How to use vestig in Next.js Edge Middleware"
					icon="🔀"
					code={`// middleware.ts
import { createVestigMiddleware } from '@vestig/next/middleware'

export const middleware = createVestigMiddleware({
  // Skip static assets and API routes
  skipPaths: ['/_next', '/favicon.ico', '/api/health'],

  // Custom request ID header
  requestIdHeader: 'x-request-id',

  // Log levels for requests/responses
  requestLogLevel: 'debug',
  responseLogLevel: 'info',
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}`}
				/>
			</div>

			{/* Edge function example */}
			<div className="mt-6">
				<DemoCard
					title="Edge API Route"
					description="Logging in Edge API routes with correlation"
					icon="🔌"
					code={`// app/api/edge-example/route.ts
import { withVestig } from '@vestig/next'

export const runtime = 'edge'

export const GET = withVestig(
  async (request, { log, ctx }) => {
    log.info('Edge API request received', {
      requestId: ctx.requestId,
      geo: request.geo, // Vercel Edge geo data
    })

    // Your edge logic here
    const data = await fetchFromEdgeCache()

    log.debug('Response ready', { cached: !!data })

    return Response.json(data)
  },
  { namespace: 'api:edge-example' }
)`}
				/>
			</div>

			{/* Edge considerations */}
			<div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-yellow-400 mb-3">⚠️ Edge Considerations</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">No File System</strong> — FileTransport is not
						available in edge runtime
					</li>
					<li>
						• <strong className="text-white">Limited APIs</strong> — Some Node.js APIs like
						process.env may be restricted
					</li>
					<li>
						• <strong className="text-white">Global Context</strong> — Uses global context manager
						instead of AsyncLocalStorage
					</li>
					<li>
						• <strong className="text-white">Bundle Size</strong> — Vestig automatically tree-shakes
						unused features
					</li>
				</ul>
			</div>

			{/* Key points */}
			<div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-green-400 mb-3">✅ Key Features</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">Zero Config</strong> — Works automatically in Vercel
						Edge and Cloudflare Workers
					</li>
					<li>
						• <strong className="text-white">Auto Detection</strong> — Vestig detects edge runtime
						and adapts accordingly
					</li>
					<li>
						• <strong className="text-white">Correlation IDs</strong> — Request correlation works
						across edge and origin
					</li>
					<li>
						• <strong className="text-white">Minimal Bundle</strong> — Tree-shakeable design keeps
						edge bundles small
					</li>
					<li>
						• <strong className="text-white">Same API</strong> — Use the same logging API as server
						and client
					</li>
				</ul>
			</div>
		</div>
	)
}
