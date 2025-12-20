'use client'

import { type ReactNode, useState } from 'react'

interface DemoCardProps {
	/** Card title */
	title: string
	/** Card description */
	description: string
	/** Icon to display */
	icon?: string
	/** Code example to show */
	code?: string
	/** Action button label */
	actionLabel?: string
	/** Action handler */
	onAction?: () => void | Promise<void>
	/** Whether action is running */
	isLoading?: boolean
	/** Child content to render */
	children?: ReactNode
	/** Additional CSS classes */
	className?: string
}

/**
 * Reusable demo card component
 * Displays a demo with title, description, code example, and action button
 */
export function DemoCard({
	title,
	description,
	icon,
	code,
	actionLabel = 'Run Demo',
	onAction,
	isLoading = false,
	children,
	className = '',
}: DemoCardProps) {
	const [localLoading, setLocalLoading] = useState(false)
	const loading = isLoading || localLoading

	const handleAction = async () => {
		if (!onAction || loading) return
		setLocalLoading(true)
		try {
			await onAction()
		} finally {
			setLocalLoading(false)
		}
	}

	return (
		<div
			className={`bg-gray-900/50 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors ${className}`}
		>
			{/* Header */}
			<div className="flex items-start gap-3 mb-4">
				{icon && <span className="text-2xl">{icon}</span>}
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
					<p className="text-sm text-gray-400">{description}</p>
				</div>
			</div>

			{/* Code example */}
			{code && (
				<div className="mb-4">
					<pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-xs">
						<code className="text-gray-300">{code}</code>
					</pre>
				</div>
			)}

			{/* Custom content */}
			{children && <div className="mb-4">{children}</div>}

			{/* Action button */}
			{onAction && (
				<button
					type="button"
					onClick={handleAction}
					disabled={loading}
					className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
						loading
							? 'bg-gray-700 text-gray-400 cursor-not-allowed'
							: 'bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]'
					}`}
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<span className="animate-spin">⏳</span>
							Running...
						</span>
					) : (
						actionLabel
					)}
				</button>
			)}
		</div>
	)
}

/**
 * Grid layout for demo cards
 */
export function DemoGrid({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
}

/**
 * Link card for navigation
 */
export function DemoLinkCard({
	title,
	description,
	icon,
	href,
	tags,
	className = '',
}: {
	title: string
	description: string
	icon: string
	href: string
	tags?: string[]
	className?: string
}) {
	return (
		<a
			href={href}
			className={`block bg-gray-900/50 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-900/80 transition-all group ${className}`}
		>
			<div className="flex items-start gap-3">
				<span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
						{title}
					</h3>
					<p className="text-sm text-gray-400 mb-3">{description}</p>
					{tags && (
						<div className="flex flex-wrap gap-1.5">
							{tags.map((tag) => (
								<span
									key={tag}
									className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] text-gray-500 font-medium"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>
				<span className="text-gray-600 group-hover:text-white transition-colors">→</span>
			</div>
		</a>
	)
}

/**
 * Result display area
 */
export function DemoResult({
	title = 'Result',
	children,
	className = '',
}: {
	title?: string
	children: ReactNode
	className?: string
}) {
	return (
		<div className={`mt-4 ${className}`}>
			<div className="text-[10px] text-gray-500 uppercase mb-2">{title}</div>
			<div className="bg-black/30 rounded-lg p-4 border border-white/5">{children}</div>
		</div>
	)
}
