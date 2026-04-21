import Content from './content.mdx'

export const metadata = {
	title: 'Why We Built Vestig: A Different Approach to TypeScript Logging',
	description:
		'The story behind Vestig and how it differs from Pino, Winston, and other logging libraries. Zero dependencies, multi-runtime, privacy-first.',
	openGraph: {
		title: 'Why We Built Vestig: A Different Approach to TypeScript Logging',
		description:
			'The story behind Vestig and how it differs from Pino, Winston, and other logging libraries. Zero dependencies, multi-runtime, privacy-first.',
		type: 'article',
		publishedTime: '2025-12-22T00:00:00.000Z',
		images: [
			{
				url: 'https://vestig.dev/og-image.svg',
				width: 1200,
				height: 630,
				alt: 'Why We Built Vestig - A Different Approach to TypeScript Logging',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Why We Built Vestig: A Different Approach to TypeScript Logging',
		description:
			'The story behind Vestig and how it differs from Pino, Winston, and other logging libraries. Zero dependencies, multi-runtime, privacy-first.',
		images: ['https://vestig.dev/og-image.svg'],
	},
	alternates: {
		canonical: 'https://vestig.dev/blog/why-vestig',
	},
}

export default function Page() {
	return <Content />
}
