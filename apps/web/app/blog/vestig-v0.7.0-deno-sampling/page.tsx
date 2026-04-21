import Content from './content.mdx'

export const metadata = {
	title: 'Vestig v0.7.0: Full Deno Support, Advanced Sampling & More',
	description:
		'Announcing Vestig v0.7.0 with full Deno runtime support, W3C tracestate, advanced sampling strategies, and VestigErrorBoundary for React.',
	openGraph: {
		title: 'Vestig v0.7.0: Full Deno Support, Advanced Sampling & More',
		description:
			'Announcing Vestig v0.7.0 with full Deno runtime support, W3C tracestate, advanced sampling strategies, and VestigErrorBoundary for React.',
		type: 'article',
		publishedTime: '2025-12-22T00:00:00.000Z',
		images: [
			{
				url: 'https://vestig.dev/og-image.svg',
				width: 1200,
				height: 630,
				alt: 'Vestig v0.7.0 - Full Deno Support, Advanced Sampling & More',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Vestig v0.7.0: Full Deno Support, Advanced Sampling & More',
		description:
			'Announcing Vestig v0.7.0 with full Deno runtime support, W3C tracestate, advanced sampling strategies, and VestigErrorBoundary for React.',
		images: ['https://vestig.dev/og-image.svg'],
	},
	alternates: {
		canonical: 'https://vestig.dev/blog/vestig-v0.7.0-deno-sampling',
	},
}

export default function Page() {
	return <Content />
}
