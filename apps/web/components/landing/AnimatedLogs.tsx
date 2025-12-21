'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface LogEntry {
	id: number
	level: 'info' | 'warn' | 'error' | 'debug'
	message: string
	timestamp: string
	meta?: Record<string, string>
}

const sampleLogs: Omit<LogEntry, 'id' | 'timestamp'>[] = [
	{ level: 'info', message: 'Server started', meta: { port: '3000', env: 'production' } },
	{ level: 'info', message: 'Database connected', meta: { host: 'db.example.com' } },
	{
		level: 'info',
		message: 'User authenticated',
		meta: { userId: 'usr_***', email: 'u**@example.com' },
	},
	{ level: 'debug', message: 'Cache hit', meta: { key: 'session:abc123' } },
	{
		level: 'info',
		message: 'Request processed',
		meta: { method: 'POST', path: '/api/users', duration: '45ms' },
	},
	{ level: 'warn', message: 'Rate limit approaching', meta: { remaining: '10', limit: '100' } },
	{ level: 'info', message: 'Payment processed', meta: { amount: '$**.**', card: '****4242' } },
	{ level: 'error', message: 'External API timeout', meta: { service: 'stripe', retry: '1/3' } },
	{ level: 'info', message: 'Retry successful', meta: { service: 'stripe', attempt: '2' } },
	{ level: 'info', message: 'Order completed', meta: { orderId: 'ord_***', total: '$**.**' } },
	{ level: 'debug', message: 'Cleanup job started', meta: { type: 'sessions' } },
	{
		level: 'info',
		message: 'Webhook received',
		meta: { event: 'invoice.paid', provider: 'stripe' },
	},
]

const levelColors = {
	info: 'text-white',
	warn: 'text-amber-400',
	error: 'text-red-400',
	debug: 'text-white/40',
}

const levelBadgeColors = {
	info: 'bg-white/10 text-white/70',
	warn: 'bg-amber-500/10 text-amber-400',
	error: 'bg-red-500/10 text-red-400',
	debug: 'bg-white/5 text-white/40',
}

function formatTime(): string {
	const now = new Date()
	return now.toISOString().split('T')[1].slice(0, 12)
}

export function AnimatedLogs({ className }: { className?: string }) {
	const [logs, setLogs] = useState<LogEntry[]>([])
	const counterRef = useRef(0)
	const indexRef = useRef(3)

	useEffect(() => {
		// Add initial logs
		const initialLogs = sampleLogs.slice(0, 3).map((log) => ({
			...log,
			id: counterRef.current++,
			timestamp: formatTime(),
		}))
		setLogs(initialLogs)

		// Add new logs periodically
		const interval = setInterval(() => {
			const nextIndex = indexRef.current % sampleLogs.length
			const newLog: LogEntry = {
				...sampleLogs[nextIndex],
				id: counterRef.current++,
				timestamp: formatTime(),
			}

			setLogs((prevLogs) => {
				const updated = [...prevLogs, newLog]
				// Keep only last 6 logs
				return updated.slice(-6)
			})

			indexRef.current++
		}, 2000)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className={cn('font-mono text-sm', className)}>
			{/* Terminal header */}
			<div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
				<div className="flex gap-1.5">
					<div className="w-2.5 h-2.5 rounded-full bg-white/20" />
					<div className="w-2.5 h-2.5 rounded-full bg-white/20" />
					<div className="w-2.5 h-2.5 rounded-full bg-white/20" />
				</div>
				<span className="text-xs text-white/40 ml-2">vestig — live logs</span>
				<div className="ml-auto flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
					<span className="text-xs text-white/40">streaming</span>
				</div>
			</div>

			{/* Log entries */}
			<div className="p-4 space-y-2 min-h-[240px]">
				{logs.map((log, index) => (
					<div
						key={log.id}
						className={cn(
							'flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
							index === logs.length - 1 && 'opacity-100',
							index === logs.length - 2 && 'opacity-80',
							index < logs.length - 2 && 'opacity-50',
						)}
					>
						{/* Timestamp */}
						<span className="text-white/30 shrink-0">{log.timestamp}</span>

						{/* Level badge */}
						<span
							className={cn(
								'px-1.5 py-0.5 text-xs uppercase shrink-0',
								levelBadgeColors[log.level],
							)}
						>
							{log.level}
						</span>

						{/* Message */}
						<span className={cn('shrink-0', levelColors[log.level])}>{log.message}</span>

						{/* Meta */}
						{log.meta && (
							<span className="text-white/30 truncate">
								{Object.entries(log.meta)
									.map(([k, v]) => `${k}=${v}`)
									.join(' ')}
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
