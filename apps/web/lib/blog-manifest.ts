/**
 * Blog posts manifest - Single source of truth for blog content
 *
 * This manifest is used by:
 * - Sitemap generation (app/sitemap.ts)
 * - RSS feed generation (app/blog/feed.xml/route.ts)
 * - Blog index page (app/blog/page.tsx)
 *
 * When adding a new blog post:
 * 1. Create the MDX file in app/blog/[slug]/page.mdx
 * 2. Add an entry to this manifest with matching slug
 */

export type BlogCategory = 'Release' | 'Tutorial' | 'Comparison' | 'Update'

export interface BlogPost {
	/** URL slug (must match the folder name in app/blog/) */
	slug: string
	/** Post title for RSS and sitemap */
	title: string
	/** Meta description for SEO and RSS */
	description: string
	/** ISO 8601 publish date */
	publishedTime: string
	/** Optional: last modified date (defaults to publishedTime) */
	modifiedTime?: string
	/** Optional: post author */
	author?: string
	/** Optional: featured image for OpenGraph */
	image?: string
	/** Post category for blog listing */
	category: BlogCategory
	/** Estimated read time */
	readTime: string
	/** Whether to feature this post prominently */
	featured?: boolean
}

/**
 * All blog posts, ordered by publish date (newest first)
 */
export const blogPosts: BlogPost[] = [
	{
		slug: 'vestig-v0.7.0-deno-sampling',
		title: 'Vestig v0.7.0: Full Deno Support, Advanced Sampling & More',
		description:
			'Announcing Vestig v0.7.0 with full Deno runtime support, W3C tracestate, advanced sampling strategies, and VestigErrorBoundary for React.',
		publishedTime: '2025-12-22T00:00:00.000Z',
		author: 'Vestig Team',
		category: 'Release',
		readTime: '5 min read',
		featured: true,
	},
	{
		slug: 'why-vestig',
		title: 'Why We Built Vestig: A Different Approach to TypeScript Logging',
		description:
			'The story behind Vestig and how it differs from Pino, Winston, and other logging libraries. Zero dependencies, multi-runtime, privacy-first.',
		publishedTime: '2025-12-22T00:00:00.000Z',
		author: 'Vestig Team',
		category: 'Comparison',
		readTime: '8 min read',
		featured: true,
	},
]

/**
 * Get a blog post by slug
 */
export function getBlogPost(slug: string): BlogPost | undefined {
	return blogPosts.find((post) => post.slug === slug)
}

/**
 * Get all blog post slugs (for static generation)
 */
export function getBlogSlugs(): string[] {
	return blogPosts.map((post) => post.slug)
}
