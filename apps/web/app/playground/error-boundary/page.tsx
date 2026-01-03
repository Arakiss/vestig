import type { Metadata } from 'next'
import { ErrorBoundaryClient } from './error-boundary-client'

export const metadata: Metadata = {
	title: 'Error Boundary',
	description:
		'Enhanced error handling with breadcrumb trails, error fingerprinting, and stack trace parsing.',
}

export default function ErrorBoundaryPage() {
	return <ErrorBoundaryClient />
}
