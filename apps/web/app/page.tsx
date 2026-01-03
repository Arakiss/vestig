import {
	Comparison,
	FinalCTA,
	Footer,
	Hero,
	InteractiveExamples,
	InteractiveFeatures,
	StickyNav,
} from '@/components/landing'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { getLandingContent } from '@/lib/content'
import { Suspense } from 'react'

export const dynamic = 'force-static'

/**
 * Lightweight skeleton components for Suspense fallbacks
 */
function SectionSkeleton({ height = 'h-96' }: { height?: string }) {
	return (
		<div className={`${height} w-full bg-surface/50 animate-pulse`}>
			<div className="container-wide py-16">
				<div className="h-8 w-48 bg-white/5 rounded mb-8" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-32 bg-white/5 rounded-lg" />
					))}
				</div>
			</div>
		</div>
	)
}

/**
 * Landing Page - Cloudflare Sandbox Inspired Design
 *
 * New section order:
 * 1. StickyNav - Fixed navigation with install command
 * 2. Hero - Massive title with LineTitle effect
 * 3. InteractiveFeatures - Feature cards with visualizations
 * 4. InteractiveExamples - Tab-based code examples
 * 5. Comparison - Redesigned comparison table
 * 6. FinalCTA - Call to action with install command
 * 7. Footer - Updated with blueprint styling
 */
export default function LandingPage() {
	const content = getLandingContent()

	return (
		<>
			<StickyNav />
			<main id="main-content">
				{/* Above-the-fold: Hero loads immediately */}
				<Hero content={content.hero} />

				{/* Below-the-fold: Wrapped in Suspense for progressive loading */}
				<Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
					<InteractiveFeatures />
				</Suspense>

				<Suspense fallback={<SectionSkeleton height="h-[500px]" />}>
					<InteractiveExamples />
				</Suspense>

				<Suspense fallback={<SectionSkeleton height="h-[400px]" />}>
					<Comparison config={content.comparison} />
				</Suspense>

				<FinalCTA />
			</main>
			<Footer content={content.footer} />
			<ScrollToTop />
		</>
	)
}
