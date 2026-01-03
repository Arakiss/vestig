'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Xmark, OpenNewWindow } from 'iconoir-react'
import type { NavLink } from '@/lib/content/types'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'
import { Container } from '@/components/layout'
import { cn } from '@/lib/utils'

interface NavbarProps {
	links: NavLink[]
	ctaLabel?: string
	ctaHref?: string
}

export function Navbar({
	links,
	ctaLabel = 'Get Started',
	ctaHref = '/docs/getting-started',
}: NavbarProps) {
	const [isScrolled, setIsScrolled] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20)
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	return (
		<header
			className={cn(
				'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
				isScrolled ? 'bg-background/80 backdrop-blur-lg border-b border-white/6' : 'bg-transparent',
			)}
		>
			<Container>
				<nav className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/">
						<Wordmark size="md" className="text-foreground" />
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-8">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
								className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
							>
								{link.label}
								{link.external && <OpenNewWindow className="h-3 w-3" />}
								{link.badge && (
									<span className="ml-1 px-1.5 py-0.5 text-xs bg-white/10 text-white/70">
										{link.badge}
									</span>
								)}
							</Link>
						))}
						<Button asChild size="sm">
							<Link href={ctaHref}>{ctaLabel}</Link>
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<button
						className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
						aria-expanded={isMobileMenuOpen}
						aria-controls="mobile-navigation-menu"
					>
						{isMobileMenuOpen ? <Xmark className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</nav>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<nav
						id="mobile-navigation-menu"
						className="md:hidden py-4 border-t border-white/6 animate-slide-in-from-top"
						aria-label="Mobile navigation"
					>
						<div className="flex flex-col gap-4">
							{links.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noopener noreferrer' : undefined}
									className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
									onClick={() => setIsMobileMenuOpen(false)}
								>
									{link.label}
									{link.external && <OpenNewWindow className="inline ml-1 h-3 w-3" />}
								</Link>
							))}
							<Button asChild size="sm" className="mt-2">
								<Link href={ctaHref} onClick={() => setIsMobileMenuOpen(false)}>
									{ctaLabel}
								</Link>
							</Button>
						</div>
					</nav>
				)}
			</Container>
		</header>
	)
}
