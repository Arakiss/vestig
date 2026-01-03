import type { Metadata } from 'next'
import { WebVitalsClient } from './web-vitals-client'

export const metadata: Metadata = {
	title: 'Web Vitals',
	description:
		'Core Web Vitals monitoring with LCP, CLS, INP, TTFB, and FCP tracking in real-time.',
}

export default function WebVitalsPage() {
	return <WebVitalsClient />
}
