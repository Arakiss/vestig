'use client'

import { Container, Section } from '@/components/layout'
import { BlueprintCard, BlueprintSection } from '@/components/ui/blueprint-grid'
import { LineTitle } from '@/components/ui/line-title'
import { PillCTA, PillCTAGroup } from '@/components/ui/pill-cta'
import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { Book, Check, Copy, Github } from 'iconoir-react'
import { useCallback, useRef, useState } from 'react'

/**
 * FinalCTA - Cloudflare Sandbox inspired final call-to-action
 *
 * Features:
 * - LineTitle with decorative lines
 * - Large pill CTAs
 * - Install command in pill style
 * - Blueprint background with connection nodes
 */

interface FinalCTAProps {
	headline?: string
	subheadline?: string
	installCommand?: string
	githubUrl?: string
	docsUrl?: string
}

export function FinalCTA({
	headline = 'Start Logging Smarter',
	subheadline = 'Zero config. Zero dependencies. Infinite possibilities.',
	installCommand = 'bun add vestig',
	githubUrl = 'https://github.com/Arakiss/vestig',
	docsUrl = '/docs',
}: FinalCTAProps) {
	const [copied, setCopied] = useState(false)
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(installCommand)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [installCommand])

	return (
		<Section className="py-24 md:py-32 relative overflow-hidden">
			<Container size="default" className="relative">
				<motion.div
					ref={ref}
					className="text-center max-w-3xl mx-auto"
					initial={{ opacity: 0, y: 30 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
					transition={{ duration: 0.6 }}
				>
					{/* Main Headline */}
					<LineTitle variant="arc" size="2xl" lines={5} accent className="mb-6">
						{headline}
					</LineTitle>

					{/* Subheadline */}
					<motion.p
						className="text-xl md:text-2xl text-muted-foreground mb-10"
						initial={{ opacity: 0, y: 10 }}
						animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{subheadline}
					</motion.p>

					{/* Install Command */}
					<motion.div
						className="mb-10"
						initial={{ opacity: 0, y: 10 }}
						animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						<button
							type="button"
							onClick={handleCopy}
							className={cn(
								'inline-flex items-center gap-4 px-8 py-4',
								'font-mono text-lg',
								'bg-surface border-2 border-brand/30 rounded-full',
								'hover:border-brand/60 hover:glow-brand transition-all duration-200',
								'group',
							)}
						>
							<span className="text-brand text-xl">$</span>
							<span className="text-foreground">{installCommand}</span>
							<span
								className={cn(
									'flex items-center gap-2 text-sm uppercase tracking-wider transition-colors',
									copied ? 'text-brand' : 'text-muted-foreground group-hover:text-brand',
								)}
							>
								{copied ? (
									<>
										<Check className="w-5 h-5" />
										<span>Copied!</span>
									</>
								) : (
									<>
										<Copy className="w-5 h-5" />
										<span>Copy</span>
									</>
								)}
							</span>
						</button>
					</motion.div>

					{/* CTAs */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
						transition={{ duration: 0.5, delay: 0.4 }}
					>
						<PillCTAGroup align="center" gap="lg">
							<PillCTA href={docsUrl} variant="primary" size="xl" arrow="right">
								<Book className="w-5 h-5 mr-2" />
								Read the Docs
							</PillCTA>
							<PillCTA href={githubUrl} variant="outline" size="xl" external>
								<Github className="w-5 h-5 mr-2" />
								Star on GitHub
							</PillCTA>
						</PillCTAGroup>
					</motion.div>

					{/* Stats badges */}
					<motion.div
						className="flex items-center justify-center gap-6 mt-12"
						initial={{ opacity: 0 }}
						animate={isInView ? { opacity: 1 } : { opacity: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
					>
						<StatBadge value="0" label="Dependencies" />
						<div className="w-px h-8 bg-brand/20" />
						<StatBadge value="<5KB" label="Gzipped" />
						<div className="w-px h-8 bg-brand/20" />
						<StatBadge value="100%" label="TypeScript" />
					</motion.div>
				</motion.div>
			</Container>
		</Section>
	)
}

/**
 * Stat Badge Component
 */
function StatBadge({ value, label }: { value: string; label: string }) {
	return (
		<div className="flex flex-col items-center">
			<span className="text-xl md:text-2xl font-bold font-display text-brand">{value}</span>
			<span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
		</div>
	)
}

export default FinalCTA
