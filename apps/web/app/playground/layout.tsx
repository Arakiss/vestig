import { LogPanel } from '@/app/components/log-panel'
import Link from 'next/link'

/**
 * Navigation items for the playground sidebar
 */
const navItems = [
	{ href: '/playground', label: 'Overview', icon: '🏠' },
	{ href: '/playground/server', label: 'Server Components', icon: '🖥️' },
	{ href: '/playground/client', label: 'Client Components', icon: '💻' },
	{ href: '/playground/api-routes', label: 'API Routes', icon: '🔌' },
	{ href: '/playground/edge', label: 'Edge Runtime', icon: '⚡' },
	{ href: '/playground/actions', label: 'Server Actions', icon: '🎬' },
	{ href: '/playground/sanitization', label: 'PII Sanitization', icon: '🔒' },
	{ href: '/playground/transports', label: 'Transports', icon: '📡' },
]

export default function PlaygroundLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="bg-gray-900 border-b border-white/10">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2 group">
						<span className="text-2xl">👣</span>
						<span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
							Vestig
						</span>
						<span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
							Playground
						</span>
					</Link>
					<nav className="flex items-center gap-4">
						<Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
							Docs
						</Link>
						<a
							href="https://github.com/Arakiss/vestig"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-gray-400 hover:text-white transition-colors"
						>
							GitHub
						</a>
					</nav>
				</div>
			</header>

			{/* Main content with sidebar */}
			<div className="flex-1 flex">
				{/* Sidebar */}
				<aside className="w-64 bg-gray-900/50 border-r border-white/10 hidden md:block">
					<nav className="p-4">
						<ul className="space-y-1">
							{navItems.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
									>
										<span>{item.icon}</span>
										<span>{item.label}</span>
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</aside>

				{/* Page content */}
				<main className="flex-1 p-6 pb-48 overflow-auto">{children}</main>
			</div>

			{/* Log panel at bottom */}
			<LogPanel />
		</div>
	)
}
