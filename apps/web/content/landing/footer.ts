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
				{ label: 'PII Sanitization', href: '/docs/security/sanitization' },
				{ label: 'Native Tracing', href: '/docs/tracing' },
				{ label: 'Transports', href: '/docs/transports' },
				{ label: 'Sampling', href: '/docs/sampling' },
			],
		},
		{
			title: 'Integrations',
			links: [
				{ label: 'Next.js', href: '/docs/nextjs' },
				{ label: 'Express', href: '/docs/api' },
				{ label: 'Core API', href: '/docs/api' },
				{ label: 'Transports', href: '/docs/transports' },
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
				{ label: 'Issues', href: 'https://github.com/Arakiss/vestig/issues', external: true },
				{
					label: 'Contributing',
					href: 'https://github.com/Arakiss/vestig/blob/main/CONTRIBUTING.md',
					external: true,
				},
			],
		},
	],
	copyright: '© 2025 Vestig. MIT License.',
	tagline: 'Zero-dependency TypeScript logging for modern applications.',
}
