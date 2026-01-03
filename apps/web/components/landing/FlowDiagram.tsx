'use client'

import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/**
 * FlowDiagram - Visualizes data flow with connected nodes
 *
 * Cloudflare Sandbox inspired flow visualization with:
 * - Animated connection lines
 * - Start/end markers
 * - Brand-colored nodes
 */

export interface FlowNode {
	id: string
	label: string
	type: 'start' | 'process' | 'end'
	sublabel?: string
}

interface FlowDiagramProps {
	nodes: FlowNode[]
	/** Flow direction */
	direction?: 'horizontal' | 'vertical'
	/** Diagram size */
	size?: 'sm' | 'md' | 'lg'
	/** Show labels */
	showLabels?: boolean
	/** Additional CSS classes */
	className?: string
}

export function FlowDiagram({
	nodes,
	direction = 'horizontal',
	size = 'md',
	showLabels = true,
	className,
}: FlowDiagramProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-50px' })

	const isHorizontal = direction === 'horizontal'

	const nodeSizes = {
		sm: 'w-3 h-3',
		md: 'w-4 h-4',
		lg: 'w-5 h-5',
	}

	const lineSizes = {
		sm: isHorizontal ? 'w-12 h-px' : 'w-px h-12',
		md: isHorizontal ? 'w-16 h-px' : 'w-px h-16',
		lg: isHorizontal ? 'w-20 h-px' : 'w-px h-20',
	}

	return (
		<div ref={ref} className={cn('flex items-center', !isHorizontal && 'flex-col', className)}>
			{nodes.map((node, index) => (
				<div key={node.id} className={cn('flex items-center', !isHorizontal && 'flex-col')}>
					{/* Node */}
					<div className="relative flex flex-col items-center">
						<motion.div
							className={cn(
								'rounded-full',
								nodeSizes[size],
								node.type === 'start' && 'bg-brand',
								node.type === 'process' && 'bg-white border-2 border-brand',
								node.type === 'end' && 'bg-brand',
							)}
							initial={{ scale: 0, opacity: 0 }}
							animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
							transition={{
								duration: 0.3,
								delay: index * 0.15,
								type: 'spring',
								stiffness: 200,
							}}
						/>

						{/* Label */}
						{showLabels && (
							<motion.div
								className={cn(
									'absolute whitespace-nowrap',
									isHorizontal ? 'top-full mt-2' : 'left-full ml-3',
									'text-xs',
								)}
								initial={{ opacity: 0, y: 5 }}
								animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
								transition={{ duration: 0.3, delay: index * 0.15 + 0.2 }}
							>
								<span
									className={cn(
										'font-mono',
										(node.type === 'start' || node.type === 'end') && 'text-brand',
										node.type === 'process' && 'text-muted-foreground',
									)}
								>
									{node.label}
								</span>
								{node.sublabel && (
									<span className="block text-muted-foreground/60 text-2xs">{node.sublabel}</span>
								)}
							</motion.div>
						)}
					</div>

					{/* Connection Line */}
					{index < nodes.length - 1 && (
						<motion.div
							className={cn(
								'bg-gradient-to-r from-brand/50 via-brand to-brand/50',
								isHorizontal ? 'mx-1' : 'my-1 bg-gradient-to-b',
								lineSizes[size],
							)}
							initial={{ scale: 0 }}
							animate={isInView ? { scale: 1 } : { scale: 0 }}
							transition={{
								duration: 0.4,
								delay: index * 0.15 + 0.1,
							}}
							style={{
								transformOrigin: isHorizontal ? 'left' : 'top',
							}}
						/>
					)}
				</div>
			))}
		</div>
	)
}

/**
 * FlowDiagramVertical - Vertical flow with more detail
 */
interface FlowStepProps {
	step: FlowNode
	index: number
	total: number
	isInView: boolean
}

function FlowStep({ step, index, total, isInView }: FlowStepProps) {
	const isFirst = index === 0
	const isLast = index === total - 1

	return (
		<div className="relative flex items-start gap-4">
			{/* Node and line */}
			<div className="flex flex-col items-center">
				<motion.div
					className={cn(
						'relative z-10 w-4 h-4 rounded-full',
						step.type === 'start' && 'bg-brand',
						step.type === 'process' && 'bg-surface border-2 border-brand',
						step.type === 'end' && 'bg-brand',
					)}
					initial={{ scale: 0 }}
					animate={isInView ? { scale: 1 } : { scale: 0 }}
					transition={{ duration: 0.3, delay: index * 0.1 }}
				>
					{/* Glow for start/end */}
					{(isFirst || isLast) && (
						<motion.div
							className="absolute inset-0 rounded-full bg-brand/30"
							animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
							transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
						/>
					)}
				</motion.div>

				{/* Connecting line */}
				{!isLast && (
					<motion.div
						className="w-px h-12 bg-gradient-to-b from-brand to-brand/30"
						initial={{ scaleY: 0 }}
						animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
						transition={{ duration: 0.4, delay: index * 0.1 + 0.15 }}
						style={{ transformOrigin: 'top' }}
					/>
				)}
			</div>

			{/* Content */}
			<motion.div
				className="pb-8"
				initial={{ opacity: 0, x: -10 }}
				animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
				transition={{ duration: 0.3, delay: index * 0.1 + 0.1 }}
			>
				<span
					className={cn(
						'text-sm font-medium',
						(step.type === 'start' || step.type === 'end') && 'text-brand',
						step.type === 'process' && 'text-foreground',
					)}
				>
					{step.label}
				</span>
				{step.sublabel && <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>}
			</motion.div>
		</div>
	)
}

export function FlowDiagramVertical({
	nodes,
	className,
}: {
	nodes: FlowNode[]
	className?: string
}) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-50px' })

	return (
		<div ref={ref} className={className}>
			{nodes.map((node, index) => (
				<FlowStep
					key={node.id}
					step={node}
					index={index}
					total={nodes.length}
					isInView={isInView}
				/>
			))}
		</div>
	)
}

/**
 * SimpleFlowIndicator - Minimal inline flow indicator
 */
interface SimpleFlowIndicatorProps {
	steps: string[]
	className?: string
}

export function SimpleFlowIndicator({ steps, className }: SimpleFlowIndicatorProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true })

	return (
		<div ref={ref} className={cn('flex items-center gap-2 text-sm', className)}>
			{steps.map((step, i) => (
				<motion.div
					key={i}
					className="flex items-center gap-2"
					initial={{ opacity: 0 }}
					animate={isInView ? { opacity: 1 } : { opacity: 0 }}
					transition={{ duration: 0.3, delay: i * 0.1 }}
				>
					<span
						className={cn(
							i === 0 && 'text-brand font-medium',
							i > 0 && i < steps.length - 1 && 'text-muted-foreground',
							i === steps.length - 1 && 'text-brand font-medium',
						)}
					>
						{step}
					</span>
					{i < steps.length - 1 && (
						<motion.span
							className="text-brand"
							initial={{ opacity: 0, x: -5 }}
							animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -5 }}
							transition={{ duration: 0.2, delay: i * 0.1 + 0.15 }}
						>
							→
						</motion.span>
					)}
				</motion.div>
			))}
		</div>
	)
}

export default FlowDiagram
