import type { HeroContent } from '@/lib/content/types'

export const heroContent: HeroContent = {
	badge: {
		text: 'v0.8.0 — Dev Overlay + WebVitals',
		href: '/changelog',
		variant: 'new',
	},
	headline: {
		primary: 'Structured Logging',
		secondary: 'for Every Runtime',
	},
	subheadline:
		'Zero-dependency TypeScript logging with auto PII sanitization, native tracing, and seamless context propagation. Works in Bun, Node, Deno, Edge, and browsers.',
	ctas: {
		primary: {
			text: 'Get Started',
			href: '/docs/getting-started',
			variant: 'default',
		},
		secondary: {
			text: 'Try Playground',
			href: '/playground',
			variant: 'outline',
		},
	},
	installCommand: 'bun add vestig',
	codePreview: {
		lines: [
			{ content: "import { log } from 'vestig'", delay: 0 },
			{ content: '', delay: 50 },
			{ content: "log.info('User signed in', {", delay: 100 },
			{ content: "  email: 'user@example.com',", delay: 150, highlight: true },
			{ content: "  password: 's3cr3t',", delay: 200, highlight: true },
			{ content: '  requestId: ctx.requestId,', delay: 250 },
			{ content: '})', delay: 300 },
			{ content: '', delay: 350 },
			{ content: '// Output with auto-sanitization:', delay: 400 },
			{ content: '// email: "u***@example.com"', delay: 450 },
			{ content: '// password: "[REDACTED]"', delay: 500 },
		],
		typingSpeed: 30,
	},
}
