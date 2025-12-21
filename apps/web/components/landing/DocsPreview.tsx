import Link from 'next/link'
import {
	Package,
	MultiplePages as Layers,
	Shield,
	Activity,
	Link as LinkIcon,
	FilterList as Filter,
	Flash,
	Code,
	Server,
	Terminal,
	ArrowRight,
} from 'iconoir-react'
import type { DocsPreviewSection, FeatureIcon } from '@/lib/content/types'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Container, Section } from '@/components/layout'
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

interface DocsPreviewProps {
	sections: DocsPreviewSection[]
	title?: string
	description?: string
}

export function DocsPreview({
	sections,
	title = 'Dive Into the Docs',
	description = 'Comprehensive documentation to get you started quickly.',
}: DocsPreviewProps) {
	return (
		<Section id="docs-preview" spacing="lg" divider>
			<Container>
				{/* Section header */}
				<div className="text-center mb-20">
					<h2 className="text-4xl md:text-5xl font-bold text-white">{title}</h2>
					<p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto">{description}</p>
				</div>

				{/* Docs grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 max-w-4xl mx-auto">
					{sections.map((section) => {
						const Icon = iconMap[section.icon]

						return (
							<Link key={section.id} href={section.href} className="group">
								<Card className="bg-black border-0 p-6 h-full hover:bg-white/[0.02] transition-colors">
									<CardHeader className="p-0">
										<div className="flex items-center gap-4">
											<div className="p-2.5 border border-white/10 group-hover:border-white/20 transition-colors">
												<Icon className="h-5 w-5 text-white" />
											</div>
											<div className="flex-1">
												<CardTitle className="text-base flex items-center gap-2 text-white">
													{section.title}
													<ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
												</CardTitle>
												<CardDescription className="text-sm mt-1 text-white/50">
													{section.description}
												</CardDescription>
											</div>
										</div>
									</CardHeader>
								</Card>
							</Link>
						)
					})}
				</div>

				{/* View all docs link */}
				<div className="text-center mt-12">
					<Link
						href="/docs"
						className="inline-flex items-center text-white/70 hover:text-white transition-colors"
					>
						View all documentation
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</div>
			</Container>
		</Section>
	)
}
