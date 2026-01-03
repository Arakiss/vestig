import { cn } from '@/lib/utils'
import { Flash, Globe, HelpCircle, Laptop, Server, Settings } from 'iconoir-react'
import type { Runtime } from 'vestig'

/**
 * Runtime configuration for display (monochromatic)
 */
const runtimeConfig: Record<Runtime | 'unknown', { label: string; shortLabel: string }> = {
	node: { label: 'Node.js', shortLabel: 'Node' },
	bun: { label: 'Bun', shortLabel: 'Bun' },
	deno: { label: 'Deno', shortLabel: 'Deno' },
	edge: { label: 'Edge', shortLabel: 'Edge' },
	browser: { label: 'Browser', shortLabel: 'Browser' },
	worker: { label: 'Worker', shortLabel: 'Worker' },
	unknown: { label: 'Unknown', shortLabel: '?' },
}

interface RuntimeBadgeProps {
	/** The detected runtime */
	runtime: Runtime | 'unknown'
	/** Show icon */
	showIcon?: boolean
	/** Badge size */
	size?: 'sm' | 'md' | 'lg'
	/** Additional CSS classes */
	className?: string
}

/**
 * Visual badge showing the current runtime environment
 * Monochromatic design following Lyra preset
 */
export function RuntimeBadge({
	runtime,
	showIcon = true,
	size = 'md',
	className = '',
}: RuntimeBadgeProps) {
	const config = runtimeConfig[runtime]

	const sizeClasses = {
		sm: 'text-[10px] px-1.5 py-0.5 gap-1',
		md: 'text-xs px-2 py-1 gap-1.5',
		lg: 'text-sm px-3 py-1.5 gap-2',
	}

	const iconSizes = {
		sm: 'h-2.5 w-2.5',
		md: 'h-3 w-3',
		lg: 'h-3.5 w-3.5',
	}

	return (
		<span
			className={cn(
				'inline-flex items-center font-medium',
				'bg-white/5 border border-white/10 text-white/70',
				'hover:bg-white/10 hover:text-white/90 transition-colors',
				sizeClasses[size],
				className,
			)}
		>
			{showIcon && (
				<span className={cn('text-white/50', iconSizes[size])}>
					{runtime.charAt(0).toUpperCase()}
				</span>
			)}
			<span>{config.label}</span>
		</span>
	)
}

/**
 * Server/Client indicator badge (monochromatic)
 */
export function EnvironmentBadge({
	isServer,
	size = 'md',
	className = '',
}: {
	isServer: boolean
	size?: 'sm' | 'md' | 'lg'
	className?: string
}) {
	const sizeClasses = {
		sm: 'text-[10px] px-1.5 py-0.5 gap-1',
		md: 'text-xs px-2 py-1 gap-1.5',
		lg: 'text-sm px-3 py-1.5 gap-2',
	}

	const iconSizes = {
		sm: 'h-2.5 w-2.5',
		md: 'h-3 w-3',
		lg: 'h-3.5 w-3.5',
	}

	const Icon = isServer ? Server : Laptop

	return (
		<span
			className={cn(
				'inline-flex items-center font-medium',
				'bg-white/5 border border-white/10 text-white/70',
				'hover:bg-white/10 hover:text-white/90 transition-colors',
				sizeClasses[size],
				className,
			)}
		>
			<Icon className={cn('text-white/50', iconSizes[size])} />
			<span>{isServer ? 'Server' : 'Client'}</span>
		</span>
	)
}

/**
 * Combined runtime + environment badge
 */
export function FullRuntimeBadge({
	runtime,
	isServer,
	size = 'md',
	className = '',
}: {
	runtime: Runtime | 'unknown'
	isServer: boolean
	size?: 'sm' | 'md' | 'lg'
	className?: string
}) {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<RuntimeBadge runtime={runtime} size={size} />
			<EnvironmentBadge isServer={isServer} size={size} />
		</div>
	)
}

/**
 * Compact inline runtime indicator
 */
export function RuntimeIndicator({
	runtime,
	className = '',
}: { runtime: Runtime | 'unknown'; className?: string }) {
	return <span className={cn('text-white/50 font-mono text-xs', className)}>[{runtime}]</span>
}
