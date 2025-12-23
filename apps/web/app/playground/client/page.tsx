'use client'

import { GlassCard, GlassButton, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Laptop, Lock, Code, Play, InfoCircle, Bug, WarningTriangle, Xmark } from 'iconoir-react'
import { useCorrelationContext, useLogger } from '@vestig/next/client'
import { useEffect, useState } from 'react'
import { IS_SERVER, RUNTIME, type Runtime } from 'vestig'

export default function ClientDemoPage() {
	const log = useLogger('client-demo')
	const ctx = useCorrelationContext()

	const [runtimeInfo, setRuntimeInfo] = useState<{
		runtime: Runtime | 'unknown'
		isServer: boolean
	} | null>(null)

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		creditCard: '',
		phone: '',
	})
	const [logCount, setLogCount] = useState(0)

	useEffect(() => {
		setRuntimeInfo({ runtime: RUNTIME, isServer: IS_SERVER })
	}, [])

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

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		log.trace('Form field updated', { field, valueLength: value.length })
	}

	const handleSubmit = () => {
		log.info('Form submitted with sensitive data', {
			email: formData.email,
			password: formData.password,
			creditCard: formData.creditCard,
			phone: formData.phone,
		})
		setLogCount((c) => c + 1)
	}

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
				log.error('This is an error message', { ...metadata, error: new Error('Demo error') })
				break
		}
		setLogCount((c) => c + 1)
	}

	const simulateUserFlow = async () => {
		log.info('Starting user flow simulation')
		log.debug('Step 1: User viewing page')
		await new Promise((r) => setTimeout(r, 200))
		log.debug('Step 2: User filling form')
		await new Promise((r) => setTimeout(r, 200))
		log.info('Step 3: User submitting form', { formFields: Object.keys(formData) })
		await new Promise((r) => setTimeout(r, 200))
		log.info('User flow completed successfully')
		setLogCount((c) => c + 4)
	}

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
							<Laptop className="h-6 w-6 text-cyan-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Client Components</h1>
							<p className="text-white/50 text-sm">Browser-side logging with PII sanitization</p>
						</div>
					</div>
					{runtimeInfo && (
						<div className="flex items-center gap-2">
							<span className="px-2 py-1 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded">
								{runtimeInfo.runtime}
							</span>
							<span className="px-2 py-1 text-xs bg-white/5 border border-white/10 text-white/50 rounded">
								{runtimeInfo.isServer ? 'Server' : 'Client'}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Log Level Buttons */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4">Log Levels</h2>
				<GlassCard variant="default" padding="lg">
					<p className="text-sm text-white/50 mb-4">
						Click buttons to emit logs at different levels
					</p>
					<div className="flex flex-wrap gap-3 mb-4">
						<button
							onClick={() => logAtLevel('trace')}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 transition-all"
						>
							<Bug className="h-4 w-4" /> Trace
						</button>
						<button
							onClick={() => logAtLevel('debug')}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 transition-all"
						>
							<Bug className="h-4 w-4" /> Debug
						</button>
						<button
							onClick={() => logAtLevel('info')}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-blue-400 transition-all"
						>
							<InfoCircle className="h-4 w-4" /> Info
						</button>
						<button
							onClick={() => logAtLevel('warn')}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-amber-400 transition-all"
						>
							<WarningTriangle className="h-4 w-4" /> Warn
						</button>
						<button
							onClick={() => logAtLevel('error')}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-red-400 transition-all"
						>
							<Xmark className="h-4 w-4" /> Error
						</button>
					</div>
					<div className="text-xs text-white/40">
						Logs emitted: <span className="text-cyan-400 font-mono">{logCount}</span>
					</div>
				</GlassCard>
			</div>

			{/* PII Sanitization Demo */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Lock className="h-5 w-5 text-cyan-400" />
					PII Sanitization Demo
				</h2>
				<GlassCard variant="glow" padding="lg" className="border-cyan-500/20">
					<p className="text-sm text-white/50 mb-4">
						Enter sensitive data and watch it get automatically sanitized in the logs
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div className="space-y-2">
							<Label htmlFor="email" className="text-white/70">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => handleInputChange('email', e.target.value)}
								placeholder="user@example.com"
								className="bg-white/5 border-white/10"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password" className="text-white/70">
								Password
							</Label>
							<Input
								id="password"
								type="password"
								value={formData.password}
								onChange={(e) => handleInputChange('password', e.target.value)}
								placeholder="••••••••"
								className="bg-white/5 border-white/10"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="creditCard" className="text-white/70">
								Credit Card
							</Label>
							<Input
								id="creditCard"
								type="text"
								value={formData.creditCard}
								onChange={(e) => handleInputChange('creditCard', e.target.value)}
								placeholder="4111 1111 1111 1111"
								className="bg-white/5 border-white/10"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone" className="text-white/70">
								Phone
							</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) => handleInputChange('phone', e.target.value)}
								placeholder="+1 (555) 123-4567"
								className="bg-white/5 border-white/10"
							/>
						</div>
					</div>
					<GlassButton variant="primary" onClick={handleSubmit} className="w-full">
						Submit (Watch Dev Overlay)
					</GlassButton>
					<div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-400/80">
						⚠️ Sensitive fields are automatically sanitized in the log output
					</div>
				</GlassCard>
			</div>

			{/* User Flow Simulation */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Play className="h-5 w-5 text-cyan-400" />
					User Flow Simulation
				</h2>
				<GlassCard variant="default" padding="lg">
					<p className="text-sm text-white/50 mb-4">
						Simulate a typical user interaction flow with multiple log entries
					</p>
					<GlassButton variant="secondary" onClick={simulateUserFlow}>
						Run Simulation
					</GlassButton>
				</GlassCard>
			</div>

			{/* Code Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Code className="h-5 w-5 text-cyan-400" />
					Code Example
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`'use client'
import { useEffect } from 'react'
import { useLogger, useCorrelationContext } from '@vestig/next/client'

export default function MyClientComponent() {
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
}`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-cyan-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{ title: 'Browser Detection', desc: "Runtime shows as 'browser'" },
						{ title: 'PII Sanitization', desc: 'Email, password, credit cards are redacted' },
						{ title: 'Unified Logging', desc: 'Client logs appear with server logs' },
						{ title: 'Pretty Console', desc: 'Colored output in browser devtools' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-cyan-400 mt-0.5">›</span>
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
