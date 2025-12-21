import type { Runtime } from 'vestig'

/**
 * Runtime configuration for display
 */
const runtimeConfig: Record<
	Runtime | 'unknown',
	{ label: string; color: string; bg: string; icon: string }
> = {
	node: {
		label: 'Node.js',
		color: 'text-green-400',
		bg: 'bg-green-500/10 border-green-500/30',
		icon: '🟢',
	},
	bun: {
		label: 'Bun',
		color: 'text-pink-400',
		bg: 'bg-pink-500/10 border-pink-500/30',
		icon: '🥟',
	},
	edge: {
		label: 'Edge',
		color: 'text-orange-400',
		bg: 'bg-orange-500/10 border-orange-500/30',
		icon: '⚡',
	},
	browser: {
		label: 'Browser',
		color: 'text-purple-400',
		bg: 'bg-purple-500/10 border-purple-500/30',
		icon: '🌐',
	},
	worker: {
		label: 'Worker',
		color: 'text-cyan-400',
		bg: 'bg-cyan-500/10 border-cyan-500/30',
		icon: '⚙️',
	},
	unknown: {
		label: 'Unknown',
		color: 'text-gray-400',
		bg: 'bg-gray-500/10 border-gray-500/30',
		icon: '❓',
	},
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
 * Color-coded to easily identify where code is executing
 */
export function RuntimeBadge({
	runtime,
	showIcon = true,
	size = 'md',
	className = '',
}: RuntimeBadgeProps) {
	const config = runtimeConfig[runtime]

	const sizeClasses = {
		sm: 'text-[10px] px-1.5 py-0.5',
		md: 'text-xs px-2 py-1',
		lg: 'text-sm px-3 py-1.5',
	}

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${config.bg} ${sizeClasses[size]} ${className}`}
		>
			{showIcon && <span>{config.icon}</span>}
			<span>{config.label}</span>
		</span>
	)
}

/**
 * Server/Client indicator badge
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
		sm: 'text-[10px] px-1.5 py-0.5',
		md: 'text-xs px-2 py-1',
		lg: 'text-sm px-3 py-1.5',
	}

	if (isServer) {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full border font-medium text-green-400 bg-green-500/10 border-green-500/30 ${sizeClasses[size]} ${className}`}
			>
				<span>🖥️</span>
				<span>Server</span>
			</span>
		)
	}

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border font-medium text-purple-400 bg-purple-500/10 border-purple-500/30 ${sizeClasses[size]} ${className}`}
		>
			<span>💻</span>
			<span>Client</span>
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
		<div className={`flex items-center gap-2 ${className}`}>
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
}: {
	runtime: Runtime | 'unknown'
	className?: string
}) {
	const config = runtimeConfig[runtime]

	return <span className={`${config.color} font-mono text-xs ${className}`}>[{runtime}]</span>
}
