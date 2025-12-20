import type { Metadata } from 'next'
import { LogProvider } from '@/lib/log-context'
import { VestigProvider } from '@vestig/next/client'
import { getRequestContext } from '@vestig/next'
import './globals.css'

export const metadata: Metadata = {
	title: 'Vestig — Leave a trace',
	description:
		'A modern, runtime-agnostic structured logging library with automatic PII sanitization and context propagation.',
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Get correlation context from middleware for client-side correlation
	const ctx = await getRequestContext()

	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-950">
				<VestigProvider initialContext={ctx} endpoint="/api/vestig" namespace="client">
					<LogProvider>{children}</LogProvider>
				</VestigProvider>
			</body>
		</html>
	)
}
