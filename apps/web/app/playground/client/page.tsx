'use client'

import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { useCorrelationContext, useLogger } from '@vestig/next/client'
import { useEffect, useState } from 'react'
import { IS_SERVER, RUNTIME, type Runtime } from 'vestig'

/**
 * Client Components Demo Page
 *
 * This page demonstrates logging in React Client Components (browser).
 * All logs are generated in the browser and sent to the server for unified viewing.
 */
export default function ClientDemoPage() {
	// Get logger from VestigProvider - no useMemo needed, hook handles stability
	const log = useLogger('client-demo')

	// Get correlation context from middleware (passed via VestigProvider)
	const ctx = useCorrelationContext()

	// Runtime detection - use client-side state to avoid hydration mismatch
	// Server renders placeholder, client updates with actual values in useEffect
	const [runtimeInfo, setRuntimeInfo] = useState<{
		runtime: Runtime | 'unknown'
		isServer: boolean
	} | null>(null)

	// Form state for PII demo
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		creditCard: '',
		phone: '',
	})
	const [logCount, setLogCount] = useState(0)

	// Set runtime info on mount (client-side only to avoid hydration mismatch)
	useEffect(() => {
		setRuntimeInfo({ runtime: RUNTIME, isServer: IS_SERVER })
	}, [])

	// Log on mount - include correlation context for tracing
	useEffect(() => {
		log.info('Client component mounted', {
			runtime: RUNTIME,
			isServer: IS_SERVER,
			userAgent: `${navigator.userAgent.slice(0, 50)}...`,
			requestId: ctx.requestId,
		})

		return () => {
			log.debug('Client component unmounting')
		}
	}, [log, ctx.requestId])

	// Handler for form changes with logging
	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		log.trace('Form field updated', { field, valueLength: value.length })
	}

	// Handler for form submission demo
	const handleSubmit = () => {
		log.info('Form submitted with sensitive data', {
			email: formData.email,
			password: formData.password,
			creditCard: formData.creditCard,
			phone: formData.phone,
		})
		setLogCount((c) => c + 1)
	}

	// Demo: Log at different levels
	const logAtLevel = (level: 'trace' | 'debug' | 'info' | 'warn' | 'error') => {
		const metadata = {
			timestamp: new Date().toISOString(),
			random: Math.random(),
		}

		switch (level) {
			case 'trace':
				log.trace('This is a trace message', metadata)
				break
			case 'debug':
				log.debug('This is a debug message', metadata)
				break
			case 'info':
				log.info('This is an info message', metadata)
				break
			case 'warn':
				log.warn('This is a warning message', metadata)
				break
			case 'error':
				log.error('This is an error message', {
					...metadata,
					error: new Error('Demo error'),
				})
				break
		}
		setLogCount((c) => c + 1)
	}

	// Demo: Simulate user interaction
	const simulateUserFlow = async () => {
		log.info('Starting user flow simulation')

		log.debug('Step 1: User viewing page')
		await new Promise((r) => setTimeout(r, 200))

		log.debug('Step 2: User filling form')
		await new Promise((r) => setTimeout(r, 200))

		log.info('Step 3: User submitting form', {
			formFields: Object.keys(formData),
		})
		await new Promise((r) => setTimeout(r, 200))

		log.info('User flow completed successfully')
		setLogCount((c) => c + 4)
	}

	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">💻</span>
					<h1 className="text-2xl font-bold text-white">Client Components</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Browser-side logging with PII sanitization. Logs are sent to the server for unified
					viewing.
				</p>
				{runtimeInfo ? (
					<FullRuntimeBadge runtime={runtimeInfo.runtime} isServer={runtimeInfo.isServer} />
				) : (
					<span className="text-xs text-gray-500">Detecting runtime...</span>
				)}
			</div>

			{/* Log level buttons */}
			<DemoCard
				title="Log Levels"
				description="Click buttons to emit logs at different levels"
				icon="📊"
			>
				<div className="flex flex-wrap gap-2 mb-4">
					<button
						onClick={() => logAtLevel('trace')}
						className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded text-sm hover:bg-gray-500/30"
					>
						Trace
					</button>
					<button
						onClick={() => logAtLevel('debug')}
						className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
					>
						Debug
					</button>
					<button
						onClick={() => logAtLevel('info')}
						className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
					>
						Info
					</button>
					<button
						onClick={() => logAtLevel('warn')}
						className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded text-sm hover:bg-yellow-500/30"
					>
						Warn
					</button>
					<button
						onClick={() => logAtLevel('error')}
						className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
					>
						Error
					</button>
				</div>
				<div className="text-xs text-gray-500">
					Logs emitted: <span className="text-white font-mono">{logCount}</span>
				</div>
			</DemoCard>

			{/* PII Sanitization demo */}
			<div className="mt-6">
				<DemoCard
					title="PII Sanitization Demo"
					description="Enter sensitive data and watch it get automatically sanitized in the logs"
					icon="🔒"
				>
					<div className="space-y-3 mb-4">
						<div>
							<label className="block text-xs text-gray-500 mb-1">Email</label>
							<input
								type="email"
								value={formData.email}
								onChange={(e) => handleInputChange('email', e.target.value)}
								placeholder="user@example.com"
								className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-hidden focus:border-white/30"
							/>
						</div>
						<div>
							<label className="block text-xs text-gray-500 mb-1">Password</label>
							<input
								type="password"
								value={formData.password}
								onChange={(e) => handleInputChange('password', e.target.value)}
								placeholder="••••••••"
								className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-hidden focus:border-white/30"
							/>
						</div>
						<div>
							<label className="block text-xs text-gray-500 mb-1">Credit Card</label>
							<input
								type="text"
								value={formData.creditCard}
								onChange={(e) => handleInputChange('creditCard', e.target.value)}
								placeholder="4111 1111 1111 1111"
								className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-hidden focus:border-white/30"
							/>
						</div>
						<div>
							<label className="block text-xs text-gray-500 mb-1">Phone</label>
							<input
								type="tel"
								value={formData.phone}
								onChange={(e) => handleInputChange('phone', e.target.value)}
								placeholder="+1 (555) 123-4567"
								className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-hidden focus:border-white/30"
							/>
						</div>
					</div>
					<button
						onClick={handleSubmit}
						className="w-full py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-500 transition-colors"
					>
						Submit (Watch Logs Below)
					</button>
					<div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
						⚠️ Sensitive fields like email, password, and creditCard are automatically sanitized in
						the log output!
					</div>
				</DemoCard>
			</div>

			{/* User flow simulation */}
			<div className="mt-6">
				<DemoCard
					title="User Flow Simulation"
					description="Simulate a typical user interaction flow with multiple log entries"
					icon="🎬"
					actionLabel="Run Simulation"
					onAction={simulateUserFlow}
				/>
			</div>

			{/* Code example */}
			<div className="mt-6">
				<DemoCard
					title="Code Example"
					description="How to use vestig in Client Components with @vestig/next"
					icon="📝"
					code={`'use client'
import { useEffect } from 'react'
import { useLogger, useCorrelationContext } from '@vestig/next/client'

export default function MyClientComponent() {
  // Get logger from VestigProvider - stable reference, no useMemo needed!
  const log = useLogger('my-component')
  const ctx = useCorrelationContext()

  useEffect(() => {
    log.info('Component mounted', { requestId: ctx.requestId })
    return () => log.debug('Component unmounting')
  }, [log, ctx.requestId])

  const handleClick = () => {
    log.info('Button clicked', {
      email: 'user@example.com', // → auto-sanitized!
    })
  }

  return <button onClick={handleClick}>Click me</button>
}`}
				/>
			</div>

			{/* Key points */}
			<div className="mt-8 bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-purple-400 mb-3">✅ Key Features Demonstrated</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">Browser Detection</strong> — Runtime shows as 'browser'
					</li>
					<li>
						• <strong className="text-white">PII Sanitization</strong> — Email, password, credit
						cards are redacted
					</li>
					<li>
						• <strong className="text-white">Unified Logging</strong> — Client logs appear in the
						same panel as server logs
					</li>
					<li>
						• <strong className="text-white">Pretty Console</strong> — Colored output in browser
						devtools
					</li>
					<li>
						• <strong className="text-white">No AsyncLocalStorage</strong> — Graceful degradation in
						browser
					</li>
				</ul>
			</div>
		</div>
	)
}
