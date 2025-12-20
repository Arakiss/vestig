'use client'

import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { useState } from 'react'
import { IS_SERVER, RUNTIME } from 'vestig'

interface ApiResponse {
	status: number
	data: unknown
	requestId?: string
	traceId?: string
	duration?: number
}

/**
 * API Routes Demo Page
 *
 * This page demonstrates logging in Next.js API Routes.
 * Includes GET and POST examples with correlation IDs.
 */
export default function ApiRoutesDemoPage() {
	const [getResponse, setGetResponse] = useState<ApiResponse | null>(null)
	const [postResponse, setPostResponse] = useState<ApiResponse | null>(null)
	const [isLoading, setIsLoading] = useState({ get: false, post: false })

	// Make GET request to demo API
	const handleGetRequest = async () => {
		setIsLoading((prev) => ({ ...prev, get: true }))
		const start = performance.now()

		try {
			const res = await fetch('/api/demo')
			const data = await res.json()
			const duration = performance.now() - start

			setGetResponse({
				status: res.status,
				data,
				requestId: res.headers.get('X-Request-Id') || undefined,
				traceId: res.headers.get('X-Trace-Id') || undefined,
				duration,
			})
		} catch (error) {
			setGetResponse({
				status: 500,
				data: { error: String(error) },
				duration: performance.now() - start,
			})
		} finally {
			setIsLoading((prev) => ({ ...prev, get: false }))
		}
	}

	// Make POST request to demo API
	const handlePostRequest = async () => {
		setIsLoading((prev) => ({ ...prev, post: true }))
		const start = performance.now()

		try {
			const res = await fetch('/api/demo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test User',
					email: 'test@example.com',
					password: 'secret123',
					creditCard: '4111111111111111',
				}),
			})
			const data = await res.json()
			const duration = performance.now() - start

			setPostResponse({
				status: res.status,
				data,
				requestId: res.headers.get('X-Request-Id') || undefined,
				traceId: res.headers.get('X-Trace-Id') || undefined,
				duration,
			})
		} catch (error) {
			setPostResponse({
				status: 500,
				data: { error: String(error) },
				duration: performance.now() - start,
			})
		} finally {
			setIsLoading((prev) => ({ ...prev, post: false }))
		}
	}

	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">🔌</span>
					<h1 className="text-2xl font-bold text-white">API Routes</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Full request lifecycle logging with correlation ID propagation in Next.js API Routes.
				</p>
				<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
			</div>

			{/* GET Request Demo */}
			<DemoCard
				title="GET Request"
				description="Fetches mock user data with full request tracing"
				icon="📥"
				actionLabel={isLoading.get ? 'Loading...' : 'Send GET Request'}
				onAction={handleGetRequest}
				isLoading={isLoading.get}
			>
				{getResponse && (
					<DemoResult title="Response">
						<div className="space-y-2 text-sm">
							<div className="flex gap-2">
								<span className="text-gray-500">Status:</span>
								<span
									className={`font-mono ${
										getResponse.status === 200 ? 'text-green-400' : 'text-red-400'
									}`}
								>
									{getResponse.status}
								</span>
							</div>
							<div className="flex gap-2">
								<span className="text-gray-500">Duration:</span>
								<span className="font-mono text-yellow-400">
									{getResponse.duration?.toFixed(2)}ms
								</span>
							</div>
							{getResponse.requestId && (
								<div className="flex gap-2">
									<span className="text-gray-500">Request ID:</span>
									<span className="font-mono text-cyan-400 text-xs">{getResponse.requestId}</span>
								</div>
							)}
							{getResponse.traceId && (
								<div className="flex gap-2">
									<span className="text-gray-500">Trace ID:</span>
									<span className="font-mono text-cyan-400 text-xs">{getResponse.traceId}</span>
								</div>
							)}
							<div className="mt-3 p-3 bg-black/30 rounded overflow-auto">
								<pre className="text-xs text-gray-300">
									{JSON.stringify(getResponse.data, null, 2)}
								</pre>
							</div>
						</div>
					</DemoResult>
				)}
			</DemoCard>

			{/* POST Request Demo */}
			<div className="mt-6">
				<DemoCard
					title="POST Request with PII"
					description="Sends sensitive data to the API (watch how it's sanitized in logs)"
					icon="📤"
					actionLabel={isLoading.post ? 'Loading...' : 'Send POST Request'}
					onAction={handlePostRequest}
					isLoading={isLoading.post}
				>
					<div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
						⚠️ This request includes: email, password, and creditCard fields. Check the log panel to
						see them sanitized!
					</div>
					<div className="mb-4 p-3 bg-black/30 rounded">
						<div className="text-[10px] text-gray-500 uppercase mb-1">
							Request Body (sent to API)
						</div>
						<pre className="text-xs text-gray-400">
							{`{
  "name": "Test User",
  "email": "test@example.com",
  "password": "secret123",
  "creditCard": "4111111111111111"
}`}
						</pre>
					</div>
					{postResponse && (
						<DemoResult title="Response">
							<div className="space-y-2 text-sm">
								<div className="flex gap-2">
									<span className="text-gray-500">Status:</span>
									<span
										className={`font-mono ${
											postResponse.status === 201 ? 'text-green-400' : 'text-red-400'
										}`}
									>
										{postResponse.status}
									</span>
								</div>
								<div className="flex gap-2">
									<span className="text-gray-500">Duration:</span>
									<span className="font-mono text-yellow-400">
										{postResponse.duration?.toFixed(2)}ms
									</span>
								</div>
								{postResponse.requestId && (
									<div className="flex gap-2">
										<span className="text-gray-500">Request ID:</span>
										<span className="font-mono text-cyan-400 text-xs">
											{postResponse.requestId}
										</span>
									</div>
								)}
								<div className="mt-3 p-3 bg-black/30 rounded overflow-auto">
									<pre className="text-xs text-gray-300">
										{JSON.stringify(postResponse.data, null, 2)}
									</pre>
								</div>
							</div>
						</DemoResult>
					)}
				</DemoCard>
			</div>

			{/* Code example */}
			<div className="mt-6">
				<DemoCard
					title="Code Example"
					description="How to use vestig in API Routes"
					icon="📝"
					code={`import { serverLogger } from '@/lib/logger'
import { withContext, createCorrelationContext } from 'vestig'

const log = serverLogger.child('api:users')

export async function GET(request: Request) {
  const ctx = createCorrelationContext()

  return withContext(ctx, async () => {
    log.info('API request received', {
      method: 'GET',
      requestId: ctx.requestId,
    })

    const data = await fetchData()

    log.info('API response sent', {
      status: 200,
      itemCount: data.length,
    })

    return Response.json(data, {
      headers: {
        'X-Request-Id': ctx.requestId!,
      },
    })
  })
}`}
				/>
			</div>

			{/* Key points */}
			<div className="mt-8 bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-orange-400 mb-3">✅ Key Features Demonstrated</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">Request Lifecycle</strong> — Full tracing from request
						to response
					</li>
					<li>
						• <strong className="text-white">Correlation IDs</strong> — Request ID and Trace ID
						propagation
					</li>
					<li>
						• <strong className="text-white">Response Headers</strong> — IDs returned for
						client-side tracing
					</li>
					<li>
						• <strong className="text-white">Duration Tracking</strong> — Performance metrics logged
						automatically
					</li>
					<li>
						• <strong className="text-white">Error Handling</strong> — Errors logged with context
						preserved
					</li>
				</ul>
			</div>
		</div>
	)
}
