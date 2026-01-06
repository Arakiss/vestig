import type { BlogPost } from '@/lib/blog-manifest'
import { SITE_URL } from '@/lib/constants'

interface BlogPostSchemaProps {
	post: BlogPost
}

/**
 * JSON-LD structured data for blog posts (Article schema)
 *
 * This helps search engines understand the article structure and display
 * rich results in search results (author, date, images, etc.)
 */
export function BlogPostSchema({ post }: BlogPostSchemaProps) {
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		image: post.image || `${SITE_URL}/og-image.svg`,
		datePublished: post.publishedTime,
		dateModified: post.modifiedTime || post.publishedTime,
		author: {
			'@type': 'Person',
			name: post.author || 'Vestig Team',
		},
		publisher: {
			'@type': 'Organization',
			name: 'Vestig',
			logo: {
				'@type': 'ImageObject',
				url: `${SITE_URL}/favicon.svg`,
			},
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': `${SITE_URL}/blog/${post.slug}`,
		},
	}

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data is safe
			dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
		/>
	)
}
