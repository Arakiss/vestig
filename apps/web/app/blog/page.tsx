import { type BlogCategory, blogPosts } from '@/lib/blog-manifest'
import { ArrowRight, Calendar, Clock } from 'iconoir-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Blog',
	description: 'Updates, release notes, tutorials, and insights about Vestig logging library.',
}

const categoryColors: Record<BlogCategory, string> = {
	Release: 'bg-green-500/10 text-green-400 border-green-500/20',
	Tutorial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
	Comparison: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
	Update: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function BlogPage() {
	const featuredPosts = blogPosts.filter((p) => p.featured)
	const otherPosts = blogPosts.filter((p) => !p.featured)

	return (
		<div className="min-h-screen bg-background pt-14">
			<div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
				{/* Header */}
				<div className="mb-12">
					<h1 className="text-4xl font-bold tracking-tight text-white mb-4">Blog</h1>
					<p className="text-lg text-white/60">
						Release notes, tutorials, and insights about Vestig.
					</p>
				</div>

				{/* Featured Posts */}
				{featuredPosts.length > 0 && (
					<section className="mb-16">
						<h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-6">
							Featured
						</h2>
						<div className="grid gap-6">
							{featuredPosts.map((post) => (
								<Link
									key={post.slug}
									href={`/blog/${post.slug}`}
									className="group block p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
								>
									<div className="flex items-center gap-3 mb-3">
										<span
											className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${categoryColors[post.category]}`}
										>
											{post.category}
										</span>
										<span className="flex items-center gap-1.5 text-xs text-white/50">
											<Calendar className="h-3.5 w-3.5" aria-hidden="true" />
											{new Date(post.publishedTime).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})}
										</span>
										<span className="flex items-center gap-1.5 text-xs text-white/50">
											<Clock className="h-3.5 w-3.5" aria-hidden="true" />
											{post.readTime}
										</span>
									</div>
									<h3 className="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
										{post.title}
									</h3>
									<p className="text-white/60 mb-4">{post.description}</p>
									<span className="inline-flex items-center gap-1.5 text-sm text-orange-400 group-hover:gap-2.5 transition-all">
										Read more
										<ArrowRight className="h-4 w-4" />
									</span>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* Other Posts */}
				{otherPosts.length > 0 && (
					<section>
						<h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-6">
							All Posts
						</h2>
						<div className="space-y-4">
							{otherPosts.map((post) => (
								<Link
									key={post.slug}
									href={`/blog/${post.slug}`}
									className="group flex items-center justify-between p-4 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] hover:border-white/[0.1] transition-all"
								>
									<div>
										<div className="flex items-center gap-2 mb-1">
											<span
												className={`px-2 py-0.5 text-xs font-medium rounded-full border ${categoryColors[post.category]}`}
											>
												{post.category}
											</span>
										</div>
										<h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">
											{post.title}
										</h3>
									</div>
									<div className="text-sm text-white/50">
										{new Date(post.publishedTime).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})}
									</div>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* Empty State */}
				{blogPosts.length === 0 && (
					<div className="text-center py-16">
						<p className="text-white/50">No posts yet. Check back soon!</p>
					</div>
				)}
			</div>
		</div>
	)
}
