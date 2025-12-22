import { LogProvider } from '@/lib/log-context'
import { getRequestContext } from '@vestig/next'
import { VestigProvider } from '@vestig/next/client'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google'
import './globals.css'

// Display font for headings and logo
const outfit = Outfit({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display',
	weight: ['400', '500', '600', '700'],
})

// Body font for text
const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
})

// Monospace font for code
const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-mono',
})

export const metadata: Metadata = {
	title: 'Vestig — Leave a trace',
	description:
		'A modern, runtime-agnostic structured logging library with automatic PII sanitization and context propagation.',
	icons: {
		icon: '/favicon.svg',
	},
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Get correlation context from middleware for client-side correlation
	const ctx = await getRequestContext()

	return (
		<html lang="en" className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
			<head>
				{/* LLM-friendly content discovery */}
				<link rel="llms" href="/llms.txt" />
				<link rel="llms-full" href="/llms-full.txt" />
			</head>
			<body className="min-h-screen bg-gray-950 font-sans antialiased">
				<VestigProvider initialContext={ctx} endpoint="/api/vestig" namespace="client">
					<LogProvider>{children}</LogProvider>
				</VestigProvider>
			</body>
		</html>
	)
}
