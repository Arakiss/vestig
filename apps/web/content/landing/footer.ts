import type { FooterContent } from '@/lib/content/types'

export const footerContent: FooterContent = {
	sections: [
		{
			title: 'Documentation',
			links: [
				{ label: 'Getting Started', href: '/docs/getting-started' },
				{ label: 'API Reference', href: '/docs/api' },
				{ label: 'Examples', href: '/examples' },
				{ label: 'Changelog', href: '/changelog' },
			],
		},
		{
			title: 'Features',
			links: [
				{ label: 'PII Sanitization', href: '/docs/features/sanitization' },
				{ label: 'Native Tracing', href: '/docs/features/tracing' },
				{ label: 'Context Propagation', href: '/docs/features/context' },
				{ label: 'Sampling', href: '/docs/features/sampling' },
			],
		},
		{
			title: 'Integrations',
			links: [
				{ label: 'Next.js', href: '/docs/integrations/nextjs' },
				{ label: 'Express', href: '/docs/integrations/express' },
				{ label: 'Hono', href: '/docs/integrations/hono' },
				{ label: 'Datadog', href: '/docs/transports/datadog' },
			],
		},
		{
			title: 'Community',
			links: [
				{ label: 'GitHub', href: 'https://github.com/vestig-lang/vestig', external: true },
				{
					label: 'Discussions',
					href: 'https://github.com/vestig-lang/vestig/discussions',
					external: true,
				},
				{ label: 'Issues', href: 'https://github.com/vestig-lang/vestig/issues', external: true },
				{
					label: 'Contributing',
					href: 'https://github.com/vestig-lang/vestig/blob/main/CONTRIBUTING.md',
					external: true,
				},
			],
		},
	],
	copyright: '© 2024 Vestig. MIT License.',
	tagline: 'Zero-dependency TypeScript logging for modern applications.',
}
