import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-white text-black hover:bg-white/90',
				destructive: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
				outline: 'border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/30',
				secondary: 'bg-white/10 text-white hover:bg-white/15',
				ghost: 'hover:bg-white/10',
				link: 'text-white underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-5 py-2',
				sm: 'h-9 px-4 text-xs',
				lg: 'h-11 px-8',
				xl: 'h-12 px-10',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
		)
	},
)
Button.displayName = 'Button'

export { Button, buttonVariants }
