'use client'

import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/**
 * BlueprintGrid - Technical grid background with optional decorative elements
 *
 * Cloudflare Sandbox inspired blueprint aesthetic with corner markers,
 * connection nodes, and animated scan effects.
 */

interface BlueprintGridProps {
	/** Grid density */
	variant?: 'default' | 'dense' | 'sparse'
	/** Show corner bracket markers */
	corners?: boolean
	/** Animate grid scan effect */
	animated?: boolean
	/** Additional CSS classes */
	className?: string
	/** Content */
	children: React.ReactNode
}

const gridClasses = {
	default: 'blueprint-grid',
	dense: 'blueprint-grid-dense',
	sparse: 'blueprint-grid-sparse',
}

export function BlueprintGrid({
	variant = 'default',
	corners = false,
	animated = false,
	className,
	children,
}: BlueprintGridProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<div
			ref={ref}
			className={cn('relative', gridClasses[variant], corners && 'corner-marker', className)}
		>
			{/* Animated scan line effect */}
			{animated && isInView && (
				<motion.div
					className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent pointer-events-none"
					initial={{ top: 0, opacity: 0 }}
					animate={{
						top: ['0%', '100%'],
						opacity: [0, 1, 1, 0],
					}}
					transition={{
						duration: 3,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'linear',
					}}
				/>
			)}
			{children}
		</div>
	)
}

/**
 * BlueprintSection - Full section wrapper with blueprint background
 */
interface BlueprintSectionProps {
	id?: string
	/** Grid density */
	variant?: 'default' | 'dense' | 'sparse'
	/** Show corner markers */
	corners?: boolean
	/** Section padding size */
	padding?: 'sm' | 'md' | 'lg' | 'xl'
	/** Additional CSS classes */
	className?: string
	/** Content */
	children: React.ReactNode
}

const paddingClasses = {
	sm: 'py-12 md:py-16',
	md: 'py-16 md:py-24',
	lg: 'py-24 md:py-32',
	xl: 'py-32 md:py-40',
}

export function BlueprintSection({
	id,
	variant = 'default',
	corners = true,
	padding = 'lg',
	className,
	children,
}: BlueprintSectionProps) {
	return (
		<section
			id={id}
			className={cn('relative', gridClasses[variant], paddingClasses[padding], className)}
		>
			{/* Corner markers */}
			{corners && <CornerMarkers />}

			{/* Content container */}
			<div className="relative container-wide">{children}</div>
		</section>
	)
}

/**
 * CornerMarkers - Decorative corner brackets
 */
function CornerMarkers() {
	return (
		<>
			{/* Top Left */}
			<div className="absolute top-4 left-4 w-6 h-6 border-l border-t border-brand/30" />
			{/* Top Right */}
			<div className="absolute top-4 right-4 w-6 h-6 border-r border-t border-brand/30" />
			{/* Bottom Left */}
			<div className="absolute bottom-4 left-4 w-6 h-6 border-l border-b border-brand/30" />
			{/* Bottom Right */}
			<div className="absolute bottom-4 right-4 w-6 h-6 border-r border-b border-brand/30" />
		</>
	)
}

/**
 * BlueprintCard - Card with blueprint styling
 */
interface BlueprintCardProps {
	/** Show corner markers */
	corners?: boolean
	/** Glow effect on hover */
	glow?: boolean
	/** Additional CSS classes */
	className?: string
	/** Content */
	children: React.ReactNode
}

export function BlueprintCard({
	corners = false,
	glow = false,
	className,
	children,
}: BlueprintCardProps) {
	return (
		<div
			className={cn(
				'relative bg-surface border border-brand/10',
				glow && 'hover:glow-brand-subtle transition-shadow duration-300',
				className,
			)}
		>
			{corners && <CardCorners />}
			{children}
		</div>
	)
}

/**
 * CardCorners - Smaller corner markers for cards
 */
function CardCorners() {
	return (
		<>
			<div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-brand/20" />
			<div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-brand/20" />
			<div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-brand/20" />
			<div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-brand/20" />
		</>
	)
}

/**
 * BlueprintDivider - Horizontal divider with animated appearance
 */
interface BlueprintDividerProps {
	/** Additional CSS classes */
	className?: string
}

export function BlueprintDivider({ className }: BlueprintDividerProps) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true })

	return (
		<div ref={ref} className={cn('relative flex items-center', className)}>
			<motion.div
				className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
				initial={{ scaleX: 0 }}
				animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
				transition={{ duration: 0.6 }}
			/>
		</div>
	)
}

export default BlueprintGrid
