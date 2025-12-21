import { RefreshDouble } from 'iconoir-react'

import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
	return (
		<RefreshDouble
			role="status"
			aria-label="Loading"
			className={cn('size-4 animate-spin', className)}
			{...props}
		/>
	)
}

export { Spinner }
