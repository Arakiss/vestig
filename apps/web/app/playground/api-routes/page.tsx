import type { Metadata } from 'next'
import { ApiRoutesClient } from './api-routes-client'

export const metadata: Metadata = {
	title: 'API Routes',
	description:
		'Request lifecycle logging with correlation IDs and full request tracing in Next.js API routes.',
}

export default function ApiRoutesPage() {
	return <ApiRoutesClient />
}
