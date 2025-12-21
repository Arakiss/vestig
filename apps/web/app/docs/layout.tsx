'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
	{
		title: 'Getting Started',
		items: [
			{ title: 'Introduction', href: '/docs' },
			{ title: 'Installation', href: '/docs/getting-started' },
		],
	},
	{
		title: 'Features',
		items: [
			{ title: 'Log Levels', href: '/docs/features' },
			{ title: 'Sanitization', href: '/docs/features#sanitization' },
			{ title: 'Context', href: '/docs/features#context' },
			{ title: 'Child Loggers', href: '/docs/features#child-loggers' },
		],
	},
	{
		title: 'API Reference',
		items: [
			{ title: 'createLogger', href: '/docs/api' },
			{ title: 'log', href: '/docs/api#default-logger' },
			{ title: 'withContext', href: '/docs/api#context' },
			{ title: 'sanitize', href: '/docs/api#sanitize' },
		],
	},
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()

	return (
		<div className="docs-layout">
			<style>{`
				.docs-layout {
					min-height: 100vh;
					background: #0a0a0a;
					color: #fafafa;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				}

				.docs-nav {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					z-index: 100;
					background: rgba(10,10,10,0.9);
					backdrop-filter: blur(12px);
					border-bottom: 1px solid rgba(255,255,255,0.06);
				}

				.docs-nav-inner {
					max-width: 1400px;
					margin: 0 auto;
					padding: 1rem 2rem;
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				.docs-logo {
					font-size: 1.25rem;
					font-weight: 700;
					background: linear-gradient(135deg, #22d3ee, #a78bfa);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					text-decoration: none;
				}

				.docs-nav-links {
					display: flex;
					gap: 1.5rem;
					align-items: center;
				}

				.docs-nav-links a {
					color: #a3a3a3;
					text-decoration: none;
					font-size: 0.9375rem;
					transition: color 0.15s;
				}

				.docs-nav-links a:hover {
					color: #fafafa;
				}

				.docs-container {
					display: flex;
					max-width: 1400px;
					margin: 0 auto;
					padding-top: 64px;
				}

				.docs-sidebar {
					position: fixed;
					top: 64px;
					left: 0;
					bottom: 0;
					width: 280px;
					padding: 2rem;
					overflow-y: auto;
					border-right: 1px solid rgba(255,255,255,0.06);
				}

				@media (max-width: 1024px) {
					.docs-sidebar { display: none; }
					.docs-content { margin-left: 0 !important; }
				}

				.sidebar-section {
					margin-bottom: 2rem;
				}

				.sidebar-title {
					font-size: 0.75rem;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.1em;
					color: #525252;
					margin-bottom: 0.75rem;
				}

				.sidebar-links {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}

				.sidebar-link {
					display: block;
					padding: 0.5rem 0.75rem;
					border-radius: 6px;
					color: #a3a3a3;
					text-decoration: none;
					font-size: 0.9375rem;
					transition: all 0.15s;
				}

				.sidebar-link:hover {
					color: #fafafa;
					background: rgba(255,255,255,0.05);
				}

				.sidebar-link.active {
					color: #22d3ee;
					background: rgba(34,211,238,0.1);
				}

				.docs-content {
					flex: 1;
					margin-left: 280px;
					padding: 3rem 4rem;
					max-width: 900px;
				}

				.docs-content > :first-child {
					margin-top: 0 !important;
				}
			`}</style>

			<nav className="docs-nav">
				<div className="docs-nav-inner">
					<Link href="/" className="docs-logo">
						Vestig
					</Link>
					<div className="docs-nav-links">
						<Link href="/docs">Docs</Link>
						<Link href="/docs/api">API</Link>
						<a href="https://github.com/Arakiss/vestig" target="_blank" rel="noopener noreferrer">
							GitHub
						</a>
					</div>
				</div>
			</nav>

			<div className="docs-container">
				<aside className="docs-sidebar">
					{navigation.map((section) => (
						<div key={section.title} className="sidebar-section">
							<div className="sidebar-title">{section.title}</div>
							<div className="sidebar-links">
								{section.items.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
									>
										{item.title}
									</Link>
								))}
							</div>
						</div>
					))}
				</aside>
				<main className="docs-content">{children}</main>
			</div>
		</div>
	)
}
