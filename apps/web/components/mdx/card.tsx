import { cn } from '@/lib/utils'
import { ArrowRight } from 'iconoir-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface CardProps {
	title: string
	description?: string
	href?: string
	icon?: ReactNode
	children?: ReactNode
	className?: string
}

interface CardGridProps {
	children: ReactNode
	cols?: 2 | 3 | 4
	className?: string
}

export function Card({ title, description, href, icon, children, className }: CardProps) {
	const content = (
		<>
			{/* Icon */}
			{icon && (
				<div className="inline-flex items-center justify-center w-10 h-10 border border-white/10 mb-4 group-hover:border-white/20 transition-colors">
					<span className="text-white/70 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
				</div>
			)}

			{/* Title */}
			<h3 className="font-semibold text-white flex items-center gap-2">
				{title}
				{href && (
					<ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
				)}
			</h3>

			{/* Description */}
			{description && <p className="mt-2 text-sm text-white/40 leading-relaxed">{description}</p>}

			{/* Children */}
			{children && <div className="mt-3 text-sm text-white/50">{children}</div>}
		</>
	)

	const cardClasses = cn(
		'group relative p-5 border border-white/[0.06] transition-all duration-300',
		'hover:border-white/15 hover:bg-white/[0.02]',
		className,
	)

	if (href) {
		return (
			<Link href={href} className={cardClasses}>
				{content}
			</Link>
		)
	}

	return <div className={cardClasses}>{content}</div>
}

export function CardGrid({ children, cols = 2, className }: CardGridProps) {
	const colsClass = {
		2: 'md:grid-cols-2',
		3: 'md:grid-cols-2 lg:grid-cols-3',
		4: 'md:grid-cols-2 lg:grid-cols-4',
	}

	return (
		<div className={cn('grid grid-cols-1 gap-3 my-6', colsClass[cols], className)}>{children}</div>
	)
}
