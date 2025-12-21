import type { NavigationConfig } from '@/lib/content/types'

export const navigationConfig: NavigationConfig = {
	header: [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Playground', href: '/playground' },
		{ label: 'Examples', href: '/examples' },
		{ label: 'GitHub', href: 'https://github.com/vestig-lang/vestig', external: true },
	],
	footer: [
		{
			title: 'Documentation',
			links: [
				{ label: 'Getting Started', href: '/docs/getting-started' },
				{ label: 'API Reference', href: '/docs/api' },
				{ label: 'Features', href: '/docs/features' },
				{ label: 'Guides', href: '/docs/guides' },
			],
		},
		{
			title: 'Features',
			links: [
				{ label: 'PII Sanitization', href: '/docs/features/sanitization' },
				{ label: 'Native Tracing', href: '/docs/features/tracing' },
				{ label: 'Context Propagation', href: '/docs/features/context' },
				{ label: 'Transports', href: '/docs/features/transports' },
			],
		},
		{
			title: 'Integrations',
			links: [
				{ label: 'Next.js', href: '/docs/integrations/nextjs' },
				{ label: 'Express', href: '/docs/integrations/express' },
				{ label: 'Hono', href: '/docs/integrations/hono' },
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
				{ label: 'Changelog', href: '/changelog' },
			],
		},
	],
}
