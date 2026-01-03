import { ArrowRight, Book, Home, Play } from 'iconoir-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Page Not Found',
	description: 'The page you are looking for does not exist or has been moved.',
	robots: {
		index: false,
		follow: false,
	},
}

export default function NotFound() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-6">
			<div className="text-center max-w-lg">
				{/* 404 Visual */}
				<div className="mb-8">
					<div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6">
						<span className="text-4xl font-bold text-orange-500 font-mono">404</span>
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Page not found</h1>
					<p className="text-lg text-white/60">
						The page you're looking for doesn't exist or has been moved. Let's get you back on
						track.
					</p>
				</div>

				{/* Log visualization */}
				<div className="mb-10 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] font-mono text-sm text-left">
					<div className="flex items-center gap-2 text-red-400 mb-1">
						<span className="text-white/30">[ERROR]</span>
						<span>Route not found</span>
					</div>
					<div className="flex items-center gap-2 text-white/40">
						<span className="text-white/30">[INFO]</span>
						<span>Redirecting to available pages...</span>
					</div>
				</div>

				{/* Quick links */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
					<Link
						href="/"
						className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
					>
						<Home className="h-4 w-4 text-orange-400" />
						<span className="text-sm font-medium">Home</span>
					</Link>
					<Link
						href="/docs"
						className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
					>
						<Book className="h-4 w-4 text-orange-400" />
						<span className="text-sm font-medium">Docs</span>
					</Link>
					<Link
						href="/playground"
						className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
					>
						<Play className="h-4 w-4 text-orange-400" />
						<span className="text-sm font-medium">Playground</span>
					</Link>
				</div>

				{/* CTA */}
				<Link
					href="/docs/getting-started"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors group"
				>
					Get Started
					<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
				</Link>
			</div>
		</div>
	)
}
