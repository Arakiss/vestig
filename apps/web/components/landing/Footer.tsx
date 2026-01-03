'use client'

import { Container } from '@/components/layout'
import { Wordmark } from '@/components/ui/logo'
import { GITHUB_URL } from '@/lib/constants'
import type { FooterContent } from '@/lib/content/types'
import { cn } from '@/lib/utils'
import { Github, OpenNewWindow } from 'iconoir-react'
import Link from 'next/link'

/**
 * Footer - Cloudflare Sandbox inspired footer
 *
 * Features:
 * - Subtle blueprint grid pattern
 * - Brand color hover states
 * - Connection line decorations
 * - Corner markers
 */

interface FooterProps {
	content: FooterContent
}

export function Footer({ content }: FooterProps) {
	return (
		<footer className="relative border-t border-brand/10 bg-background">
			{/* Subtle blueprint grid background */}
			<div className="absolute inset-0 blueprint-grid-sparse opacity-30 pointer-events-none" />

			{/* Top decorative line */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />

			<Container className="py-16 md:py-20 relative">
				{/* Footer links grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
					{content.sections.map((section) => (
						<div key={section.title}>
							<h3 className="text-sm font-semibold text-foreground mb-4">{section.title}</h3>
							<ul className="space-y-3">
								{section.links.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											target={link.external ? '_blank' : undefined}
											rel={link.external ? 'noopener noreferrer' : undefined}
											className={cn(
												'text-sm text-muted-foreground',
												'hover:text-brand transition-colors',
												'focus-visible:outline-none focus-visible:text-brand focus-visible:underline',
												'inline-flex items-center gap-1',
											)}
										>
											{link.label}
											{link.external && <OpenNewWindow className="h-3 w-3" />}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Bottom section */}
				<div className="relative flex flex-col md:flex-row items-center justify-between pt-8 border-t border-brand/10">
					{/* Corner markers */}
					<div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-brand/30" />
					<div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-brand/30" />

					{/* Logo and tagline */}
					<div className="flex items-center gap-6 mb-4 md:mb-0">
						<Link
							href="/"
							className="hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
						>
							<Wordmark size="sm" className="text-foreground" />
						</Link>
						<span className="text-sm text-muted-foreground hidden sm:inline">
							{content.tagline}
						</span>
					</div>

					{/* Copyright and GitHub */}
					<div className="flex items-center gap-6 text-sm text-muted-foreground">
						<span>{content.copyright}</span>
						<Link
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-brand transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
							aria-label="GitHub"
						>
							<Github className="h-5 w-5" />
						</Link>
					</div>
				</div>
			</Container>
		</footer>
	)
}

export default Footer
