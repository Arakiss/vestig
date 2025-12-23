import { GlassCard, GlassCardBadge, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { Server, Search, GitFork, Code } from 'iconoir-react'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME } from 'vestig'

/**
 * Simulated async data fetching with logging
 */
async function fetchUser(id: number, log: Awaited<ReturnType<typeof getLogger>>) {
	log.debug('Fetching user', { userId: id })
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
	const profileLog = await getLogger('server-demo:profile')
	profileLog.trace('UserProfile component rendering', { userId })

	const user = await fetchUser(userId, profileLog)
	const posts = await fetchPosts(userId, profileLog)

	profileLog.info('UserProfile complete', {
		userId: user.id,
		postCount: posts.length,
	})

	return (
		<div className="bg-white/5 rounded-lg p-4 border border-white/10">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-indigo-400 font-medium">
					{user.name[0]}
				</div>
				<div>
					<div className="font-medium text-white">{user.name}</div>
					<div className="text-sm text-white/50">{user.email}</div>
				</div>
			</div>
			<div className="text-sm text-white/40">
				{posts.length} posts · {user.role}
			</div>
		</div>
	)
}

export default async function ServerDemoPage() {
	const log = await getLogger('server-demo')
	const ctx = await getRequestContext()

	log.info('Server Component page rendering', {
		route: '/playground/server',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		requestId: ctx.requestId,
	})

	await new Promise((r) => setTimeout(r, 50))
	log.trace('Initial render complete, fetching data')

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
							<Server className="h-6 w-6 text-blue-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Server Components</h1>
							<p className="text-white/50 text-sm">Logging in React Server Components</p>
						</div>
					</div>
				</div>
			</div>

			{/* Runtime Info */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Search className="h-5 w-5 text-blue-400" />
					Runtime Detection
				</h2>
				<GlassCard variant="glow" padding="lg" className="border-blue-500/20">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{RUNTIME}</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Runtime</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{IS_SERVER ? 'Server' : 'Client'}</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Environment</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-mono text-blue-400 truncate">
								{ctx.requestId?.slice(0, 12)}...
							</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Request ID</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-mono text-indigo-400 truncate">
								{ctx.traceId?.slice(0, 12)}...
							</div>
							<div className="text-xs text-white/40 uppercase tracking-wider">Trace ID</div>
						</div>
					</div>
				</GlassCard>
			</div>

			{/* User Profile Demo */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<GitFork className="h-5 w-5 text-blue-400" />
					Nested Components with Logging
				</h2>
				<GlassCard variant="default" padding="lg">
					<p className="text-sm text-white/50 mb-4">
						Child components inherit context and create namespaced logs
					</p>
					<UserProfile userId={1} />
				</GlassCard>
			</div>

			{/* Code Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Code className="h-5 w-5 text-blue-400" />
					Code Example
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`import { getLogger, getRequestContext } from '@vestig/next'

export default async function MyServerComponent() {
  const log = await getLogger('my-component')
  const ctx = await getRequestContext()

  log.info('Component rendering', {
    requestId: ctx.requestId
  })

  const data = await fetchData()
  log.debug('Data fetched', { count: data.length })

  return <div>...</div>
}`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-blue-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{ title: 'Runtime Detection', desc: 'Automatically detects Node.js/Bun environment' },
						{ title: 'Structured Logging', desc: 'JSON output for server-side logs' },
						{ title: 'Child Loggers', desc: 'Namespaced logging for components' },
						{ title: 'Context Propagation', desc: 'Request IDs tracked across async operations' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-blue-400 mt-0.5">›</span>
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
