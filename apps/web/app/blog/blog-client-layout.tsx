'use client'

import { InnerNav } from '@/components/layout'
import { ArrowLeft } from 'iconoir-react'
import Link from 'next/link'

export function BlogClientLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<InnerNav section="Blog" />

			{/* Main content */}
			<main className="pt-14">
				<div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
					{/* Back to blog link */}
					<Link
						href="/blog"
						className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Blog
					</Link>

					{/* Article content */}
					<article className="prose prose-invert prose-orange max-w-none">{children}</article>

					{/* Footer */}
					<footer className="mt-16 pt-8 border-t border-white/[0.06]">
						<p className="text-sm text-white/30">
							© {new Date().getFullYear()} Vestig. Open source under MIT License.
						</p>
					</footer>
				</div>
			</main>
		</div>
	)
}
