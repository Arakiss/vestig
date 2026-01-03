'use client'

import { GlassButton, GlassCard, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { Code, Download, PlugTypeA, Upload } from 'iconoir-react'
import { useState } from 'react'

interface ApiResponse {
	status: number
	data: unknown
	requestId?: string
	traceId?: string
	duration?: number
}

export function ApiRoutesClient() {
	const [getResponse, setGetResponse] = useState<ApiResponse | null>(null)
	const [postResponse, setPostResponse] = useState<ApiResponse | null>(null)
	const [isLoading, setIsLoading] = useState({ get: false, post: false })

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
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
							<PlugTypeA className="h-6 w-6 text-purple-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">API Routes</h1>
							<p className="text-white/50 text-sm">
								Request lifecycle logging with correlation IDs
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* GET Request Demo */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Download className="h-5 w-5 text-purple-400" />
					GET Request
				</h2>
				<GlassCard variant="default" padding="lg">
					<p className="text-sm text-white/50 mb-4">
						Fetches mock user data with full request tracing
					</p>
					<GlassButton variant="secondary" onClick={handleGetRequest} loading={isLoading.get}>
						{isLoading.get ? 'Loading...' : 'Send GET Request'}
					</GlassButton>

					{getResponse && (
						<div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
							<div className="grid grid-cols-2 gap-4 text-sm mb-4">
								<div>
									<span className="text-white/40">Status:</span>{' '}
									<span className="text-white font-mono">{getResponse.status}</span>
								</div>
								<div>
									<span className="text-white/40">Duration:</span>{' '}
									<span className="text-white font-mono">{getResponse.duration?.toFixed(2)}ms</span>
								</div>
								{getResponse.requestId && (
									<div className="col-span-2">
										<span className="text-white/40">Request ID:</span>{' '}
										<span className="text-purple-400 font-mono text-xs">
											{getResponse.requestId}
										</span>
									</div>
								)}
							</div>
							<pre className="text-xs text-white/60 overflow-auto">
								{JSON.stringify(getResponse.data, null, 2)}
							</pre>
						</div>
					)}
				</GlassCard>
			</div>

			{/* POST Request Demo */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Upload className="h-5 w-5 text-purple-400" />
					POST Request with PII
				</h2>
				<GlassCard variant="glow" padding="lg" className="border-purple-500/20">
					<p className="text-sm text-white/50 mb-4">
						Sends sensitive data to the API (watch how it's sanitized in logs)
					</p>

					<div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-400/80">
						⚠️ This request includes: email, password, and creditCard fields
					</div>

					<div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
						<div className="text-[10px] text-white/40 uppercase mb-1">Request Body</div>
						<pre className="text-xs text-white/60">
							{`{
  "name": "Test User",
  "email": "test@example.com",
  "password": "secret123",
  "creditCard": "4111111111111111"
}`}
						</pre>
					</div>

					<GlassButton variant="primary" onClick={handlePostRequest} loading={isLoading.post}>
						{isLoading.post ? 'Loading...' : 'Send POST Request'}
					</GlassButton>

					{postResponse && (
						<div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
							<div className="grid grid-cols-2 gap-4 text-sm mb-4">
								<div>
									<span className="text-white/40">Status:</span>{' '}
									<span className="text-white font-mono">{postResponse.status}</span>
								</div>
								<div>
									<span className="text-white/40">Duration:</span>{' '}
									<span className="text-white font-mono">
										{postResponse.duration?.toFixed(2)}ms
									</span>
								</div>
							</div>
							<pre className="text-xs text-white/60 overflow-auto">
								{JSON.stringify(postResponse.data, null, 2)}
							</pre>
						</div>
					)}
				</GlassCard>
			</div>

			{/* Code Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Code className="h-5 w-5 text-purple-400" />
					Code Example
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`import { serverLogger } from '@/lib/logger'
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

    return Response.json(data, {
      headers: { 'X-Request-Id': ctx.requestId! },
    })
  })
}`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-purple-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{ title: 'Request Lifecycle', desc: 'Full tracing from request to response' },
						{ title: 'Correlation IDs', desc: 'Request ID and Trace ID propagation' },
						{ title: 'Response Headers', desc: 'IDs returned for client-side tracing' },
						{ title: 'Duration Tracking', desc: 'Performance metrics logged automatically' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-purple-400 mt-0.5">›</span>
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
