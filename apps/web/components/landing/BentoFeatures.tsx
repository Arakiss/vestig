import { Container, Section } from '@/components/layout'
import type { Feature, FeatureIcon } from '@/lib/content/types'
import { cn } from '@/lib/utils'
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

interface BentoFeaturesProps {
	features: Feature[]
	title?: string
	description?: string
}

// Hardcoded bento layout with specific grid positions
// This creates true asymmetry
const bentoLayout: Record<
	string,
	{
		gridArea: string
		size: 'hero' | 'wide' | 'tall' | 'default'
	}
> = {
	'pii-sanitization': { gridArea: 'lg:col-span-2 lg:row-span-2', size: 'hero' },
	'zero-deps': { gridArea: 'lg:col-span-2', size: 'wide' },
	'native-tracing': { gridArea: '', size: 'default' },
	'multi-runtime': { gridArea: '', size: 'default' },
	'context-propagation': { gridArea: '', size: 'default' },
	'smart-sampling': { gridArea: '', size: 'default' },
	'type-safe': { gridArea: 'lg:col-span-2', size: 'wide' },
	'flexible-transports': { gridArea: '', size: 'default' },
}

// Order features for visual bento effect
const featureOrder = [
	'pii-sanitization',
	'zero-deps',
	'multi-runtime',
	'native-tracing',
	'context-propagation',
	'smart-sampling',
	'type-safe',
	'flexible-transports',
]

export function BentoFeatures({
	features,
	title = 'Everything You Need',
	description = 'A complete logging solution designed for modern TypeScript applications.',
}: BentoFeaturesProps) {
	// Sort features according to bento order
	const sortedFeatures = featureOrder
		.map((id) => features.find((f) => f.id === id))
		.filter((f): f is Feature => f !== undefined)

	return (
		<Section id="features" spacing="lg" divider>
			<Container>
				{/* Section header - offset to the left */}
				<div className="mb-12 lg:mb-16 max-w-xl">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
					<p className="mt-4 text-base text-white/50">{description}</p>
				</div>

				{/* True Bento Grid with explicit rows */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
					{sortedFeatures.map((feature) => {
						const Icon = iconMap[feature.icon]
						const layout = bentoLayout[feature.id] || { gridArea: '', size: 'default' }
						const isHero = layout.size === 'hero'
						const isWide = layout.size === 'wide'
						const isTall = layout.size === 'tall'
						const isLarge = isHero || isWide || isTall

						return (
							<div
								key={feature.id}
								className={cn(
									'group relative border border-white/[0.06] transition-all duration-300',
									'hover:border-white/15 hover:bg-white/[0.02]',
									layout.gridArea,
									isHero ? 'p-8 lg:p-10' : isWide ? 'p-6 lg:p-8' : 'p-5 lg:p-6',
								)}
							>
								{/* Decorative corner for hero card */}
								{isHero && (
									<>
										<div className="absolute top-0 right-0 w-24 h-24 border-l border-b border-white/[0.04]" />
										<div className="absolute bottom-0 left-0 w-16 h-16 border-r border-t border-white/[0.04]" />
									</>
								)}

								{/* Icon */}
								<div
									className={cn(
										'inline-flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors',
										isHero ? 'w-14 h-14' : isWide ? 'w-12 h-12' : 'w-10 h-10',
									)}
								>
									<Icon
										className={cn(
											'text-white',
											isHero ? 'h-7 w-7' : isWide ? 'h-6 w-6' : 'h-5 w-5',
										)}
									/>
								</div>

								{/* Badge */}
								{feature.highlight && (
									<span
										className={cn(
											'absolute px-2 py-0.5 text-[10px] uppercase tracking-wider bg-white/10 text-white/60',
											isHero ? 'top-8 right-8' : 'top-4 right-4',
										)}
									>
										{feature.highlight}
									</span>
								)}

								{/* Content */}
								<div className={cn(isHero ? 'mt-8' : isWide ? 'mt-5' : 'mt-4')}>
									<h3
										className={cn(
											'font-semibold text-white',
											isHero ? 'text-2xl' : isWide ? 'text-lg' : 'text-base',
										)}
									>
										{feature.title}
									</h3>
									<p
										className={cn(
											'text-white/60 leading-relaxed',
											isHero
												? 'mt-4 text-base max-w-sm'
												: isWide
													? 'mt-2 text-sm'
													: 'mt-2 text-sm line-clamp-2',
										)}
									>
										{feature.description}
									</p>
								</div>

								{/* Link - only on larger cards */}
								{feature.link && isLarge && (
									<Link
										href={feature.link.href}
										className={cn(
											'inline-flex items-center text-sm text-white/60 hover:text-white transition-colors group/link',
											isHero ? 'mt-8' : 'mt-4',
										)}
									>
										{feature.link.text}
										<ArrowRight className="ml-1.5 h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
									</Link>
								)}
							</div>
						)
					})}
				</div>
			</Container>
		</Section>
	)
}
