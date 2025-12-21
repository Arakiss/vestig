import type { SectionProps } from '@/lib/content/types'
import { cn } from '@/lib/utils'

interface ExtendedSectionProps extends SectionProps {
	/**
	 * Spacing variant for the section
	 */
	spacing?: 'sm' | 'md' | 'lg' | 'xl'
	/**
	 * Whether to add a subtle top border
	 */
	divider?: boolean
}

const spacingClasses = {
	sm: 'py-12 md:py-16',
	md: 'py-16 md:py-24',
	lg: 'py-24 md:py-32',
	xl: 'py-32 md:py-40',
}

export function Section({
	id,
	className,
	children,
	spacing = 'md',
	divider = false,
}: ExtendedSectionProps) {
	return (
		<section
			id={id}
			className={cn(spacingClasses[spacing], divider && 'border-t border-white/6', className)}
		>
			{children}
		</section>
	)
}
