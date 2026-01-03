import { Container, Section } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Feature, FeatureIcon } from '@/lib/content/types'
import {
	Activity,
	ArrowRight,
	Code,
	FilterList as Filter,
	Flash,
	MultiplePages as Layers,
	Link as LinkIcon,
	Package,
	Server,
	Shield,
	Terminal,
} from 'iconoir-react'
import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const iconMap: Record<FeatureIcon, IconComponent> = {
	Package,
	Layers,
	Shield,
	Activity,
	Link: LinkIcon,
	Filter,
	Zap: Flash,
	Code,
	Server,
	Terminal,
}

interface FeaturesProps {
	features: Feature[]
	title?: string
	description?: string
}

export function Features({
	features,
	title = 'Everything You Need',
	description = 'A complete logging solution designed for modern TypeScript applications.',
}: FeaturesProps) {
	return (
		<Section id="features" spacing="lg" divider>
			<Container>
				{/* Section header */}
				<div className="text-center mb-20">
					<h2 className="text-4xl md:text-5xl font-bold text-white">{title}</h2>
					<p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto">{description}</p>
				</div>

				{/* Features grid - Vercel style */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
					{features.map((feature) => {
						const Icon = iconMap[feature.icon]

						return (
							<Card
								key={feature.id}
								className="bg-black border-0 p-8 group hover:bg-white/[0.02] transition-colors"
							>
								<CardHeader className="p-0 pb-4">
									<div className="flex items-start justify-between">
										<div className="p-2.5 border border-white/10 group-hover:border-white/20 transition-colors">
											<Icon className="h-5 w-5 text-white" />
										</div>
										{feature.highlight && (
											<Badge variant="secondary" className="text-xs">
												{feature.highlight}
											</Badge>
										)}
									</div>
									<CardTitle className="text-lg mt-6 text-white">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									<CardDescription className="text-sm leading-relaxed text-white/50">
										{feature.description}
									</CardDescription>
									{feature.link && (
										<Link
											href={feature.link.href}
											className="inline-flex items-center text-sm text-white/70 hover:text-white mt-6 transition-colors group/link"
										>
											{feature.link.text}
											<ArrowRight className="ml-1.5 h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
										</Link>
									)}
								</CardContent>
							</Card>
						)
					})}
				</div>
			</Container>
		</Section>
	)
}
