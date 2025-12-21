'use client'

import Link from 'next/link'
import { ArrowRight, Copy, Check, Terminal } from 'iconoir-react'
import { useState } from 'react'
import type { HeroContent } from '@/lib/content/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout'
import { AnimatedLogs } from './AnimatedLogs'

interface HeroProps {
	content: HeroContent
}

export function Hero({ content }: HeroProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(content.installCommand)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<section className="relative pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden">
			{/* Background grid - asymmetric */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[30%] left-0 w-full h-px bg-white/[0.03]" />
				<div className="absolute top-[70%] left-0 w-full h-px bg-white/[0.03]" />
				<div className="absolute top-0 left-[35%] w-px h-full bg-white/[0.03]" />
			</div>

			<Container size="default" className="relative">
				{/* Asymmetric grid: 5fr + 7fr */}
				<div className="grid lg:grid-cols-12 gap-8 lg:gap-4">
					{/* Left column: 5/12 - text, offset upward */}
					<div className="lg:col-span-5 lg:pr-4">
						{/* Badge */}
						{content.badge && (
							<div className="mb-5">
								<Link href={content.badge.href || '#'}>
									<Badge
										variant="outline"
										className="px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
									>
										{content.badge.text}
										<ArrowRight className="ml-1.5 h-3 w-3" />
									</Badge>
								</Link>
							</div>
						)}

						{/* Headline */}
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
							{content.headline.primary}
						</h1>
						<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white/40 mt-1 leading-[1.1]">
							{content.headline.secondary}
						</h2>

						{/* Subheadline */}
						<p className="mt-5 text-base text-white/50 leading-relaxed">{content.subheadline}</p>

						{/* CTAs */}
						<div className="mt-6 flex flex-col sm:flex-row gap-3">
							<Button asChild>
								<Link href={content.ctas.primary.href}>
									{content.ctas.primary.text}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							{content.ctas.secondary && (
								<Button asChild variant="outline">
									<Link href={content.ctas.secondary.href}>{content.ctas.secondary.text}</Link>
								</Button>
							)}
						</div>

						{/* Install command */}
						<div className="mt-6">
							<div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 text-sm">
								<Terminal className="h-3.5 w-3.5 text-white/40" />
								<code className="font-mono text-white text-sm">{content.installCommand}</code>
								<button
									onClick={handleCopy}
									className="text-white/40 hover:text-white transition-colors"
									aria-label="Copy"
								>
									{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
								</button>
							</div>
						</div>
					</div>

					{/* Right column: 7/12 - terminal, offset downward */}
					<div className="lg:col-span-7 lg:mt-12 relative">
						{/* Decorative elements - asymmetric placement */}
						<div className="absolute -top-6 right-12 w-32 h-32 border border-white/[0.04]" />
						<div className="absolute bottom-8 -left-6 w-20 h-20 border border-white/[0.04]" />
						<div className="absolute top-1/2 -right-4 w-2 h-16 bg-white/[0.03]" />

						{/* Terminal */}
						<div className="relative bg-black/40 backdrop-blur-sm border border-white/10">
							<AnimatedLogs />
						</div>

						{/* Stats - offset to the right */}
						<div className="mt-8 flex gap-10 justify-end pr-4">
							<div className="text-right">
								<div className="text-xl font-semibold text-white">0</div>
								<div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
									Deps
								</div>
							</div>
							<div className="text-right">
								<div className="text-xl font-semibold text-white">&lt;5KB</div>
								<div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
									Gzipped
								</div>
							</div>
							<div className="text-right">
								<div className="text-xl font-semibold text-white">TS</div>
								<div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
									Native
								</div>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</section>
	)
}
