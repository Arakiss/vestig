'use client'

import { BlueprintCard } from '@/components/ui/blueprint-grid'
import { CodeBlock } from '@/components/ui/code-block'
import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'iconoir-react'
import Link from 'next/link'
import { useRef } from 'react'
import { FlowDiagram, type FlowNode } from './FlowDiagram'

/**
 * InteractiveFeatureCard - 2-column feature card with visualization
 *
 * Cloudflare Sandbox inspired feature cards with:
 * - Text description on one side
 * - Interactive visualization on the other
 * - Blueprint card styling
 */

export type VisualizationType = 'flow' | 'code' | 'terminal' | 'icons' | 'custom'

interface InteractiveFeatureCardProps {
	/** Feature title */
	title: string
	/** Feature description */
	description: string
	/** Type of visualization */
	visualization: VisualizationType
	/** Props for the visualization */
	visualizationProps?: {
		code?: string
		language?: 'typescript' | 'javascript' | 'bash'
		flowNodes?: FlowNode[]
		icons?: React.ReactNode
		custom?: React.ReactNode
	}
	/** Swap text and visualization positions */
	reversed?: boolean
	/** Link to learn more */
	link?: {
		text: string
		href: string
	}
	/** Badge text (e.g., "Popular", "New") */
	badge?: string
	/** Additional CSS classes */
	className?: string
	/** Animation delay */
	delay?: number
}

export function InteractiveFeatureCard({
	title,
	description,
	visualization,
	visualizationProps = {},
	reversed = false,
	link,
	badge,
	className,
	delay = 0,
}: InteractiveFeatureCardProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<motion.div
			ref={ref}
			className={cn(
				'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12',
				reversed && 'lg:[&>*:first-child]:order-2',
				className,
			)}
			initial={{ opacity: 0, y: 30 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
			transition={{ duration: 0.5, delay }}
		>
			{/* Text Content */}
			<div className="flex flex-col justify-center">
				{badge && (
					<motion.span
						className="inline-flex self-start px-3 py-1 mb-4 text-xs font-medium badge-brand"
						initial={{ opacity: 0, x: -10 }}
						animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
						transition={{ duration: 0.3, delay: delay + 0.1 }}
					>
						{badge}
					</motion.span>
				)}

				<motion.h3
					className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4"
					initial={{ opacity: 0, y: 10 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
					transition={{ duration: 0.4, delay: delay + 0.15 }}
				>
					{title}
				</motion.h3>

				<motion.p
					className="text-muted-foreground text-lg leading-relaxed mb-6"
					initial={{ opacity: 0, y: 10 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
					transition={{ duration: 0.4, delay: delay + 0.2 }}
				>
					{description}
				</motion.p>

				{link && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
						transition={{ duration: 0.4, delay: delay + 0.25 }}
					>
						<Link
							href={link.href}
							className="inline-flex items-center gap-2 text-brand hover:underline group"
						>
							{link.text}
							<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</motion.div>
				)}
			</div>

			{/* Visualization */}
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.5, delay: delay + 0.2 }}
			>
				<BlueprintCard corners glow className="p-6 min-h-[200px] flex items-center justify-center">
					<FeatureVisualization
						type={visualization}
						props={visualizationProps}
						isInView={isInView}
					/>
				</BlueprintCard>
			</motion.div>
		</motion.div>
	)
}

/**
 * Renders the appropriate visualization based on type
 */
interface FeatureVisualizationProps {
	type: VisualizationType
	props: InteractiveFeatureCardProps['visualizationProps']
	isInView: boolean
}

function FeatureVisualization({ type, props = {}, isInView }: FeatureVisualizationProps) {
	switch (type) {
		case 'flow':
			return props.flowNodes ? (
				<FlowDiagram nodes={props.flowNodes} direction="horizontal" size="lg" />
			) : null

		case 'code':
			return props.code ? (
				<CodeBlock
					code={props.code}
					language={props.language || 'typescript'}
					copyable
					className="w-full"
				/>
			) : null

		case 'terminal':
			return props.code ? (
				<div className="w-full font-mono text-sm">
					<div className="flex items-center gap-2 mb-3">
						<div className="w-3 h-3 rounded-full bg-red-500/60" />
						<div className="w-3 h-3 rounded-full bg-yellow-500/60" />
						<div className="w-3 h-3 rounded-full bg-green-500/60" />
					</div>
					<pre className="text-foreground whitespace-pre-wrap">{props.code}</pre>
				</div>
			) : null

		case 'icons':
			return props.icons || null

		case 'custom':
			return props.custom || null

		default:
			return null
	}
}

/**
 * FeatureGrid - Container for multiple feature cards
 */
interface FeatureGridProps {
	children: React.ReactNode
	className?: string
}

export function FeatureGrid({ children, className }: FeatureGridProps) {
	return <div className={cn('space-y-16 md:space-y-24', className)}>{children}</div>
}

/**
 * PrebuiltVisualization: PII Sanitization Flow
 */
export function PIISanitizationFlow() {
	const nodes: FlowNode[] = [
		{ id: 'input', label: 'input', type: 'start', sublabel: 'user data' },
		{ id: 'detect', label: 'detect', type: 'process', sublabel: 'patterns' },
		{ id: 'redact', label: 'redact', type: 'process', sublabel: 'sensitive' },
		{ id: 'output', label: 'output', type: 'end', sublabel: 'safe logs' },
	]

	return <FlowDiagram nodes={nodes} direction="horizontal" size="md" />
}

/**
 * PrebuiltVisualization: Multi-Runtime Icons
 */
export function MultiRuntimeIcons() {
	const runtimes = [
		{ name: 'Node.js', icon: '⬢' },
		{ name: 'Bun', icon: '🥟' },
		{ name: 'Deno', icon: '🦕' },
		{ name: 'Edge', icon: '⚡' },
		{ name: 'Browser', icon: '🌐' },
	]

	return (
		<div className="flex items-center gap-6">
			{runtimes.map((runtime, i) => (
				<motion.div
					key={runtime.name}
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: i * 0.1 }}
				>
					<div className="w-12 h-12 flex items-center justify-center text-2xl bg-surface-elevated border border-brand/20 rounded-full">
						{runtime.icon}
					</div>
					<span className="text-xs text-muted-foreground">{runtime.name}</span>
				</motion.div>
			))}
		</div>
	)
}

/**
 * PrebuiltVisualization: Context Propagation
 */
export function ContextPropagationFlow() {
	const nodes: FlowNode[] = [
		{ id: 'request', label: 'request', type: 'start', sublabel: 'x-request-id' },
		{ id: 'handler', label: 'handler', type: 'process' },
		{ id: 'service', label: 'service', type: 'process' },
		{ id: 'db', label: 'database', type: 'end' },
	]

	return <FlowDiagram nodes={nodes} direction="horizontal" size="md" />
}

export default InteractiveFeatureCard
