import { cn } from '@/lib/utils'
import {
	InfoCircle,
	WarningTriangle,
	WarningCircle,
	CheckCircle,
	LightBulb,
	Flash,
} from 'iconoir-react'
import type { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'tip' | 'note'

interface CalloutProps {
	type?: CalloutType
	title?: string
	children: ReactNode
	className?: string
}

const calloutConfig: Record<
	CalloutType,
	{
		icon: typeof InfoCircle
		borderClass: string
		bgClass: string
		iconClass: string
	}
> = {
	info: {
		icon: InfoCircle,
		borderClass: 'border-l-white/30',
		bgClass: 'bg-white/[0.02]',
		iconClass: 'text-white/60',
	},
	warning: {
		icon: WarningTriangle,
		borderClass: 'border-l-yellow-500/50',
		bgClass: 'bg-yellow-500/[0.03]',
		iconClass: 'text-yellow-500/70',
	},
	error: {
		icon: WarningCircle,
		borderClass: 'border-l-red-500/50',
		bgClass: 'bg-red-500/[0.03]',
		iconClass: 'text-red-500/70',
	},
	success: {
		icon: CheckCircle,
		borderClass: 'border-l-green-500/50',
		bgClass: 'bg-green-500/[0.03]',
		iconClass: 'text-green-500/70',
	},
	tip: {
		icon: LightBulb,
		borderClass: 'border-l-white/20',
		bgClass: 'bg-white/[0.02]',
		iconClass: 'text-white/50',
	},
	note: {
		icon: Flash,
		borderClass: 'border-l-white/20',
		bgClass: 'bg-white/[0.02]',
		iconClass: 'text-white/50',
	},
}

export function Callout({ type = 'info', title, children, className }: CalloutProps) {
	const config = calloutConfig[type]
	const Icon = config.icon

	return (
		<div
			className={cn(
				'relative p-4 my-6 border border-white/[0.06] border-l-2',
				config.borderClass,
				config.bgClass,
				className,
			)}
		>
			<div className="flex gap-3">
				<Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconClass)} />
				<div className="flex-1 min-w-0">
					{title && <div className="font-semibold text-white mb-1">{title}</div>}
					<div className="text-sm text-white/60 leading-relaxed [&>p]:m-0">{children}</div>
				</div>
			</div>
		</div>
	)
}
