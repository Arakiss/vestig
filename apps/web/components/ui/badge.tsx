import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
	'inline-flex items-center border px-2.5 py-0.5 text-xs font-medium transition-colors',
	{
		variants: {
			variant: {
				default: 'border-white/20 bg-white/10 text-white',
				secondary: 'border-white/10 bg-white/5 text-white/70',
				outline: 'border-white/20 text-white bg-transparent',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
