import type { Metadata } from 'next'
import { ClientPageContent } from './client-page'

export const metadata: Metadata = {
	title: 'Client Components',
	description:
		'Browser-side logging with automatic PII sanitization and correlation context in React client components.',
}

export default function ClientDemoPage() {
	return <ClientPageContent />
}
