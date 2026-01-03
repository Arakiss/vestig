import { InnerNav, Sidebar, type SidebarSection } from '@/components/layout'
import { VestigDevOverlay } from '@vestig/next/dev'
import { VestigMetrics } from '@vestig/next/metrics'
import {
	Antenna,
	DatabaseScript,
	Flash,
	GraphUp,
	HomeSimple,
	Laptop,
	Lock,
	MediaVideo,
	PlugTypeA,
	Server,
	ViewGrid,
	WarningTriangle,
} from 'iconoir-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Vestig Playground',
		default: 'Playground',
	},
	description:
		'Interactive playground to explore vestig logging capabilities across Next.js runtimes.',
	openGraph: {
		title: 'Vestig Playground',
		description: 'Interactive demos for vestig logging library',
		type: 'website',
	},
}

const navigation: SidebarSection[] = [
	{
		title: 'New in v0.8',
		items: [
			{
				title: 'Dev Overlay',
				href: '/playground/dev-overlay',
				icon: <ViewGrid className="h-4 w-4" />,
				badge: 'New',
			},
			{
				title: 'Web Vitals',
				href: '/playground/web-vitals',
				icon: <GraphUp className="h-4 w-4" />,
				badge: 'New',
			},
			{
				title: 'Error Boundary',
				href: '/playground/error-boundary',
				icon: <WarningTriangle className="h-4 w-4" />,
				badge: 'New',
			},
			{
				title: 'Database Logging',
				href: '/playground/database',
				icon: <DatabaseScript className="h-4 w-4" />,
				badge: 'New',
			},
		],
	},
	{
		title: 'Core Demos',
		items: [
			{ title: 'Overview', href: '/playground', icon: <HomeSimple className="h-4 w-4" /> },
			{
				title: 'Server Components',
				href: '/playground/server',
				icon: <Server className="h-4 w-4" />,
			},
			{
				title: 'Client Components',
				href: '/playground/client',
				icon: <Laptop className="h-4 w-4" />,
			},
			{
				title: 'API Routes',
				href: '/playground/api-routes',
				icon: <PlugTypeA className="h-4 w-4" />,
			},
			{ title: 'Edge Runtime', href: '/playground/edge', icon: <Flash className="h-4 w-4" /> },
			{
				title: 'Server Actions',
				href: '/playground/actions',
				icon: <MediaVideo className="h-4 w-4" />,
			},
		],
	},
	{
		title: 'Advanced',
		items: [
			{
				title: 'PII Sanitization',
				href: '/playground/sanitization',
				icon: <Lock className="h-4 w-4" />,
			},
			{
				title: 'Transports',
				href: '/playground/transports',
				icon: <Antenna className="h-4 w-4" />,
			},
		],
	},
]

export default function PlaygroundLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-screen bg-background">
			<InnerNav section="Playground" />
			<Sidebar sections={navigation} />

			{/* Main content */}
			<main className="lg:pl-64 pt-14">
				<div className="p-6">{children}</div>
			</main>

			{/* Web Vitals collection */}
			<VestigMetrics debug />

			{/* Dev Overlay replaces LogPanel */}
			<VestigDevOverlay position="bottom-right" />
		</div>
	)
}
