import type { SiteConfig } from '@/lib/content/types'

export const siteConfig: SiteConfig = {
	metadata: {
		name: 'Vestig',
		tagline: 'Zero-dependency TypeScript logging',
		description:
			'Structured logging for modern TypeScript applications with auto PII sanitization, native tracing, and multi-runtime support.',
		url: 'https://vestig.dev',
		version: '0.6.0',
		repository: 'https://github.com/Arakiss/vestig',
	},
	seo: {
		titleTemplate: '%s | Vestig',
		defaultTitle: 'Vestig - Zero-dependency TypeScript Logging',
		description:
			'Structured logging for modern TypeScript applications. Zero dependencies, auto PII sanitization, native tracing, works everywhere.',
		keywords: [
			'typescript',
			'logging',
			'structured logging',
			'pii sanitization',
			'tracing',
			'observability',
			'bun',
			'node',
			'edge',
			'deno',
		],
		openGraph: {
			type: 'website',
			locale: 'en_US',
			siteName: 'Vestig',
		},
		twitter: {
			handle: '@vestig_dev',
			cardType: 'summary_large_image',
		},
	},
	social: {
		github: 'https://github.com/Arakiss/vestig',
		twitter: 'https://twitter.com/vestig_dev',
	},
}
