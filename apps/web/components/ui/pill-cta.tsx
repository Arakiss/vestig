'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'iconoir-react'
import Link from 'next/link'

/**
 * PillCTA - Cloudflare-style pill-shaped call-to-action buttons
 *
 * Fully rounded buttons with brand color accents, optional arrows,
 * and hover glow effects.
 */

interface PillCTAProps {
	children: React.ReactNode
	href: string
	/** Button variant */
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
	/** Button size */
	size?: 'sm' | 'md' | 'lg' | 'xl'
	/** Show arrow icon */
	arrow?: 'none' | 'right' | 'diagonal'
	/** External link (opens in new tab) */
	external?: boolean
	/** Additional CSS classes */
	className?: string
}

const variants = {
	primary: cn(
		'bg-brand text-brand-foreground',
		'border border-brand',
		'hover:bg-brand/90 hover:glow-brand',
	),
	secondary: cn(
		'bg-surface-elevated text-foreground',
		'border border-brand/30',
		'hover:border-brand/60 hover:bg-surface-overlay',
	),
	outline: cn(
		'bg-transparent text-foreground',
		'border border-brand/50',
		'hover:border-brand hover:bg-brand/10',
	),
	ghost: cn('bg-transparent text-foreground', 'border border-transparent', 'hover:bg-brand/10'),
}

const sizes = {
	sm: 'px-4 py-2 text-sm gap-1.5',
	md: 'px-6 py-2.5 text-base gap-2',
	lg: 'px-8 py-3 text-lg gap-2',
	xl: 'px-10 py-4 text-xl gap-3',
}

export function PillCTA({
	children,
	href,
	variant = 'primary',
	size = 'md',
	arrow = 'none',
	external = false,
	className,
}: PillCTAProps) {
	const ArrowIcon = arrow === 'diagonal' ? ArrowUpRight : ArrowRight

	const content = (
		<>
			<span className="inline-flex items-center">{children}</span>
			{arrow !== 'none' && (
				<motion.span
					className="inline-flex"
					initial={{ x: 0 }}
					whileHover={{ x: 3 }}
					transition={{ duration: 0.2 }}
				>
					<ArrowIcon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
				</motion.span>
			)}
		</>
	)

	const buttonClasses = cn(
		'inline-flex items-center justify-center font-medium',
		'rounded-full transition-all duration-200',
		variants[variant],
		sizes[size],
		className,
	)

	if (external) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses}>
				{content}
			</a>
		)
	}

	return (
		<Link href={href} className={buttonClasses}>
			{content}
		</Link>
	)
}

/**
 * PillCTAGroup - Container for multiple PillCTAs
 */
interface PillCTAGroupProps {
	children: React.ReactNode
	/** Stack direction */
	direction?: 'row' | 'column'
	/** Alignment */
	align?: 'start' | 'center' | 'end'
	/** Gap between buttons */
	gap?: 'sm' | 'md' | 'lg'
	className?: string
}

const gapSizes = {
	sm: 'gap-2',
	md: 'gap-4',
	lg: 'gap-6',
}

const alignClasses = {
	start: 'justify-start',
	center: 'justify-center',
	end: 'justify-end',
}

export function PillCTAGroup({
	children,
	direction = 'row',
	align = 'start',
	gap = 'md',
	className,
}: PillCTAGroupProps) {
	return (
		<div
			className={cn(
				'flex flex-wrap items-center',
				direction === 'column' && 'flex-col',
				alignClasses[align],
				gapSizes[gap],
				className,
			)}
		>
			{children}
		</div>
	)
}

/**
 * InstallCommand - Pill-styled install command with copy button
 */
interface InstallCommandProps {
	command: string
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

export function InstallCommand({ command, size = 'md', className }: InstallCommandProps) {
	const handleCopy = async () => {
		await navigator.clipboard.writeText(command)
	}

	const sizeClasses = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-2.5 text-base',
		lg: 'px-8 py-3 text-lg',
	}

	return (
		<button
			onClick={handleCopy}
			className={cn(
				'inline-flex items-center gap-3 font-mono',
				'rounded-full transition-all duration-200',
				'bg-surface border border-brand/30',
				'hover:border-brand/60 hover:bg-surface-elevated',
				'group',
				sizeClasses[size],
				className,
			)}
		>
			<span className="text-muted-foreground">$</span>
			<span className="text-foreground">{command}</span>
			<span className="text-muted-foreground group-hover:text-brand transition-colors text-xs uppercase tracking-wider">
				Copy
			</span>
		</button>
	)
}

export default PillCTA
