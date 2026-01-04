'use client'

import { Wordmark } from '@/components/ui/logo'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useScrollPosition } from '@/hooks/use-scroll-position'
import { GITHUB_URL, INSTALL_COMMAND } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Book, Check, Code, Copy, Github, Menu, Play, Xmark } from 'iconoir-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

/**
 * StickyNav - Cloudflare Sandbox inspired sticky navigation
 *
 * Features:
 * - Vestig wordmark logo (left)
 * - Install command with copy button (center-right)
 * - GitHub icon (right)
 * - Blueprint border bottom
 * - Blur backdrop on scroll
 */

interface StickyNavProps {
	installCommand?: string
	githubUrl?: string
	className?: string
}

export function StickyNav({
	installCommand = INSTALL_COMMAND,
	githubUrl = GITHUB_URL,
	className,
}: StickyNavProps) {
	const { copied, copy } = useCopyToClipboard()
	const { isScrolled: scrolled } = useScrollPosition({ threshold: 20 })
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)

	const handleCopy = () => copy(installCommand)

	// Prevent rapid toggling during animation to avoid race conditions
	const handleToggleMenu = useCallback(() => {
		if (isAnimating) return
		setMobileMenuOpen((prev) => !prev)
	}, [isAnimating])

	const handleCloseMenu = useCallback(() => {
		if (isAnimating) return
		setMobileMenuOpen(false)
	}, [isAnimating])

	return (
		<>
			<nav
				className={cn(
					'fixed top-0 left-0 right-0 z-50',
					'transition-all duration-300',
					scrolled
						? 'bg-background/80 backdrop-blur-lg border-b border-brand/10'
						: 'bg-transparent',
					className,
				)}
			>
				<div className="container-wide">
					<div className="flex items-center justify-between h-16">
						{/* Left: Vestig Logo */}
						<div className="flex items-center gap-4">
							<Link
								href="/"
								className="flex items-center text-foreground hover:opacity-80 transition-opacity"
							>
								<Wordmark size="md" />
							</Link>

							{/* Desktop Nav Links */}
							<div className="hidden md:flex items-center gap-1 ml-6">
								<NavLink href="/docs" icon={<Book className="w-4 h-4" />}>
									Docs
								</NavLink>
								<NavLink href="/playground" icon={<Play className="w-4 h-4" />}>
									Playground
								</NavLink>
								<NavLink href="/docs/api" icon={<Code className="w-4 h-4" />}>
									API
								</NavLink>
							</div>
						</div>

						{/* Center-Right: Install Command */}
						<div className="hidden sm:flex items-center gap-4">
							<button
								type="button"
								onClick={handleCopy}
								aria-label={copied ? 'Copied to clipboard' : 'Copy install command'}
								className={cn(
									'flex items-center gap-3 px-4 py-2',
									'font-mono text-sm',
									'bg-surface border border-brand/20 rounded-full',
									'hover:border-brand/40 transition-all duration-200',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
									'group',
								)}
							>
								<span className="text-muted-foreground">$</span>
								<span className="text-foreground">{installCommand}</span>
								<span
									className={cn(
										'text-xs uppercase tracking-wider transition-colors',
										copied ? 'text-brand' : 'text-muted-foreground group-hover:text-brand',
									)}
								>
									{copied ? <Check className="w-4 h-4" /> : 'Copy'}
								</span>
							</button>

							{/* GitHub */}
							<a
								href={githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(
									'p-2 rounded-full',
									'text-muted-foreground hover:text-foreground',
									'hover:bg-brand/10 transition-all duration-200',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
								)}
								aria-label="View on GitHub"
							>
								<Github className="w-5 h-5" />
							</a>
						</div>

						{/* Mobile Menu Button */}
						<button
							type="button"
							onClick={handleToggleMenu}
							disabled={isAnimating}
							className="md:hidden p-2 text-foreground disabled:opacity-50"
							aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
							aria-expanded={mobileMenuOpen}
							aria-controls="sticky-nav-mobile-menu"
						>
							{mobileMenuOpen ? (
								<Xmark className="w-6 h-6" aria-hidden="true" />
							) : (
								<Menu className="w-6 h-6" aria-hidden="true" />
							)}
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile Menu */}
			<AnimatePresence onExitComplete={() => setIsAnimating(false)}>
				{mobileMenuOpen && (
					<motion.div
						id="sticky-nav-mobile-menu"
						className="fixed inset-0 z-40 md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onAnimationStart={() => setIsAnimating(true)}
						onAnimationComplete={() => setIsAnimating(false)}
					>
						{/* Backdrop */}
						<motion.div
							className="absolute inset-0 bg-background/95 backdrop-blur-lg"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={handleCloseMenu}
						/>

						{/* Menu Content */}
						<motion.div
							className="absolute top-16 left-0 right-0 p-4 space-y-4"
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.2 }}
						>
							{/* Install Command */}
							<button
								type="button"
								onClick={handleCopy}
								aria-label={copied ? 'Copied to clipboard' : 'Copy install command'}
								className={cn(
									'w-full flex items-center justify-between px-4 py-3',
									'font-mono text-sm',
									'bg-surface border border-brand/20',
									'hover:border-brand/40 transition-all duration-200',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
								)}
							>
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground">$</span>
									<span className="text-foreground">{installCommand}</span>
								</div>
								<span className="text-xs text-muted-foreground">
									{copied ? 'Copied!' : 'Tap to copy'}
								</span>
							</button>

							{/* Nav Links */}
							<div className="space-y-1">
								<MobileNavLink href="/docs" onClick={handleCloseMenu}>
									Documentation
								</MobileNavLink>
								<MobileNavLink href="/playground" onClick={handleCloseMenu}>
									Playground
								</MobileNavLink>
								<MobileNavLink href="/docs/api" onClick={handleCloseMenu}>
									API Reference
								</MobileNavLink>
								<MobileNavLink href={githubUrl} external onClick={handleCloseMenu}>
									GitHub
								</MobileNavLink>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Spacer */}
			<div className="h-16" />
		</>
	)
}

/**
 * Desktop Nav Link
 */
interface NavLinkProps {
	href: string
	icon?: React.ReactNode
	children: React.ReactNode
}

function NavLink({ href, icon, children }: NavLinkProps) {
	return (
		<Link
			href={href}
			className={cn(
				'flex items-center gap-1.5 px-3 py-2 text-sm',
				'text-muted-foreground hover:text-foreground',
				'hover:bg-brand/10 rounded transition-all duration-200',
			)}
		>
			{icon}
			{children}
		</Link>
	)
}

/**
 * Mobile Nav Link
 */
interface MobileNavLinkProps {
	href: string
	external?: boolean
	onClick?: () => void
	children: React.ReactNode
}

function MobileNavLink({ href, external, onClick, children }: MobileNavLinkProps) {
	const className = cn(
		'block w-full px-4 py-3 text-lg',
		'text-foreground hover:text-brand',
		'border-b border-brand/10',
		'transition-colors duration-200',
	)

	if (external) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
				onClick={onClick}
			>
				{children}
			</a>
		)
	}

	return (
		<Link href={href} className={className} onClick={onClick}>
			{children}
		</Link>
	)
}

export default StickyNav
