'use client'

import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/**
 * LineTitle - Cloudflare Sandbox inspired massive typography with decorative repeated lines
 *
 * Creates section titles with repeating arc or chevron patterns above the text,
 * animated on scroll into view using Framer Motion.
 */

interface LineTitleProps {
	children: string
	/** Number of decorative lines (default: 5) */
	lines?: number
	/** Line pattern variant */
	variant?: 'arc' | 'chevron' | 'parallel'
	/** Text size */
	size?: 'lg' | 'xl' | '2xl' | '3xl'
	/** Use brand color for lines (default: white with opacity) */
	accent?: boolean
	/** Additional CSS classes */
	className?: string
	/** Animation delay in seconds */
	delay?: number
}

const sizeClasses = {
	lg: 'text-4xl md:text-5xl lg:text-6xl',
	xl: 'text-5xl md:text-6xl lg:text-7xl',
	'2xl': 'text-6xl md:text-7xl lg:text-8xl',
	'3xl': 'text-7xl md:text-8xl lg:text-9xl',
}

const lineHeights = {
	lg: { height: 80, spacing: 8 },
	xl: { height: 100, spacing: 10 },
	'2xl': { height: 120, spacing: 12 },
	'3xl': { height: 150, spacing: 14 },
}

export function LineTitle({
	children,
	lines = 5,
	variant = 'arc',
	size = 'xl',
	accent = false,
	className,
	delay = 0,
}: LineTitleProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	const { height, spacing } = lineHeights[size]
	const strokeColor = accent ? 'hsl(var(--brand))' : 'hsl(0 0% 100% / 0.15)'

	return (
		<div ref={ref} className={cn('relative', className)}>
			{/* Decorative Lines SVG */}
			<div className="absolute inset-x-0 -top-4 flex justify-center pointer-events-none overflow-hidden">
				<svg
					width="100%"
					height={height}
					viewBox={`0 0 800 ${height}`}
					preserveAspectRatio="xMidYMax meet"
					className="max-w-4xl"
				>
					{Array.from({ length: lines }).map((_, i) => (
						<motion.path
							key={i}
							d={generatePath(variant, i, lines, height, spacing)}
							fill="none"
							stroke={strokeColor}
							strokeWidth={1}
							initial={{ pathLength: 0, opacity: 0 }}
							animate={
								isInView
									? {
											pathLength: 1,
											opacity: 1 - i * 0.15,
										}
									: { pathLength: 0, opacity: 0 }
							}
							transition={{
								pathLength: {
									duration: 0.8,
									delay: delay + i * 0.08,
									ease: 'easeOut',
								},
								opacity: {
									duration: 0.3,
									delay: delay + i * 0.08,
								},
							}}
						/>
					))}
				</svg>
			</div>

			{/* Main Text */}
			<motion.h2
				className={cn(
					'relative font-display font-bold tracking-tight text-white',
					sizeClasses[size],
				)}
				initial={{ opacity: 0, y: 20 }}
				animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
				transition={{ duration: 0.5, delay: delay + 0.3 }}
			>
				{children}
			</motion.h2>
		</div>
	)
}

/**
 * Generates SVG path for different line variants
 */
function generatePath(
	variant: 'arc' | 'chevron' | 'parallel',
	index: number,
	total: number,
	height: number,
	spacing: number,
): string {
	const y = height - index * spacing
	const width = 800

	switch (variant) {
		case 'arc': {
			// Arcs that curve upward (like Cloudflare's "sandbox" title)
			const arcHeight = 30 + index * 8
			return `M 0 ${y} Q ${width / 2} ${y - arcHeight} ${width} ${y}`
		}

		case 'chevron': {
			// Chevron/arrow patterns pointing up
			const chevronHeight = 20 + index * 6
			return `M 0 ${y} L ${width / 2} ${y - chevronHeight} L ${width} ${y}`
		}

		case 'parallel':
			// Simple parallel horizontal lines
			return `M 0 ${y} L ${width} ${y}`

		default:
			return `M 0 ${y} L ${width} ${y}`
	}
}

/**
 * LineTitleInline - A simpler inline version for smaller headings
 */
interface LineTitleInlineProps {
	children: string
	className?: string
	accent?: boolean
}

export function LineTitleInline({ children, className, accent = false }: LineTitleInlineProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-50px' })

	return (
		<motion.span
			ref={ref}
			className={cn('relative inline-block', accent && 'text-gradient-brand', className)}
			initial={{ opacity: 0 }}
			animate={isInView ? { opacity: 1 } : { opacity: 0 }}
			transition={{ duration: 0.5 }}
		>
			{/* Underline accent */}
			<motion.span
				className="absolute bottom-0 left-0 h-px bg-brand"
				initial={{ scaleX: 0 }}
				animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
				transition={{ duration: 0.6, delay: 0.2 }}
				style={{ transformOrigin: 'left' }}
			/>
			{children}
		</motion.span>
	)
}

export default LineTitle
