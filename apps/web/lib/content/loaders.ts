import { siteConfig, navigationConfig } from '@/content/site'
import {
	heroContent,
	features,
	comparisonConfig,
	interactiveDemoConfig,
	playgroundEmbeds,
	docsPreviewSections,
	footerContent,
} from '@/content/landing'
import type {
	SiteConfig,
	NavigationConfig,
	LandingContent,
	DocPage,
	DocNavSection,
	DocCategory,
} from './types'

// ═══════════════════════════════════════════════════════════════════════════
// Site Configuration Loaders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the site configuration
 */
export function getSiteConfig(): SiteConfig {
	return siteConfig
}

/**
 * Get navigation configuration
 */
export function getNavigationConfig(): NavigationConfig {
	return navigationConfig
}

// ═══════════════════════════════════════════════════════════════════════════
// Landing Page Loaders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all landing page content
 */
export function getLandingContent(): LandingContent {
	return {
		hero: heroContent,
		features,
		comparison: comparisonConfig,
		demo: interactiveDemoConfig,
		docsPreview: docsPreviewSections,
		playgrounds: playgroundEmbeds,
		footer: footerContent,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Documentation Loaders (Placeholder - will be enhanced with MDX)
// ═══════════════════════════════════════════════════════════════════════════

const categoryTitles: Record<DocCategory, string> = {
	'getting-started': 'Getting Started',
	features: 'Features',
	api: 'API Reference',
	guides: 'Guides',
	integrations: 'Integrations',
}

const categoryOrder: DocCategory[] = [
	'getting-started',
	'features',
	'api',
	'integrations',
	'guides',
]

/**
 * Get documentation navigation sections
 * This will be replaced with dynamic MDX loading
 */
export function getDocNavigation(): DocNavSection[] {
	return categoryOrder.map((category) => ({
		category,
		title: categoryTitles[category],
		items: [],
	}))
}

/**
 * Get a documentation page by slug
 * Placeholder for MDX implementation
 */
export async function getDocBySlug(slug: string): Promise<DocPage | null> {
	// This will be implemented with gray-matter + MDX
	console.log(`Loading doc: ${slug}`)
	return null
}

/**
 * Get all documentation slugs for static generation
 * Placeholder for MDX implementation
 */
export async function getAllDocSlugs(): Promise<string[]> {
	// This will scan content/docs directory
	return []
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get page metadata for SEO
 */
export function getPageMetadata(title?: string) {
	const { metadata, seo } = siteConfig

	return {
		title: title ? seo.titleTemplate.replace('%s', title) : seo.defaultTitle,
		description: seo.description,
		keywords: seo.keywords,
		openGraph: {
			...seo.openGraph,
			title: title || seo.defaultTitle,
			description: seo.description,
			url: metadata.url,
		},
		twitter: seo.twitter,
	}
}
