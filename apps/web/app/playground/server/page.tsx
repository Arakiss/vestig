import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME } from 'vestig'

/**
 * Simulated async data fetching with logging
 */
async function fetchUser(id: number, log: Awaited<ReturnType<typeof getLogger>>) {
	log.debug('Fetching user', { userId: id })
	// Simulate network delay
	await new Promise((r) => setTimeout(r, 100))
	const user = {
		id,
		name: 'John Doe',
		email: 'john@example.com',
		role: 'admin',
	}
	log.info('User fetched successfully', { user })
	return user
}

async function fetchPosts(userId: number, log: Awaited<ReturnType<typeof getLogger>>) {
	log.debug('Fetching posts for user', { userId })
	await new Promise((r) => setTimeout(r, 80))
	const posts = [
		{ id: 1, title: 'Hello World' },
		{ id: 2, title: 'Second Post' },
	]
	log.info('Posts fetched', { count: posts.length })
	return posts
}

/**
 * Nested async component with context propagation
 */
async function UserProfile({ userId }: { userId: number }) {
	// Get a namespaced logger for this component (uses React cache, shares context with parent)
	const profileLog = await getLogger('server-demo:profile')

	profileLog.trace('UserProfile component rendering', { userId })

	const user = await fetchUser(userId, profileLog)
	const posts = await fetchPosts(userId, profileLog)

	profileLog.info('UserProfile complete', {
		userId: user.id,
		postCount: posts.length,
	})

	return (
		<div className="bg-gray-800/50 rounded-lg p-4 border border-white/10">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
					{user.name[0]}
				</div>
				<div>
					<div className="font-medium text-white">{user.name}</div>
					<div className="text-sm text-gray-400">{user.email}</div>
				</div>
			</div>
			<div className="text-sm text-gray-500">
				{posts.length} posts · {user.role}
			</div>
		</div>
	)
}

/**
 * Server Components Demo Page
 *
 * This page demonstrates logging in React Server Components.
 * All logs are generated on the server and streamed to the UI.
 */
export default async function ServerDemoPage() {
	// Get a logger for this page - automatically includes correlation context from middleware
	const log = await getLogger('server-demo')

	// Get the correlation context set by middleware (requestId, traceId, etc.)
	const ctx = await getRequestContext()

	// Log page render start
	log.info('Server Component page rendering', {
		route: '/playground/server',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		requestId: ctx.requestId,
	})

	// Simulate some async work
	await new Promise((r) => setTimeout(r, 50))

	log.trace('Initial render complete, fetching data')

	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">🖥️</span>
					<h1 className="text-2xl font-bold text-white">Server Components</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Logging in React Server Components with automatic runtime detection and context
					propagation.
				</p>
				<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
			</div>

			{/* Runtime info */}
			<DemoCard
				title="Runtime Detection"
				description="Vestig automatically detects the current runtime environment"
				icon="🔍"
			>
				<DemoResult>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-gray-500">Runtime:</span>{' '}
							<span className="text-green-400 font-mono">{RUNTIME}</span>
						</div>
						<div>
							<span className="text-gray-500">Environment:</span>{' '}
							<span className="text-green-400 font-mono">{IS_SERVER ? 'Server' : 'Client'}</span>
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

			{/* Nested component demo */}
			<div className="mt-6">
				<DemoCard
					title="Nested Components with Logging"
					description="Child components inherit context and create namespaced logs"
					icon="🌳"
				>
					<DemoResult title="User Profile Component">
						<UserProfile userId={1} />
					</DemoResult>
				</DemoCard>
			</div>

			{/* Code example */}
			<div className="mt-6">
				<DemoCard
					title="Code Example"
					description="How to use vestig in Server Components with @vestig/next"
					icon="📝"
					code={`import { getLogger, getRequestContext } from '@vestig/next'

export default async function MyServerComponent() {
  // Get logger with automatic request context from middleware
  const log = await getLogger('my-component')
  const ctx = await getRequestContext()

  log.info('Component rendering', {
    requestId: ctx.requestId
  })

  const data = await fetchData()
  log.debug('Data fetched', { count: data.length })

  return <div>...</div>
}`}
				/>
			</div>

			{/* Key points */}
			<div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-green-400 mb-3">✅ Key Features Demonstrated</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">Runtime Detection</strong> — Automatically detects
						Node.js/Bun environment
					</li>
					<li>
						• <strong className="text-white">Structured Logging</strong> — JSON output for
						server-side logs
					</li>
					<li>
						• <strong className="text-white">Child Loggers</strong> — Namespaced logging for
						components
					</li>
					<li>
						• <strong className="text-white">Context Propagation</strong> — Request IDs tracked
						across async operations
					</li>
					<li>
						• <strong className="text-white">Real-time Streaming</strong> — Logs appear in the panel
						below
					</li>
				</ul>
			</div>
		</div>
	)
}
