import Link from 'next/link'
import { Github, OpenNewWindow } from 'iconoir-react'
import type { FooterContent } from '@/lib/content/types'
import { Container } from '@/components/layout'
import { Wordmark } from '@/components/ui/logo'

interface FooterProps {
	content: FooterContent
}

export function Footer({ content }: FooterProps) {
	return (
		<footer className="border-t border-white/10">
			<Container className="py-20">
				{/* Footer links grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
					{content.sections.map((section) => (
						<div key={section.title}>
							<h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
							<ul className="space-y-3">
								{section.links.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											target={link.external ? '_blank' : undefined}
											rel={link.external ? 'noopener noreferrer' : undefined}
											className="text-sm text-white/50 hover:text-white transition-colors inline-flex items-center gap-1"
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
				<div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
					{/* Logo and tagline */}
					<div className="flex items-center gap-6 mb-4 md:mb-0">
						<Link href="/">
							<Wordmark size="sm" className="text-white" />
						</Link>
						<span className="text-sm text-white/40 hidden sm:inline">{content.tagline}</span>
					</div>

					{/* Copyright and GitHub */}
					<div className="flex items-center gap-6 text-sm text-white/40">
						<span>{content.copyright}</span>
						<Link
							href="https://github.com/Arakiss/vestig"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-white transition-colors"
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
