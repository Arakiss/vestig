'use client'

import { GlassButton, GlassCard, GlassCardBadge, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import {
	Check,
	DatabaseScript,
	DatabaseStar,
	Lock,
	Play,
	Timer,
	Trash,
	WarningTriangle,
} from 'iconoir-react'
import { useCallback, useState } from 'react'
import { createLogger } from 'vestig'

const log = createLogger({ namespace: 'db' })

interface QueryLog {
	id: string
	query: string
	params?: unknown[]
	duration: number
	isSlow: boolean
	operation: string
	table?: string
	timestamp: Date
}

/**
 * Sample queries for simulation
 */
const sampleQueries = {
	fast: [
		{
			query: 'SELECT * FROM users WHERE id = $1',
			params: ['usr_abc123'],
			table: 'users',
			op: 'SELECT',
		},
		{
			query: 'INSERT INTO sessions (user_id, token) VALUES ($1, $2)',
			params: ['usr_abc123', 'tok_xyz'],
			table: 'sessions',
			op: 'INSERT',
		},
		{
			query: 'UPDATE users SET last_login = NOW() WHERE id = $1',
			params: ['usr_abc123'],
			table: 'users',
			op: 'UPDATE',
		},
		{
			query: 'DELETE FROM cache WHERE expires_at < NOW()',
			params: [],
			table: 'cache',
			op: 'DELETE',
		},
	],
	slow: [
		{
			query:
				'SELECT * FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE o.status = $1',
			params: ['pending'],
			table: 'orders',
			op: 'SELECT',
		},
		{
			query: 'SELECT COUNT(*) FROM analytics WHERE created_at > $1 GROUP BY user_id',
			params: ['2024-01-01'],
			table: 'analytics',
			op: 'SELECT',
		},
		{
			query:
				'UPDATE inventory SET quantity = quantity - $1 WHERE product_id IN (SELECT product_id FROM order_items WHERE order_id = $2)',
			params: [1, 'ord_123'],
			table: 'inventory',
			op: 'UPDATE',
		},
	],
}

/**
 * Truncate long queries for display
 */
function truncateQuery(query: string, maxLength = 80): string {
	if (query.length <= maxLength) return query
	return `${query.slice(0, maxLength)}...`
}

export function DatabaseClient() {
	const [queries, setQueries] = useState<QueryLog[]>([])
	const [orm, setOrm] = useState<'prisma' | 'drizzle'>('prisma')

	const runQuery = useCallback((type: 'fast' | 'slow') => {
		const queryList = sampleQueries[type]
		const sample = queryList[Math.floor(Math.random() * queryList.length)]

		// Simulate query duration
		const baseDuration = type === 'fast' ? Math.random() * 50 + 5 : Math.random() * 300 + 150
		const duration = Math.round(baseDuration)
		const isSlow = duration > 100

		const queryLog: QueryLog = {
			id: Math.random().toString(36).slice(2, 10),
			query: sample.query,
			params: sample.params,
			duration,
			isSlow,
			operation: sample.op,
			table: sample.table,
			timestamp: new Date(),
		}

		// Log to vestig
		if (isSlow) {
			log.warn(`Slow query detected (${duration}ms)`, {
				query: truncateQuery(sample.query),
				duration,
				table: sample.table,
				operation: sample.op,
			})
		} else {
			log.debug('Query executed', {
				query: truncateQuery(sample.query),
				duration,
				table: sample.table,
				operation: sample.op,
			})
		}

		setQueries((prev) => [queryLog, ...prev].slice(0, 50))
	}, [])

	const runBurst = useCallback(() => {
		for (let i = 0; i < 5; i++) {
			setTimeout(() => {
				runQuery(Math.random() > 0.3 ? 'fast' : 'slow')
			}, i * 200)
		}
	}, [runQuery])

	const clearQueries = useCallback(() => {
		setQueries([])
	}, [])

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-violet-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
							<DatabaseScript className="h-6 w-6 text-violet-400" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-bold text-white">Database Logging</h1>
								<GlassCardBadge variant="new">New</GlassCardBadge>
							</div>
							<p className="text-white/50 text-sm">
								Query logging for Prisma and Drizzle with slow query detection
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* ORM Toggle */}
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<h2 className="text-lg font-semibold text-white">Select ORM</h2>
					<div className="flex rounded-lg overflow-hidden border border-white/10">
						<button
							type="button"
							onClick={() => setOrm('prisma')}
							className={`px-4 py-2 text-sm font-medium transition-colors ${
								orm === 'prisma'
									? 'bg-violet-500/20 text-violet-400'
									: 'bg-white/5 text-white/50 hover:text-white'
							}`}
						>
							Prisma
						</button>
						<button
							type="button"
							onClick={() => setOrm('drizzle')}
							className={`px-4 py-2 text-sm font-medium transition-colors ${
								orm === 'drizzle'
									? 'bg-violet-500/20 text-violet-400'
									: 'bg-white/5 text-white/50 hover:text-white'
							}`}
						>
							Drizzle
						</button>
					</div>
				</div>

				<GlassCard variant="default" padding="lg">
					<div className="flex flex-wrap gap-3">
						<GlassButton
							variant="secondary"
							icon={<Play className="h-4 w-4" />}
							onClick={() => runQuery('fast')}
						>
							Run Fast Query
						</GlassButton>

						<GlassButton
							variant="secondary"
							icon={<Timer className="h-4 w-4" />}
							onClick={() => runQuery('slow')}
							className="border-amber-500/20 hover:border-amber-500/40"
						>
							Run Slow Query
						</GlassButton>

						<GlassButton
							variant="secondary"
							icon={<DatabaseStar className="h-4 w-4" />}
							onClick={runBurst}
						>
							Run Query Burst
						</GlassButton>

						<GlassButton
							variant="ghost"
							icon={<Trash className="h-4 w-4" />}
							onClick={clearQueries}
						>
							Clear
						</GlassButton>
					</div>

					<p className="text-xs text-white/40 mt-4">
						Simulated {orm === 'prisma' ? 'Prisma' : 'Drizzle'} queries. Slow queries ({'>'} 100ms)
						are flagged with warnings.
					</p>
				</GlassCard>
			</div>

			{/* Query Log */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<DatabaseScript className="h-5 w-5 text-violet-400" />
						Query Log
					</h2>
					<span className="text-xs text-white/40">{queries.length} queries</span>
				</div>

				<GlassCard variant="glow" padding="lg" className="border-violet-500/20">
					<div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
						{queries.length === 0 ? (
							<p className="text-sm text-white/40 text-center py-8">
								No queries yet. Click buttons above to simulate database queries.
							</p>
						) : (
							queries.map((query) => (
								<div
									key={query.id}
									className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
										query.isSlow ? 'bg-amber-500/5' : 'bg-white/5'
									}`}
								>
									<div
										className={`flex items-center justify-center w-7 h-7 rounded ${
											query.isSlow ? 'bg-amber-500/10' : 'bg-emerald-500/10'
										}`}
									>
										{query.isSlow ? (
											<WarningTriangle className="h-4 w-4 text-amber-400" />
										) : (
											<Check className="h-4 w-4 text-emerald-400" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs font-medium text-violet-400 uppercase">
												{query.operation}
											</span>
											{query.table && <span className="text-xs text-white/40">{query.table}</span>}
											<span
												className={`text-xs font-mono ${
													query.isSlow ? 'text-amber-400' : 'text-white/50'
												}`}
											>
												{query.duration}ms
											</span>
											{query.isSlow && (
												<span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">
													🐢 Slow
												</span>
											)}
										</div>
										<p className="text-xs text-white/60 font-mono truncate">
											{truncateQuery(query.query, 100)}
										</p>
										{query.params && query.params.length > 0 && (
											<p className="text-[10px] text-white/30 font-mono mt-1">
												params: [{query.params.map((p) => JSON.stringify(p)).join(', ')}]
											</p>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</GlassCard>
			</div>

			{/* Features */}
			<div>
				<h2 className="text-lg font-semibold text-white mb-4">Features</h2>
				<GlassGrid cols={2}>
					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
								<Timer className="h-5 w-5 text-violet-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Slow Query Detection</h3>
								<p className="text-xs text-white/50">
									Automatically flags queries exceeding the configurable threshold.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
								<Lock className="h-5 w-5 text-purple-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Parameter Sanitization</h3>
								<p className="text-xs text-white/50">
									Automatically redacts sensitive parameters like passwords and tokens.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
								<DatabaseStar className="h-5 w-5 text-indigo-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">ORM Support</h3>
								<p className="text-xs text-white/50">
									Works with Prisma, Drizzle, and any SQL database they support.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
								<Check className="h-5 w-5 text-emerald-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Request Correlation</h3>
								<p className="text-xs text-white/50">
									Queries include request ID and trace ID for full observability.
								</p>
							</div>
						</div>
					</GlassCard>
				</GlassGrid>
			</div>

			{/* Hint */}
			<div className="mt-8 text-center">
				<p className="text-sm text-white/40">
					Query logs also appear in the <span className="text-violet-400">Dev Overlay</span> with
					the <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">db</code> namespace →
				</p>
			</div>
		</Container>
	)
}
