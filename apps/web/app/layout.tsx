import { LogProvider } from '@/lib/log-context'
import { getRequestContext } from '@vestig/next'
import { VestigProvider } from '@vestig/next/client'
import type { Metadata } from 'next'
import { Hanken_Grotesk, DM_Sans, JetBrains_Mono, Outfit } from 'next/font/google'
import './globals.css'

// Display font for headings
const hankenGrotesk = Hanken_Grotesk({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display',
	weight: ['400', '500', '600', '700', '800'],
})

// Body font for text
const dmSans = DM_Sans({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
	weight: ['400', '500', '600', '700'],
})

// Logo font (Outfit - reserved ONLY for the logo)
const outfit = Outfit({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-logo',
	weight: ['500', '600', '700'],
})

// Monospace font for code
const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-mono',
})

const siteUrl = 'https://vestig.dev'

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
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
	authors: [{ name: 'Arakiss', url: 'https://github.com/Arakiss' }],
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
		url: siteUrl,
		siteName: 'Vestig',
		title: 'Vestig — Zero-dependency TypeScript Logging',
		description:
			'Modern structured logging with automatic PII sanitization, native tracing, and multi-runtime support. Works everywhere.',
		images: [
			{
				url: '/og-image.png',
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
		images: ['/og-image.png'],
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
		canonical: siteUrl,
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
				{/* LLM-friendly content discovery */}
				<link rel="llms" href="/llms.txt" />
				<link rel="llms-full" href="/llms-full.txt" />
				{/* JSON-LD Structured Data */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'SoftwareApplication',
							name: 'Vestig',
							applicationCategory: 'DeveloperApplication',
							operatingSystem: 'Cross-platform',
							description:
								'Zero-dependency TypeScript logging library with automatic PII sanitization, native tracing, and multi-runtime support.',
							url: 'https://vestig.dev',
							downloadUrl: 'https://www.npmjs.com/package/vestig',
							softwareVersion: '0.8.0',
							author: {
								'@type': 'Person',
								name: 'Arakiss',
								url: 'https://github.com/Arakiss',
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
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'Organization',
							name: 'Vestig',
							url: 'https://vestig.dev',
							logo: 'https://vestig.dev/logo.svg',
							sameAs: ['https://github.com/Arakiss/vestig'],
						}),
					}}
				/>
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<VestigProvider initialContext={ctx} endpoint="/api/vestig" namespace="client">
					<LogProvider>{children}</LogProvider>
				</VestigProvider>
			</body>
		</html>
	)
}
