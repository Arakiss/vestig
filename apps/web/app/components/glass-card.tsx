'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
	children: ReactNode
	className?: string
	variant?: 'default' | 'glow' | 'subtle'
	hover?: boolean
	padding?: 'none' | 'sm' | 'md' | 'lg'
	onClick?: () => void
	/** Required when onClick is provided for accessibility */
	ariaLabel?: string
}

const paddingClasses = {
	none: '',
	sm: 'p-3',
	md: 'p-4',
	lg: 'p-6',
}

/**
 * Glassmorphism card component with blur effect and subtle borders
 */
export function GlassCard({
	children,
	className,
	variant = 'default',
	hover = true,
	padding = 'md',
	onClick,
	ariaLabel,
}: GlassCardProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault()
			onClick()
		}
	}

	return (
		<div
			onClick={onClick}
			onKeyDown={onClick ? handleKeyDown : undefined}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			aria-label={onClick ? ariaLabel : undefined}
			className={cn(
				// Base glass styles
				'relative overflow-hidden rounded-2xl',
				'bg-white/[0.03] backdrop-blur-xl',
				'border border-white/[0.08]',
				'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
				// Hover effect
				hover && 'transition-all duration-300',
				hover && 'hover:bg-white/[0.05] hover:border-white/[0.12]',
				hover && 'hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]',
				// Variants
				variant === 'glow' && 'border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]',
				variant === 'glow' && hover && 'hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]',
				variant === 'subtle' && 'bg-white/[0.02] border-white/[0.05]',
				// Padding
				paddingClasses[padding],
				// Cursor for clickable
				onClick && 'cursor-pointer',
				className,
			)}
		>
			{children}
		</div>
	)
}

interface GlassCardHeaderProps {
	children: ReactNode
	className?: string
}

export function GlassCardHeader({ children, className }: GlassCardHeaderProps) {
	return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

interface GlassCardTitleProps {
	children: ReactNode
	icon?: ReactNode
	className?: string
	gradient?: boolean
}

export function GlassCardTitle({
	children,
	icon,
	className,
	gradient = false,
}: GlassCardTitleProps) {
	return (
		<div className={cn('flex items-center gap-3', className)}>
			{icon && (
				<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10">
					<span className="text-indigo-400">{icon}</span>
				</div>
			)}
			<h3
				className={cn(
					'text-lg font-semibold',
					gradient
						? 'bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent'
						: 'text-white',
				)}
			>
				{children}
			</h3>
		</div>
	)
}

interface GlassCardDescriptionProps {
	children: ReactNode
	className?: string
}

export function GlassCardDescription({ children, className }: GlassCardDescriptionProps) {
	return <p className={cn('text-sm text-white/50 leading-relaxed', className)}>{children}</p>
}

interface GlassCardBadgeProps {
	children: ReactNode
	variant?: 'default' | 'success' | 'warning' | 'error' | 'new'
	className?: string
}

const badgeVariants = {
	default: 'bg-white/10 text-white/70 border-white/10',
	success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
	error: 'bg-red-500/10 text-red-400 border-red-500/20',
	new: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

export function GlassCardBadge({ children, variant = 'default', className }: GlassCardBadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border',
				badgeVariants[variant],
				className,
			)}
		>
			{children}
		</span>
	)
}

interface GlassCardFooterProps {
	children: ReactNode
	className?: string
}

export function GlassCardFooter({ children, className }: GlassCardFooterProps) {
	return (
		<div
			className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]', className)}
		>
			{children}
		</div>
	)
}

interface GlassButtonProps {
	children: ReactNode
	onClick?: () => void
	variant?: 'primary' | 'secondary' | 'ghost'
	size?: 'sm' | 'md' | 'lg'
	disabled?: boolean
	loading?: boolean
	className?: string
	icon?: ReactNode
}

export function GlassButton({
	children,
	onClick,
	variant = 'primary',
	size = 'md',
	disabled = false,
	loading = false,
	className,
	icon,
}: GlassButtonProps) {
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base',
	}

	const variantClasses = {
		primary: cn(
			'bg-gradient-to-r from-indigo-500 to-violet-500',
			'hover:from-indigo-400 hover:to-violet-400',
			'text-white font-medium',
			'shadow-[0_4px_20px_rgba(99,102,241,0.3)]',
			'hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)]',
		),
		secondary: cn(
			'bg-white/10 hover:bg-white/15',
			'text-white/80 hover:text-white',
			'border border-white/10 hover:border-white/20',
		),
		ghost: cn('bg-transparent hover:bg-white/5', 'text-white/60 hover:text-white/90'),
	}

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className={cn(
				'inline-flex items-center justify-center gap-2 rounded-lg',
				'transition-all duration-200',
				'disabled:opacity-50 disabled:cursor-not-allowed',
				sizeClasses[size],
				variantClasses[variant],
				className,
			)}
		>
			{loading ? (
				<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
			) : icon ? (
				<span className="w-4 h-4">{icon}</span>
			) : null}
			{children}
		</button>
	)
}

interface GlassGridProps {
	children: ReactNode
	cols?: 1 | 2 | 3 | 4
	className?: string
}

export function GlassGrid({ children, cols = 3, className }: GlassGridProps) {
	const colClasses = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 md:grid-cols-2',
		3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
	}

	return <div className={cn('grid gap-4', colClasses[cols], className)}>{children}</div>
}

interface GlassHeroProps {
	title: string
	description: string
	badge?: string
	gradient?: boolean
	className?: string
}

export function GlassHero({
	title,
	description,
	badge,
	gradient = true,
	className,
}: GlassHeroProps) {
	return (
		<div className={cn('mb-12', className)}>
			{badge && (
				<div className="inline-flex items-center gap-2 mb-4">
					<span className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
						{badge}
					</span>
				</div>
			)}
			<h1
				className={cn(
					'text-4xl md:text-5xl font-bold mb-4',
					gradient
						? 'bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent'
						: 'text-white',
				)}
			>
				{title}
			</h1>
			<p className="text-lg text-white/50 max-w-2xl leading-relaxed">{description}</p>
		</div>
	)
}

interface MetricValueProps {
	value: string | number
	label: string
	rating?: 'good' | 'needs-improvement' | 'poor'
	unit?: string
	className?: string
}

const ratingColors = {
	good: 'text-emerald-400',
	'needs-improvement': 'text-amber-400',
	poor: 'text-red-400',
}

const ratingDots = {
	good: 'bg-emerald-400',
	'needs-improvement': 'bg-amber-400',
	poor: 'bg-red-400',
}

export function MetricValue({ value, label, rating, unit, className }: MetricValueProps) {
	return (
		<div className={cn('text-center', className)}>
			<div className="flex items-baseline justify-center gap-1">
				<span className={cn('text-3xl font-bold', rating ? ratingColors[rating] : 'text-white')}>
					{value}
				</span>
				{unit && <span className="text-sm text-white/40">{unit}</span>}
			</div>
			<div className="flex items-center justify-center gap-2 mt-1">
				{rating && <span className={cn('w-2 h-2 rounded-full', ratingDots[rating])} />}
				<span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
			</div>
		</div>
	)
}
