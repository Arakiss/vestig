import { cn } from '@/lib/utils'
import { Check } from 'iconoir-react'
import type { ReactNode } from 'react'

interface FeatureListProps {
	children: ReactNode
	className?: string
}

interface FeatureProps {
	children: ReactNode
	available?: boolean
	className?: string
}

export function FeatureList({ children, className }: FeatureListProps) {
	return <ul className={cn('my-6 space-y-3', className)}>{children}</ul>
}

export function Feature({ children, available = true, className }: FeatureProps) {
	return (
		<li className={cn('flex items-start gap-3', className)}>
			<div
				className={cn(
					'flex items-center justify-center w-5 h-5 shrink-0 mt-0.5',
					available ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30',
				)}
			>
				<Check className="h-3 w-3" />
			</div>
			<span className={cn('text-sm', available ? 'text-white/70' : 'text-white/40')}>
				{children}
			</span>
		</li>
	)
}
