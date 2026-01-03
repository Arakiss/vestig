import type { Metadata } from 'next'
import { DevOverlayClient } from './dev-overlay-client'

export const metadata: Metadata = {
	title: 'Dev Overlay',
	description:
		'Real-time log viewer with filtering, search, and live streaming for development debugging.',
}

export default function DevOverlayPage() {
	return <DevOverlayClient />
}
