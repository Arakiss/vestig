'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { ArrowRight, Check, Copy, Play } from 'iconoir-react'
import Link from 'next/link'
import { type ReactNode, useState } from 'react'

/**
 * Terminal-style header with macOS dots
 */
function TerminalHeader({ title = 'code' }: { title?: string }) {
	return (
		<div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
			<div className="flex gap-1.5">
				<div className="w-2 h-2 rounded-full bg-white/20" />
				<div className="w-2 h-2 rounded-full bg-white/20" />
				<div className="w-2 h-2 rounded-full bg-white/20" />
			</div>
			<span className="text-[10px] text-white/30 uppercase tracking-wider ml-1">{title}</span>
		</div>
	)
}

/**
 * Decorative corner elements for premium cards
 */
function DecorativeCorners({ size = 'default' }: { size?: 'default' | 'large' }) {
	const sizes = {
		default: { tr: 'w-12 h-12', bl: 'w-8 h-8' },
		large: { tr: 'w-20 h-20', bl: 'w-14 h-14' },
	}

	return (
		<>
			<div
				className={cn(
					'absolute top-0 right-0 border-l border-b border-white/[0.04]',
					sizes[size].tr,
				)}
			/>
			<div
				className={cn(
					'absolute bottom-0 left-0 border-r border-t border-white/[0.04]',
					sizes[size].bl,
				)}
			/>
		</>
	)
}

/**
 * Code block with terminal styling and copy button
 */
function TerminalCodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="relative group border border-white/[0.06] overflow-hidden">
			<TerminalHeader title={language} />
			<div className="relative">
				<div className="p-4 bg-black/40 overflow-x-auto">
					<pre className="text-xs leading-relaxed">
						<code className="text-white/60 font-mono">{code}</code>
					</pre>
				</div>
				<button
					type="button"
					onClick={handleCopy}
					className={cn(
						'absolute top-2 right-2 p-1.5',
						'bg-white/5 border border-white/10',
						'opacity-0 group-hover:opacity-100 transition-all duration-200',
						'hover:bg-white/10 hover:border-white/20',
					)}
					aria-label="Copy code"
				>
					{copied ? (
						<Check className="h-3 w-3 text-white/70" />
					) : (
						<Copy className="h-3 w-3 text-white/40" />
					)}
				</button>
			</div>
		</div>
	)
}

interface DemoCardProps {
	/** Card title */
	title: string
	/** Card description */
	description: string
	/** Icon to display */
	icon?: ReactNode
	/** Code example to show */
	code?: string
	/** Code language for syntax label */
	codeLanguage?: string
	/** Action button label */
	actionLabel?: string
	/** Action handler */
	onAction?: () => void | Promise<void>
	/** Whether action is running */
	isLoading?: boolean
	/** Card variant - featured gets decorative corners */
	variant?: 'default' | 'featured'
	/** Child content to render */
	children?: ReactNode
	/** Additional CSS classes */
	className?: string
}

/**
 * Reusable demo card component
 * Premium design with terminal headers and optional decorative corners
 */
export function DemoCard({
	title,
	description,
	icon,
	code,
	codeLanguage = 'typescript',
	actionLabel = 'Run Demo',
	onAction,
	isLoading = false,
	variant = 'default',
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
		<Card
			className={cn(
				'relative bg-surface border-white/[0.06] overflow-hidden',
				'hover:border-white/15 hover:bg-white/[0.02] transition-all duration-300',
				variant === 'featured' && 'p-1',
				className,
			)}
		>
			{variant === 'featured' && <DecorativeCorners />}

			<CardHeader className="pb-3">
				<div className="flex items-start gap-3">
					{icon && <span className="text-white/40 shrink-0">{icon}</span>}
					<div className="flex-1 space-y-1">
						<CardTitle className="text-base font-semibold">{title}</CardTitle>
						<CardDescription className="text-white/50">{description}</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Code example with terminal styling */}
				{code && <TerminalCodeBlock code={code} language={codeLanguage} />}

				{/* Custom content */}
				{children}

				{/* Action button */}
				{onAction && (
					<Button onClick={handleAction} disabled={loading} variant="secondary" className="w-full">
						{loading ? (
							<>
								<Spinner className="h-4 w-4" />
								Running...
							</>
						) : (
							<>
								<Play className="h-4 w-4" />
								{actionLabel}
							</>
						)}
					</Button>
				)}
			</CardContent>
		</Card>
	)
}

/**
 * Grid layout for demo cards with optional asymmetric sizing
 */
export function DemoGrid({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
			{children}
		</div>
	)
}

/**
 * Link card for navigation - premium hover effects
 */
export function DemoLinkCard({
	title,
	description,
	icon,
	href,
	tags,
	featured = false,
	className = '',
}: {
	title: string
	description: string
	icon: ReactNode
	href: string
	tags?: string[]
	featured?: boolean
	className?: string
}) {
	return (
		<Link href={href} className={cn('block group', className)}>
			<Card
				className={cn(
					'relative h-full bg-surface border-white/[0.06] overflow-hidden',
					'hover:border-white/15 hover:bg-white/[0.02] transition-all duration-300',
				)}
			>
				{featured && <DecorativeCorners />}

				<CardHeader className="pb-3">
					<div className="flex items-start gap-3">
						<span className="text-white/40 group-hover:text-white/70 transition-colors shrink-0">
							{icon}
						</span>
						<div className="flex-1 space-y-1">
							<CardTitle className="text-base font-semibold group-hover:text-white transition-colors flex items-center gap-2">
								{title}
								<ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
							</CardTitle>
							<CardDescription className="text-white/50">{description}</CardDescription>
						</div>
					</div>
				</CardHeader>

				{tags && tags.length > 0 && (
					<CardContent className="pt-0">
						<div className="flex flex-wrap gap-1.5">
							{tags.map((tag) => (
								<span
									key={tag}
									className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/50"
								>
									{tag}
								</span>
							))}
						</div>
					</CardContent>
				)}
			</Card>
		</Link>
	)
}

/**
 * Result display area with terminal styling
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
		<div className={cn('mt-4', className)}>
			<div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">{title}</div>
			<div className="bg-black/40 p-4 border border-white/[0.06]">{children}</div>
		</div>
	)
}

// Export subcomponents for direct use
export { TerminalHeader, TerminalCodeBlock, DecorativeCorners }
