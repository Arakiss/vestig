'use client'

import { GlassButton, GlassCard, GlassCardBadge, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import {
	Bug,
	Filter,
	InfoCircle,
	KeyframePlus,
	Search,
	Timer,
	ViewGrid,
	WarningTriangle,
	Xmark,
} from 'iconoir-react'
import { useCallback, useRef, useState } from 'react'
import { createLogger } from 'vestig'

const log = createLogger({ namespace: 'playground:dev-overlay' })

/**
 * Keyboard shortcuts for the Dev Overlay
 */
const shortcuts = [
	{ keys: '⌘+L', description: 'Toggle overlay' },
	{ keys: 'Esc', description: 'Close overlay' },
	{ keys: '⌘+K', description: 'Clear logs' },
	{ keys: '/', description: 'Focus search' },
]

/**
 * Log level buttons for generating test logs
 */
const logLevels = [
	{ level: 'debug', label: 'Debug', color: 'text-gray-400', icon: <Bug className="h-4 w-4" /> },
	{
		level: 'info',
		label: 'Info',
		color: 'text-blue-400',
		icon: <InfoCircle className="h-4 w-4" />,
	},
	{
		level: 'warn',
		label: 'Warn',
		color: 'text-amber-400',
		icon: <WarningTriangle className="h-4 w-4" />,
	},
	{ level: 'error', label: 'Error', color: 'text-red-400', icon: <Xmark className="h-4 w-4" /> },
]

export function DevOverlayClient() {
	const [logCount, setLogCount] = useState(0)
	const logCountRef = useRef(0)

	const generateLog = useCallback((level: 'debug' | 'info' | 'warn' | 'error') => {
		const messages = {
			debug: [
				'Cache hit for user preferences',
				'Rendering component tree',
				'State update triggered',
				'useEffect cleanup running',
			],
			info: [
				'User session started',
				'Data fetched successfully',
				'Navigation to dashboard',
				'Form submission processed',
			],
			warn: [
				'Rate limit approaching threshold',
				'Deprecated API usage detected',
				'Missing optional configuration',
				'Session expires in 5 minutes',
			],
			error: [
				'Failed to fetch user data',
				'Database connection timeout',
				'Invalid authentication token',
				'Payment processing failed',
			],
		}

		const randomMessage = messages[level][Math.floor(Math.random() * messages[level].length)]
		// Use ref for current count to avoid stale closure
		const currentLogNumber = logCountRef.current + 1

		switch (level) {
			case 'debug':
				log.debug(randomMessage, { logNumber: currentLogNumber })
				break
			case 'info':
				log.info(randomMessage, { logNumber: currentLogNumber })
				break
			case 'warn':
				log.warn(randomMessage, { logNumber: currentLogNumber })
				break
			case 'error':
				log.error(randomMessage, { logNumber: currentLogNumber, stack: new Error().stack })
				break
		}

		// Update both ref and state
		logCountRef.current = currentLogNumber
		setLogCount(currentLogNumber)
	}, [])

	const generateBurst = useCallback(() => {
		const levels: ('debug' | 'info' | 'warn' | 'error')[] = ['debug', 'info', 'warn', 'error']
		for (let i = 0; i < 10; i++) {
			setTimeout(() => {
				const randomLevel = levels[Math.floor(Math.random() * levels.length)]
				generateLog(randomLevel)
			}, i * 100)
		}
	}, [generateLog])

	const generateStructuredLog = useCallback(() => {
		log.info('API request completed', {
			method: 'POST',
			path: '/api/users',
			statusCode: 201,
			duration: Math.floor(Math.random() * 500) + 50,
			userId: `usr_${Math.random().toString(36).slice(2, 10)}`,
			requestId: `req_${Math.random().toString(36).slice(2, 10)}`,
		})
		setLogCount((prev) => prev + 1)
	}, [])

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30">
							<ViewGrid className="h-6 w-6 text-indigo-400" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-bold text-white">Dev Overlay</h1>
								<GlassCardBadge variant="new">New</GlassCardBadge>
							</div>
							<p className="text-white/50 text-sm">
								Real-time log viewer with filtering and search
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Log Generator Section */}
			<div className="mb-12">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Timer className="h-5 w-5 text-indigo-400" />
					Generate Logs
				</h2>

				<GlassCard variant="default" padding="lg">
					<div className="space-y-6">
						{/* Individual log level buttons */}
						<div>
							<p className="text-sm text-white/50 mb-3">Click to generate a log at each level:</p>
							<div className="flex flex-wrap gap-3">
								{logLevels.map(({ level, label, color, icon }) => (
									<button
										type="button"
										key={level}
										onClick={() => generateLog(level as 'debug' | 'info' | 'warn' | 'error')}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all ${color}`}
									>
										{icon}
										<span className="text-sm font-medium">{label}</span>
									</button>
								))}
							</div>
						</div>

						{/* Burst and structured log buttons */}
						<div className="flex flex-wrap gap-3">
							<GlassButton variant="secondary" onClick={generateBurst}>
								Generate Log Burst (10)
							</GlassButton>
							<GlassButton variant="secondary" onClick={generateStructuredLog}>
								Generate Structured Log
							</GlassButton>
						</div>

						{/* Log counter */}
						<div className="flex items-center gap-2 text-sm text-white/40">
							<span>Total logs generated this session:</span>
							<span className="text-indigo-400 font-medium">{logCount}</span>
						</div>
					</div>
				</GlassCard>
			</div>

			{/* Features Grid */}
			<div className="mb-12">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Filter className="h-5 w-5 text-indigo-400" />
					Overlay Features
				</h2>

				<GlassGrid cols={2}>
					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
								<Search className="h-5 w-5 text-indigo-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Fuzzy Search</h3>
								<p className="text-xs text-white/50">
									Search through log messages, namespaces, and metadata with instant results.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
								<Filter className="h-5 w-5 text-amber-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Level Filtering</h3>
								<p className="text-xs text-white/50">
									Filter logs by level (debug, info, warn, error) with toggle buttons.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
								<Timer className="h-5 w-5 text-emerald-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Real-time Streaming</h3>
								<p className="text-xs text-white/50">
									Server-sent events provide instant log updates without polling.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
								<Bug className="h-5 w-5 text-violet-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Structured Data</h3>
								<p className="text-xs text-white/50">
									Expand logs to view full metadata, context, and formatted JSON.
								</p>
							</div>
						</div>
					</GlassCard>
				</GlassGrid>
			</div>

			{/* Keyboard Shortcuts */}
			<div>
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<KeyframePlus className="h-5 w-5 text-indigo-400" />
					Keyboard Shortcuts
				</h2>

				<GlassCard variant="default" padding="lg">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{shortcuts.map(({ keys, description }) => (
							<div key={keys} className="text-center">
								<kbd className="inline-block px-3 py-1.5 text-sm font-mono bg-white/10 border border-white/20 rounded-lg text-white mb-2">
									{keys}
								</kbd>
								<p className="text-xs text-white/50">{description}</p>
							</div>
						))}
					</div>
				</GlassCard>
			</div>

			{/* Hint */}
			<div className="mt-8 text-center">
				<p className="text-sm text-white/40">
					Look for the Dev Overlay in the{' '}
					<span className="text-indigo-400">bottom-right corner</span> of your screen →
				</p>
			</div>
		</Container>
	)
}
