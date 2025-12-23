import { GlassCard, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { Play, Link as LinkIcon, Code } from 'iconoir-react'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME } from 'vestig'
import { ActionDemo } from './action-demo'

export default async function ActionsPage() {
	const log = await getLogger('actions-demo')
	const ctx = await getRequestContext()

	log.info('Server Actions demo page rendering', {
		route: '/playground/actions',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		requestId: ctx.requestId,
	})

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-rose-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30">
							<Play className="h-6 w-6 text-rose-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Server Actions</h1>
							<p className="text-white/50 text-sm">
								Logging in Next.js Server Actions with correlation
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Request Context */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<LinkIcon className="h-5 w-5 text-rose-400" />
					Request Context
				</h2>
				<GlassCard variant="glow" padding="lg" className="border-rose-500/20">
					<div className="grid grid-cols-2 gap-6">
						<div className="text-center">
							<div className="text-sm font-mono text-rose-400 truncate">{ctx.requestId}</div>
							<div className="text-xs text-white/40 uppercase tracking-wider mt-1">Request ID</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-mono text-pink-400 truncate">{ctx.traceId}</div>
							<div className="text-xs text-white/40 uppercase tracking-wider mt-1">Trace ID</div>
						</div>
					</div>
				</GlassCard>
			</div>

			{/* Interactive Demo */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Play className="h-5 w-5 text-rose-400" />
					Interactive Demo
				</h2>
				<GlassCard variant="default" padding="lg">
					<p className="text-sm text-white/50 mb-4">
						Try calling server actions and watch the logs in the Dev Overlay
					</p>
					<ActionDemo />
				</GlassCard>
			</div>

			{/* Code Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Code className="h-5 w-5 text-rose-400" />
					Code Example
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`// app/actions/example.ts
'use server'

import { vestigAction } from '@vestig/next'

export const submitForm = vestigAction(
  async (data: FormData, { log, ctx }) => {
    log.info('Processing form submission', {
      requestId: ctx.requestId,
    })

    const name = data.get('name')
    const email = data.get('email')

    log.debug('Validating input', { name, email })

    // Simulate processing
    await new Promise((r) => setTimeout(r, 500))

    log.info('Form submitted successfully')

    return { success: true, id: crypto.randomUUID() }
  },
  { namespace: 'actions:submitForm' }
)`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-rose-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{ title: 'vestigAction Wrapper', desc: 'Automatic logging setup for server actions' },
						{ title: 'Correlation Propagation', desc: 'Request IDs flow from client to action' },
						{ title: 'Timing Metrics', desc: 'Automatic duration tracking' },
						{ title: 'Error Handling', desc: 'Errors are logged with context' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-rose-400 mt-0.5">›</span>
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
