'use client'

import { Wordmark } from '@/components/ui/logo'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Book, Check, Code, Copy, Github, Menu, Play, Xmark } from 'iconoir-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

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
	installCommand = 'bun add vestig',
	githubUrl = 'https://github.com/Arakiss/vestig',
	className,
}: StickyNavProps) {
	const [copied, setCopied] = useState(false)
	const [scrolled, setScrolled] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20)
		}
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(installCommand)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			// Clipboard API may fail in some contexts
			console.warn('Failed to copy to clipboard')
		}
	}, [installCommand])

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
								)}
								aria-label="View on GitHub"
							>
								<Github className="w-5 h-5" />
							</a>
						</div>

						{/* Mobile Menu Button */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="md:hidden p-2 text-foreground"
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? <Xmark className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile Menu */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						className="fixed inset-0 z-40 md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						{/* Backdrop */}
						<motion.div
							className="absolute inset-0 bg-background/95 backdrop-blur-lg"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setMobileMenuOpen(false)}
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
								<MobileNavLink href="/docs" onClick={() => setMobileMenuOpen(false)}>
									Documentation
								</MobileNavLink>
								<MobileNavLink href="/playground" onClick={() => setMobileMenuOpen(false)}>
									Playground
								</MobileNavLink>
								<MobileNavLink href="/docs/api" onClick={() => setMobileMenuOpen(false)}>
									API Reference
								</MobileNavLink>
								<MobileNavLink href={githubUrl} external onClick={() => setMobileMenuOpen(false)}>
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
