'use client'

import Link from 'next/link'
import { ArrowRight, Copy, Check } from 'iconoir-react'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { HeroContent } from '@/lib/content/types'
import { Container } from '@/components/layout'
import { AnimatedLogs } from './AnimatedLogs'
import { LineTitle } from '@/components/ui/line-title'
import { PillCTA, PillCTAGroup } from '@/components/ui/pill-cta'

/**
 * Hero - Cloudflare Sandbox inspired epic hero section
 *
 * Features:
 * - LineTitle with animated arcs
 * - Blueprint grid background
 * - Animated terminal
 * - Stats with brand accents
 * - Pill CTAs
 */

interface HeroProps {
	content: HeroContent
}

export function Hero({ content }: HeroProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(content.installCommand)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [content.installCommand])

	return (
		<section className="relative pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden blueprint-grid-sparse">
			{/* Corner markers */}
			<div className="absolute top-8 left-8 w-8 h-8 border-l border-t border-brand/20 hidden lg:block" />
			<div className="absolute top-8 right-8 w-8 h-8 border-r border-t border-brand/20 hidden lg:block" />
			<div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-brand/20 hidden lg:block" />
			<div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-brand/20 hidden lg:block" />

			<Container size="wide" className="relative">
				{/* Main Content - Centered */}
				<div className="text-center max-w-4xl mx-auto mb-12">
					{/* Badge */}
					{content.badge && (
						<motion.div
							className="mb-8"
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							<Link href={content.badge.href || '#'}>
								<span className="inline-flex items-center gap-2 px-4 py-2 text-sm badge-brand hover:bg-brand/20 transition-colors">
									{content.badge.text}
									<ArrowRight className="w-3 h-3" />
								</span>
							</Link>
						</motion.div>
					)}

					{/* Massive Title with Line Effect */}
					<div className="mb-6">
						<LineTitle variant="arc" size="2xl" lines={5} accent className="mb-2">
							{content.headline.primary}
						</LineTitle>
						<motion.p
							className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white/40"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
						>
							{content.headline.secondary}
						</motion.p>
					</div>

					{/* Subheadline */}
					<motion.p
						className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
					>
						{content.subheadline}
					</motion.p>

					{/* CTAs */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.6 }}
					>
						<PillCTAGroup align="center" gap="md" className="mb-6">
							<PillCTA href={content.ctas.primary.href} variant="primary" size="lg" arrow="right">
								{content.ctas.primary.text}
							</PillCTA>
							{content.ctas.secondary && (
								<PillCTA href={content.ctas.secondary.href} variant="outline" size="lg">
									{content.ctas.secondary.text}
								</PillCTA>
							)}
						</PillCTAGroup>
					</motion.div>

					{/* Install Command */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.7 }}
					>
						<button
							onClick={handleCopy}
							className="inline-flex items-center gap-3 px-6 py-3 font-mono text-sm bg-surface border border-brand/20 rounded-full hover:border-brand/40 transition-all duration-200 group"
						>
							<span className="text-brand">$</span>
							<span className="text-foreground">{content.installCommand}</span>
							<span className="text-muted-foreground group-hover:text-brand transition-colors">
								{copied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
							</span>
						</button>
					</motion.div>
				</div>

				{/* Terminal + Stats */}
				<div className="grid lg:grid-cols-12 gap-8 items-end">
					{/* Terminal - Takes 8 columns */}
					<motion.div
						className="lg:col-span-8"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.8 }}
					>
						<div className="relative">
							{/* Connection line from terminal */}
							<div className="absolute -left-4 top-1/2 w-4 h-px bg-gradient-to-r from-brand/0 to-brand/50 hidden lg:block" />

							{/* Terminal Card - Modern Glass Style */}
							<div className="relative rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
								<AnimatedLogs />
							</div>
						</div>
					</motion.div>

					{/* Stats - Takes 4 columns */}
					<motion.div
						className="lg:col-span-4"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 1 }}
					>
						<div className="grid grid-cols-3 lg:grid-cols-1 gap-6">
							<StatCard value="0" label="Dependencies" accent />
							<StatCard value="<5KB" label="Gzipped" />
							<StatCard value="TS" label="Native" accent />
						</div>
					</motion.div>
				</div>
			</Container>
		</section>
	)
}

/**
 * Stat Card Component - Modern Glass Style
 */
interface StatCardProps {
	value: string
	label: string
	accent?: boolean
}

function StatCard({ value, label, accent = false }: StatCardProps) {
	return (
		<div className="relative p-5 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] text-center lg:text-left transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]">
			<div
				className={`text-2xl lg:text-3xl font-bold font-display ${accent ? 'text-white' : 'text-white/80'}`}
			>
				{value}
			</div>
			<div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{label}</div>
		</div>
	)
}

export default Hero
