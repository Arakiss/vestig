import { SkipLink } from '@/components/ui/skip-link'
import { GITHUB_AUTHOR_URL, GITHUB_URL, NPM_URL, SITE_URL } from '@/lib/constants'
import { LogProvider } from '@/lib/log-context'
import { getRequestContext } from '@vestig/next'
import { VestigProvider } from '@vestig/next/client'
import type { Metadata } from 'next'
import { DM_Sans, Hanken_Grotesk, JetBrains_Mono, Outfit } from 'next/font/google'
// Import version from vestig package for structured data
import { VERSION as VESTIG_VERSION } from 'vestig'
import './globals.css'

// Display font for headings (optimized: only essential weights)
const hankenGrotesk = Hanken_Grotesk({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display',
	weight: ['600', '700'], // Reduced from 5 weights to 2
})

// Body font for text (optimized: only essential weights)
const dmSans = DM_Sans({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
	weight: ['400', '500'], // Reduced from 4 weights to 2
})

// Logo font (Outfit - reserved ONLY for the logo)
const outfit = Outfit({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-logo',
	weight: ['600'], // Reduced from 3 weights to 1
})

// Monospace font for code (optimized: only essential weight)
const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-mono',
	weight: ['400'], // Explicitly set to avoid loading all weights
})

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
}

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: 'Vestig — Leave a trace',
		template: '%s | Vestig',
	},
	description:
		'Zero-dependency TypeScript logging library with automatic PII sanitization, native tracing, and multi-runtime support. Works in Node.js, Bun, Deno, Edge, and browsers.',
	keywords: [
		'typescript logging',
		'structured logging',
		'pii sanitization',
		'gdpr logging',
		'hipaa logging',
		'distributed tracing',
		'nodejs logging',
		'bun logging',
		'deno logging',
		'pino alternative',
		'winston alternative',
		'zero dependency logging',
		'observability',
		'context propagation',
	],
	authors: [{ name: 'Arakiss', url: GITHUB_AUTHOR_URL }],
	creator: 'Arakiss',
	publisher: 'Vestig',
	icons: {
		icon: '/favicon.svg',
		apple: '/favicon.svg',
	},
	manifest: '/manifest.json',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: SITE_URL,
		siteName: 'Vestig',
		title: 'Vestig — Zero-dependency TypeScript Logging',
		description:
			'Modern structured logging with automatic PII sanitization, native tracing, and multi-runtime support. Works everywhere.',
		images: [
			{
				url: '/og-image.svg',
				width: 1200,
				height: 630,
				alt: 'Vestig - Leave a trace. Zero-dependency TypeScript logging.',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Vestig — Zero-dependency TypeScript Logging',
		description:
			'Modern structured logging with automatic PII sanitization, native tracing, and multi-runtime support.',
		images: ['/og-image.svg'],
		creator: '@vestig_dev',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	alternates: {
		canonical: SITE_URL,
	},
	category: 'technology',
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Get correlation context from middleware for client-side correlation
	const ctx = await getRequestContext()

	return (
		<html
			lang="en"
			className={`${hankenGrotesk.variable} ${dmSans.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
		>
			<head>
				{/* RSS Feed for blog */}
				<link
					rel="alternate"
					type="application/rss+xml"
					title="Vestig Blog"
					href="/blog/feed.xml"
				/>
				{/* LLM-friendly content discovery */}
				<link rel="llms" href="/llms.txt" />
				<link rel="llms-full" href="/llms-full.txt" />
				{/* JSON-LD Structured Data - dangerouslySetInnerHTML is safe here as content is statically defined */}
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe, content is static
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'SoftwareApplication',
							name: 'Vestig',
							applicationCategory: 'DeveloperApplication',
							operatingSystem: 'Cross-platform',
							description:
								'Zero-dependency TypeScript logging library with automatic PII sanitization, native tracing, and multi-runtime support.',
							url: SITE_URL,
							downloadUrl: NPM_URL,
							softwareVersion: VESTIG_VERSION,
							author: {
								'@type': 'Person',
								name: 'Arakiss',
								url: GITHUB_AUTHOR_URL,
							},
							offers: {
								'@type': 'Offer',
								price: '0',
								priceCurrency: 'USD',
							},
							license: 'https://opensource.org/licenses/MIT',
							programmingLanguage: 'TypeScript',
							runtimePlatform: ['Node.js', 'Bun', 'Deno', 'Browser', 'Edge Runtime'],
						}),
					}}
				/>
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe, content is static
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'Organization',
							name: 'Vestig',
							url: SITE_URL,
							logo: `${SITE_URL}/logo.svg`,
							sameAs: [GITHUB_URL],
						}),
					}}
				/>
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<SkipLink />
				<VestigProvider initialContext={ctx} endpoint="/api/vestig" namespace="client">
					<LogProvider>{children}</LogProvider>
				</VestigProvider>
			</body>
		</html>
	)
}
