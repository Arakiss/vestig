import type { ReactNode } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// Site Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SiteMetadata {
	name: string
	tagline: string
	description: string
	url: string
	version: string
	repository: string
}

export interface SEOConfig {
	titleTemplate: string
	defaultTitle: string
	description: string
	keywords: string[]
	openGraph: {
		type: string
		locale: string
		siteName: string
	}
	twitter: {
		handle: string
		cardType: string
	}
}

export interface SocialLinks {
	github: string
	twitter?: string
	discord?: string
}

export interface SiteConfig {
	metadata: SiteMetadata
	seo: SEOConfig
	social: SocialLinks
}

// ═══════════════════════════════════════════════════════════════════════════
// Navigation Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NavLink {
	label: string
	href: string
	external?: boolean
	badge?: string
}

export interface NavSection {
	title: string
	links: NavLink[]
}

export interface NavigationConfig {
	header: NavLink[]
	footer: NavSection[]
}

// ═══════════════════════════════════════════════════════════════════════════
// Landing Page Types
// ═══════════════════════════════════════════════════════════════════════════

export interface HeroBadge {
	text: string
	href?: string
	variant?: 'new' | 'default'
}

export interface HeroCTA {
	text: string
	href: string
	variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

export interface CodeLine {
	content: string
	highlight?: boolean
	delay?: number
}

export interface HeroContent {
	badge?: HeroBadge
	headline: {
		primary: string
		secondary: string
	}
	subheadline: string
	ctas: {
		primary: HeroCTA
		secondary?: HeroCTA
	}
	installCommand: string
	codePreview?: {
		lines: CodeLine[]
		typingSpeed?: number
	}
}

export type FeatureIcon =
	| 'Package'
	| 'Layers'
	| 'Shield'
	| 'Activity'
	| 'Link'
	| 'Filter'
	| 'Zap'
	| 'Code'
	| 'Server'
	| 'Terminal'

export interface Feature {
	id: string
	icon: FeatureIcon
	title: string
	description: string
	highlight?: string
	link?: {
		text: string
		href: string
	}
}

export interface ComparisonRow {
	feature: string
	vestig: string | boolean
	pino?: string | boolean
	winston?: string | boolean
	bunyan?: string | boolean
}

export interface ComparisonConfig {
	title: string
	description: string
	rows: ComparisonRow[]
	footnote?: string
}

export interface DemoPreset {
	id: string
	label: string
	description: string
	code: string
}

export interface InteractiveDemoConfig {
	title: string
	description: string
	presets: DemoPreset[]
}

export interface PlaygroundEmbed {
	route: string
	title: string
	description: string
}

export interface DocsPreviewSection {
	id: string
	title: string
	description: string
	href: string
	icon: FeatureIcon
}

export interface FooterLink {
	label: string
	href: string
	external?: boolean
}

export interface FooterSection {
	title: string
	links: FooterLink[]
}

export interface FooterContent {
	sections: FooterSection[]
	copyright: string
	tagline: string
}

export interface LandingContent {
	hero: HeroContent
	features: Feature[]
	comparison: ComparisonConfig
	demo: InteractiveDemoConfig
	docsPreview: DocsPreviewSection[]
	playgrounds: PlaygroundEmbed[]
	footer: FooterContent
}

// ═══════════════════════════════════════════════════════════════════════════
// Documentation Types
// ═══════════════════════════════════════════════════════════════════════════

export type DocCategory = 'getting-started' | 'features' | 'api' | 'guides' | 'integrations'

export interface DocFrontmatter {
	title: string
	description: string
	order: number
	category: DocCategory
	keywords?: string[]
	since?: string
	toc?: boolean
	draft?: boolean
}

export interface DocPage {
	slug: string
	frontmatter: DocFrontmatter
	content: string
	headings: TableOfContentsItem[]
}

export interface TableOfContentsItem {
	id: string
	text: string
	level: number
}

export interface DocNavItem {
	title: string
	href: string
	order: number
	isNew?: boolean
}

export interface DocNavSection {
	category: DocCategory
	title: string
	items: DocNavItem[]
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM Context Types
// ═══════════════════════════════════════════════════════════════════════════

export interface LLMContext {
	overview: string
	apiReference: string
	perPage: Record<string, string>
}

// ═══════════════════════════════════════════════════════════════════════════
// Component Props Types (for content-driven components)
// ═══════════════════════════════════════════════════════════════════════════

export interface SectionProps {
	id?: string
	className?: string
	children: ReactNode
}

export interface ContainerProps {
	size?: 'narrow' | 'default' | 'wide'
	className?: string
	children: ReactNode
}
