import { getLandingContent, getNavigationConfig } from '@/lib/content'
import { Navbar, Hero, BentoFeatures, Comparison, DocsPreview, Footer } from '@/components/landing'

export const dynamic = 'force-static'

export default function LandingPage() {
	const content = getLandingContent()
	const navigation = getNavigationConfig()

	return (
		<>
			<Navbar links={navigation.header} />
			<main>
				<Hero content={content.hero} />
				<BentoFeatures features={content.features} />
				<Comparison config={content.comparison} />
				<DocsPreview sections={content.docsPreview} />
			</main>
			<Footer content={content.footer} />
		</>
	)
}
