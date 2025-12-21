import type {
	InteractiveDemoConfig,
	PlaygroundEmbed,
	DocsPreviewSection,
} from '@/lib/content/types'

export const interactiveDemoConfig: InteractiveDemoConfig = {
	title: 'See It In Action',
	description:
		'Try Vestig directly in your browser. Edit the code and see real-time log output with automatic sanitization.',
	presets: [
		{
			id: 'basic',
			label: 'Basic Logging',
			description: 'Simple structured logging with metadata',
			code: `import { log } from 'vestig'

// Basic logging with different levels
log.info('Application started', { version: '1.0.0' })
log.debug('Configuration loaded', { env: 'production' })
log.warn('Cache miss', { key: 'user:123' })
log.error('Connection failed', { host: 'db.example.com' })`,
		},
		{
			id: 'sanitization',
			label: 'PII Sanitization',
			description: 'Automatic redaction of sensitive data',
			code: `import { log } from 'vestig'

// Sensitive data is automatically sanitized
log.info('User registered', {
  email: 'john.doe@example.com',
  password: 'super-secret-123',
  creditCard: '4532015112830366',
  ssn: '123-45-6789',
})

// Output will show:
// email: "j***@example.com"
// password: "[REDACTED]"
// creditCard: "4532********0366"
// ssn: "[REDACTED]"`,
		},
		{
			id: 'tracing',
			label: 'Native Tracing',
			description: 'Distributed tracing with spans',
			code: `import { log, span } from 'vestig'

// Create a traced operation
const result = await span('fetch-user', async (s) => {
  s.setAttribute('userId', '123')

  const user = await db.users.findById('123')

  s.addEvent('user-found', { name: user.name })

  return user
})

// Spans automatically track duration and errors`,
		},
		{
			id: 'context',
			label: 'Context Propagation',
			description: 'Request-scoped context across your app',
			code: `import { log, withContext } from 'vestig'

// Context flows through async operations
await withContext({ requestId: 'req-123', userId: 'user-456' }, async () => {
  // All logs automatically include context
  log.info('Processing request')

  await processOrder()

  log.info('Request completed')
})

// Both logs will include requestId and userId`,
		},
	],
}

export const playgroundEmbeds: PlaygroundEmbed[] = [
	{
		route: '/playground/sanitization',
		title: 'PII Sanitization Playground',
		description: 'See how Vestig automatically redacts sensitive data in real-time.',
	},
	{
		route: '/playground/tracing',
		title: 'Tracing Playground',
		description: 'Explore distributed tracing with interactive span visualization.',
	},
]

export const docsPreviewSections: DocsPreviewSection[] = [
	{
		id: 'getting-started',
		title: 'Getting Started',
		description: 'Install Vestig and start logging in under 5 minutes.',
		href: '/docs/getting-started',
		icon: 'Terminal',
	},
	{
		id: 'sanitization',
		title: 'PII Sanitization',
		description: 'Learn how automatic data redaction keeps your logs safe.',
		href: '/docs/features/sanitization',
		icon: 'Shield',
	},
	{
		id: 'tracing',
		title: 'Native Tracing',
		description: 'Add distributed tracing to your application.',
		href: '/docs/features/tracing',
		icon: 'Activity',
	},
	{
		id: 'nextjs',
		title: 'Next.js Integration',
		description: 'Server components, route handlers, and middleware.',
		href: '/docs/integrations/nextjs',
		icon: 'Zap',
	},
]
