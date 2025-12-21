import type { ContainerProps } from '@/lib/content/types'
import { cn } from '@/lib/utils'

const sizeClasses = {
	narrow: 'max-w-3xl',
	default: 'max-w-5xl',
	wide: 'max-w-7xl',
}

export function Container({ size = 'default', className, children }: ContainerProps) {
	return (
		<div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
			{children}
		</div>
	)
}
