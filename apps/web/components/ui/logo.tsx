import { cn } from '@/lib/utils'

interface LogoIconProps {
	size?: number
	className?: string
}

/**
 * Vestig Logo Icon - Trail 2-Step
 * Ghost/trace (left) + Solid (right) = "la marca que dejas"
 */
export function LogoIcon({ size = 32, className }: LogoIconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			fill="none"
			width={size}
			height={size}
			className={className}
		>
			{/* Ghost/trace - the mark left behind */}
			<rect x="3" y="9" width="11" height="14" fill="currentColor" fillOpacity="0.3" />
			{/* Solid - the current state */}
			<rect x="17" y="7" width="13" height="18" fill="currentColor" />
		</svg>
	)
}

interface WordmarkProps {
	size?: 'sm' | 'md' | 'lg' | 'xl'
	className?: string
	iconClassName?: string
	textClassName?: string
}

const wordmarkSizes = {
	sm: { icon: 20, text: 'text-base', gap: 'gap-2' },
	md: { icon: 28, text: 'text-xl', gap: 'gap-2.5' },
	lg: { icon: 36, text: 'text-2xl', gap: 'gap-3' },
	xl: { icon: 48, text: 'text-4xl', gap: 'gap-3.5' },
}

/**
 * Vestig Wordmark - Logo icon + "vestig" text
 * Uses Outfit font via font-display class
 */
export function Wordmark({ size = 'md', className, iconClassName, textClassName }: WordmarkProps) {
	const config = wordmarkSizes[size]

	return (
		<div className={cn('flex items-center', config.gap, className)}>
			<LogoIcon size={config.icon} className={cn('translate-y-[1px]', iconClassName)} />
			<span
				className={cn(
					'font-display font-semibold tracking-tight leading-none',
					config.text,
					textClassName,
				)}
			>
				vestig
			</span>
		</div>
	)
}

interface BannerProps {
	className?: string
}

/**
 * Vestig Banner - For README and marketing use
 * Dark background with logo, wordmark, tagline, and feature pills
 */
export function Banner({ className }: BannerProps) {
	return (
		<div className={cn('relative w-full bg-[#0a0a0a] py-16 px-8 overflow-hidden', className)}>
			{/* Subtle grid lines */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-1/4 left-0 right-0 h-px bg-white/[0.03]" />
				<div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.03]" />
				<div className="absolute top-3/4 left-0 right-0 h-px bg-white/[0.03]" />
			</div>

			{/* Content */}
			<div className="relative flex flex-col items-center gap-6">
				{/* Logo + Wordmark */}
				<div className="flex items-center gap-3">
					<LogoIcon size={52} className="text-white translate-y-[2px]" />
					<span className="font-display font-semibold text-white text-5xl tracking-tight leading-none">
						vestig
					</span>
				</div>

				{/* Tagline */}
				<span className="font-display text-sm font-normal tracking-[0.25em] text-neutral-500 uppercase">
					Leave a trace
				</span>

				{/* Feature pills - Lyra preset (sharp) */}
				<div className="flex gap-2 mt-4">
					<span className="px-4 py-1.5 border border-white/10 bg-white/5 text-white/50 text-xs font-medium">
						Runtime Agnostic
					</span>
					<span className="px-4 py-1.5 border border-white/10 bg-white/5 text-white/50 text-xs font-medium">
						PII Sanitization
					</span>
					<span className="px-4 py-1.5 border border-white/10 bg-white/5 text-white/50 text-xs font-medium">
						Zero Dependencies
					</span>
				</div>
			</div>
		</div>
	)
}

// Legacy exports for backwards compatibility
export function Logo({
	variant = 'icon',
	size = 'md',
	className,
}: {
	variant?: 'icon' | 'wordmark'
	size?: 'sm' | 'md' | 'lg'
	className?: string
}) {
	if (variant === 'wordmark') {
		return <Wordmark size={size} className={className} />
	}

	const iconSizes = { sm: 24, md: 32, lg: 48 }
	return <LogoIcon size={iconSizes[size]} className={className} />
}
