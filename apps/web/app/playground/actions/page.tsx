import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME } from 'vestig'
import { ActionDemo } from './action-demo'

/**
 * Server Actions Demo Page
 *
 * This page demonstrates logging in Next.js Server Actions.
 * Server Actions are functions that run on the server but can be called from client components.
 */
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
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">🎬</span>
					<h1 className="text-2xl font-bold text-white">Server Actions</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Logging in Next.js Server Actions with automatic correlation and timing.
				</p>
				<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
			</div>

			{/* Context info */}
			<DemoCard
				title="Request Context"
				description="Correlation IDs from the current request"
				icon="🔗"
			>
				<DemoResult>
					<div className="grid grid-cols-2 gap-4 text-sm">
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

			{/* Interactive demo */}
			<div className="mt-6">
				<DemoCard
					title="Interactive Demo"
					description="Try calling server actions and watch the logs"
					icon="🎯"
				>
					<ActionDemo />
				</DemoCard>
			</div>

			{/* Code example */}
			<div className="mt-6">
				<DemoCard
					title="Code Example"
					description="How to use vestigAction wrapper for server actions"
					icon="📝"
					code={`// app/actions/example.ts
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
)`}
				/>
			</div>

			{/* Key points */}
			<div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-green-400 mb-3">✅ Key Features Demonstrated</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">vestigAction Wrapper</strong> — Automatic logging setup
						for server actions
					</li>
					<li>
						• <strong className="text-white">Correlation Propagation</strong> — Request IDs flow
						from client to server action
					</li>
					<li>
						• <strong className="text-white">Timing Metrics</strong> — Automatic duration tracking
					</li>
					<li>
						• <strong className="text-white">Error Handling</strong> — Errors are logged
						automatically with context
					</li>
					<li>
						• <strong className="text-white">Input/Output Logging</strong> — Optional logging of
						action inputs and outputs
					</li>
				</ul>
			</div>
		</div>
	)
}
