import type { NavigationConfig } from '@/lib/content/types'

export const navigationConfig: NavigationConfig = {
	header: [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Playground', href: '/playground' },
		{ label: 'Examples', href: '/examples' },
		{ label: 'GitHub', href: 'https://github.com/Arakiss/vestig', external: true },
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
				{ label: 'PII Sanitization', href: '/docs/security/sanitization' },
				{ label: 'Native Tracing', href: '/docs/tracing' },
				{ label: 'Sampling', href: '/docs/sampling' },
				{ label: 'Transports', href: '/docs/transports' },
			],
		},
		{
			title: 'Integrations',
			links: [
				{ label: 'Next.js', href: '/docs/nextjs' },
				{ label: 'Express', href: '/docs/api' },
				{ label: 'Core API', href: '/docs/api' },
			],
		},
		{
			title: 'Community',
			links: [
				{ label: 'GitHub', href: 'https://github.com/Arakiss/vestig', external: true },
				{
					label: 'Discussions',
					href: 'https://github.com/Arakiss/vestig/discussions',
					external: true,
				},
				{ label: 'Changelog', href: '/changelog' },
			],
		},
	],
}
