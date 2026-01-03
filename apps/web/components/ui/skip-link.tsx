'use client'

import { cn } from '@/lib/utils'

interface SkipLinkProps {
	href?: string
	className?: string
}

/**
 * Skip Link - Accessibility navigation component
 *
 * Provides a hidden link that becomes visible on focus,
 * allowing keyboard users to skip directly to main content.
 */
export function SkipLink({ href = '#main-content', className }: SkipLinkProps) {
	return (
		<a
			href={href}
			className={cn(
				'sr-only focus:not-sr-only',
				'fixed top-2 left-2 z-[100]',
				'px-4 py-2 text-sm font-medium',
				'bg-brand text-white rounded-md',
				'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background',
				'transition-all duration-200',
				className,
			)}
		>
			Skip to main content
		</a>
	)
}
