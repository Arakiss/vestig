import type { Feature } from '@/lib/content/types'

export const features: Feature[] = [
	{
		id: 'zero-deps',
		icon: 'Package',
		title: 'Zero Dependencies',
		description:
			'No external dependencies means tiny bundle sizes (<5KB gzipped) and no supply chain risks. Just pure TypeScript.',
		link: {
			text: 'See benchmarks',
			href: '/docs/features/performance',
		},
	},
	{
		id: 'multi-runtime',
		icon: 'Layers',
		title: 'Multi-Runtime',
		description:
			'Works seamlessly in Bun, Node.js, Deno, Edge runtimes (Vercel, Cloudflare), and browsers with automatic runtime detection.',
		link: {
			text: 'Runtime support',
			href: '/docs/features/runtimes',
		},
	},
	{
		id: 'pii-sanitization',
		icon: 'Shield',
		title: 'Auto PII Sanitization',
		description:
			'Automatically detects and redacts sensitive data like passwords, emails, credit cards, and API keys. GDPR & HIPAA friendly.',
		highlight: 'Popular',
		link: {
			text: 'Learn more',
			href: '/docs/features/sanitization',
		},
	},
	{
		id: 'native-tracing',
		icon: 'Activity',
		title: 'Native Tracing',
		description:
			'Built-in distributed tracing with span(), startSpan(), and automatic context propagation. No OpenTelemetry overhead.',
		highlight: 'New',
		link: {
			text: 'Tracing guide',
			href: '/docs/features/tracing',
		},
	},
	{
		id: 'context-propagation',
		icon: 'Link',
		title: 'Context Propagation',
		description:
			'AsyncLocalStorage-based context that flows through your entire request lifecycle. Correlation IDs, user context, and more.',
		link: {
			text: 'Context docs',
			href: '/docs/features/context',
		},
	},
	{
		id: 'smart-sampling',
		icon: 'Filter',
		title: 'Smart Sampling',
		description:
			'Probability, rate-limit, and namespace-based sampling strategies to control log volume without losing important data.',
		highlight: 'New',
		link: {
			text: 'Sampling strategies',
			href: '/docs/features/sampling',
		},
	},
	{
		id: 'type-safe',
		icon: 'Code',
		title: 'Type-Safe',
		description:
			'Full TypeScript support with strict typing for metadata, context, and configuration. IDE autocomplete and compile-time checks.',
	},
	{
		id: 'transports',
		icon: 'Server',
		title: 'Flexible Transports',
		description:
			'Console, HTTP, File, Datadog, and more. Create custom transports with a simple interface. Batching and retry built-in.',
		link: {
			text: 'Transport docs',
			href: '/docs/features/transports',
		},
	},
]
