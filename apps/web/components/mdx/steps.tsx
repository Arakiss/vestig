import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StepsProps {
	children: ReactNode
	className?: string
}

interface StepProps {
	title: string
	children: ReactNode
	className?: string
}

export function Steps({ children, className }: StepsProps) {
	return (
		<div className={cn('relative my-8', className)}>
			{/* Vertical line */}
			<div className="absolute left-[15px] top-6 bottom-6 w-px bg-white/10" />
			<div className="space-y-6">{children}</div>
		</div>
	)
}

export function Step({ title, children, className }: StepProps) {
	return (
		<div className={cn('relative pl-10', className)}>
			{/* Step indicator */}
			<div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 bg-surface border border-white/10 text-sm font-mono text-white/60">
				<span className="step-number" />
			</div>

			{/* Content */}
			<div>
				<h4 className="font-semibold text-white mb-2">{title}</h4>
				<div className="text-sm text-white/50 [&>p]:mb-3 [&>pre]:my-3">{children}</div>
			</div>
		</div>
	)
}

// CSS for step numbers (add to globals.css or use counter)
// This uses CSS counters for automatic numbering
