'use client'

import { Container } from '@/components/layout'
import {
	GlassCard,
	GlassCardBadge,
	GlassButton,
	GlassGrid,
	MetricValue,
} from '@/app/components/glass-card'
import { GraphUp, Refresh, Clock, Activity, Eye, MouseButtonLeft } from 'iconoir-react'
import { useWebVitalsData, useWebVitalsSummary } from '@vestig/next/metrics'
import { useState, useEffect } from 'react'

/**
 * Core Web Vitals thresholds
 */
const vitalsInfo = [
	{
		name: 'LCP',
		fullName: 'Largest Contentful Paint',
		description: 'Measures loading performance. LCP should occur within 2.5s of page load.',
		good: '≤ 2.5s',
		poor: '> 4.0s',
		unit: 'ms',
		icon: <Eye className="h-5 w-5" />,
	},
	{
		name: 'CLS',
		fullName: 'Cumulative Layout Shift',
		description: 'Measures visual stability. Pages should maintain a CLS of 0.1 or less.',
		good: '≤ 0.1',
		poor: '> 0.25',
		unit: '',
		icon: <Activity className="h-5 w-5" />,
	},
	{
		name: 'INP',
		fullName: 'Interaction to Next Paint',
		description: 'Measures responsiveness. INP should be 200ms or less.',
		good: '≤ 200ms',
		poor: '> 500ms',
		unit: 'ms',
		icon: <MouseButtonLeft className="h-5 w-5" />,
	},
	{
		name: 'TTFB',
		fullName: 'Time to First Byte',
		description: 'Measures server responsiveness. TTFB should be under 800ms.',
		good: '≤ 800ms',
		poor: '> 1800ms',
		unit: 'ms',
		icon: <Clock className="h-5 w-5" />,
	},
	{
		name: 'FCP',
		fullName: 'First Contentful Paint',
		description: 'Measures perceived load speed. FCP should occur within 1.8s.',
		good: '≤ 1.8s',
		poor: '> 3.0s',
		unit: 'ms',
		icon: <Eye className="h-5 w-5" />,
	},
]

/**
 * Color mapping for ratings
 */
const ratingColors = {
	good: 'text-emerald-400',
	'needs-improvement': 'text-amber-400',
	poor: 'text-red-400',
}

const ratingBgColors = {
	good: 'bg-emerald-500/10 border-emerald-500/20',
	'needs-improvement': 'bg-amber-500/10 border-amber-500/20',
	poor: 'bg-red-500/10 border-red-500/20',
}

export default function WebVitalsPage() {
	const vitals = useWebVitalsData()
	const summary = useWebVitalsSummary()
	const [refreshKey, setRefreshKey] = useState(0)

	// Trigger actions to generate INP metrics
	const [clickCount, setClickCount] = useState(0)

	const handleInteraction = () => {
		// Simulate some work to generate measurable INP
		const start = performance.now()
		while (performance.now() - start < 10) {
			// Busy wait to simulate processing
		}
		setClickCount((prev) => prev + 1)
	}

	const triggerLayoutShift = () => {
		// This would trigger a CLS measurement in real usage
		setRefreshKey((prev) => prev + 1)
	}

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
							<GraphUp className="h-6 w-6 text-emerald-400" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-bold text-white">Web Vitals</h1>
								<GlassCardBadge variant="new">New</GlassCardBadge>
							</div>
							<p className="text-white/50 text-sm">
								Core Web Vitals monitoring with real-time updates
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Live Metrics Dashboard */}
			<div className="mb-12">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-white">Live Metrics</h2>
					<button
						onClick={() => setRefreshKey((prev) => prev + 1)}
						className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
					>
						<Refresh className="h-4 w-4" />
						Refresh
					</button>
				</div>

				<GlassCard variant="glow" padding="lg" className="border-emerald-500/20">
					<div className="grid grid-cols-2 md:grid-cols-5 gap-6" key={refreshKey}>
						{vitalsInfo.map(({ name, unit }) => {
							const data = vitals[name as keyof typeof vitals]
							const value = data?.value ?? '—'
							const rating = data?.rating as 'good' | 'needs-improvement' | 'poor' | undefined

							return (
								<MetricValue
									key={name}
									value={typeof value === 'number' ? value.toFixed(name === 'CLS' ? 3 : 0) : value}
									label={name}
									rating={rating}
									unit={unit}
								/>
							)
						})}
					</div>
				</GlassCard>
			</div>

			{/* Interaction Section */}
			<div className="mb-12">
				<h2 className="text-lg font-semibold text-white mb-4">Generate Interactions</h2>
				<GlassCard variant="default" padding="lg">
					<div className="flex flex-wrap items-center gap-4">
						<GlassButton variant="primary" onClick={handleInteraction}>
							Click to Generate INP ({clickCount})
						</GlassButton>
						<GlassButton variant="secondary" onClick={triggerLayoutShift}>
							Trigger Layout Shift
						</GlassButton>
						<p className="text-sm text-white/40 flex-1">
							Interact with the page to generate real Web Vitals measurements.
						</p>
					</div>
				</GlassCard>
			</div>

			{/* Metrics Explanation */}
			<div>
				<h2 className="text-lg font-semibold text-white mb-4">Understanding Web Vitals</h2>
				<div className="space-y-4">
					{vitalsInfo.map(({ name, fullName, description, good, poor, icon }) => (
						<GlassCard key={name} variant="subtle" padding="md">
							<div className="flex items-start gap-4">
								<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10">
									<span className="text-white/60">{icon}</span>
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<h3 className="text-sm font-semibold text-white">{name}</h3>
										<span className="text-xs text-white/40">{fullName}</span>
									</div>
									<p className="text-xs text-white/50 mb-2">{description}</p>
									<div className="flex items-center gap-4 text-xs">
										<span className="text-emerald-400">Good: {good}</span>
										<span className="text-red-400">Poor: {poor}</span>
									</div>
								</div>
							</div>
						</GlassCard>
					))}
				</div>
			</div>

			{/* Hint */}
			<div className="mt-8 text-center">
				<p className="text-sm text-white/40">
					Switch to the <span className="text-emerald-400">Metrics tab</span> in the Dev Overlay to
					see detailed breakdowns →
				</p>
			</div>
		</Container>
	)
}
