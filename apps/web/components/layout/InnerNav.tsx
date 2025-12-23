'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, Xmark, OpenNewWindow } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'
import { Badge } from '@/components/ui/badge'
import { Container } from './Container'
import { cn } from '@/lib/utils'

interface NavLink {
	label: string
	href: string
	external?: boolean
}

interface InnerNavProps {
	section: string
	links?: NavLink[]
	showDevelopmentBadge?: boolean
}

export function InnerNav({ section, links = [], showDevelopmentBadge = false }: InnerNavProps) {
	const [isScrolled, setIsScrolled] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20)
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const defaultLinks: NavLink[] = [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Playground', href: '/playground' },
		{ label: 'GitHub', href: 'https://github.com/Arakiss/vestig', external: true },
	]

	const navLinks = links.length > 0 ? links : defaultLinks

	return (
		<header
			className={cn(
				'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
				isScrolled
					? 'bg-background/80 backdrop-blur-lg border-b border-white/6'
					: 'bg-background border-b border-white/6',
			)}
		>
			<Container size="wide">
				<nav className="flex items-center justify-between h-14">
					{/* Logo + Section */}
					<div className="flex items-center gap-3">
						<Link href="/">
							<Wordmark size="sm" className="text-foreground" />
						</Link>
						<span className="text-white/20">/</span>
						<span className="text-sm font-medium text-foreground">{section}</span>
						{showDevelopmentBadge && (
							<Badge
								variant="secondary"
								className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5"
							>
								Alpha
							</Badge>
						)}
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-6">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
								className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
							>
								{link.label}
								{link.external && <OpenNewWindow className="h-3 w-3" />}
							</Link>
						))}
						<Button asChild size="sm">
							<Link href="/docs/getting-started">Get Started</Link>
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<button
						className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						aria-label="Toggle menu"
					>
						{isMobileMenuOpen ? <Xmark className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</nav>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden py-4 border-t border-white/6 animate-slide-in-from-top">
						<div className="flex flex-col gap-3">
							{navLinks.map((link) => (
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
								<Link href="/docs/getting-started" onClick={() => setIsMobileMenuOpen(false)}>
									Get Started
								</Link>
							</Button>
						</div>
					</div>
				)}
			</Container>
		</header>
	)
}
