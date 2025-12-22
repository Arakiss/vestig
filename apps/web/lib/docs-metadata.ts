import type { Metadata } from 'next'

const BASE_URL = 'https://vestig.dev'

interface DocPageMeta {
	title: string
	description: string
	keywords?: string[]
}

// Metadata configuration for all doc pages
export const docsMetadata: Record<string, DocPageMeta> = {
	// Getting Started
	'/docs': {
		title: 'Documentation',
		description:
			'Complete documentation for Vestig, the zero-dependency TypeScript logging library with PII sanitization and native tracing.',
		keywords: ['vestig docs', 'logging documentation', 'typescript logging guide'],
	},
	'/docs/getting-started': {
		title: 'Getting Started',
		description:
			'Install Vestig and start logging in under 5 minutes. Works with Bun, npm, pnpm, and Yarn.',
		keywords: ['install vestig', 'vestig setup', 'logging quickstart'],
	},
	'/docs/features': {
		title: 'Features Overview',
		description:
			'Explore Vestig features: zero dependencies, multi-runtime support, PII sanitization, native tracing, and more.',
		keywords: ['vestig features', 'logging features', 'structured logging'],
	},

	// Core Concepts
	'/docs/core/logging': {
		title: 'Logging Basics',
		description:
			'Learn the fundamentals of structured logging with Vestig. Create loggers, add metadata, and understand log entries.',
		keywords: ['structured logging', 'log metadata', 'logging basics'],
	},
	'/docs/core/levels': {
		title: 'Log Levels',
		description:
			'Understanding log levels in Vestig: trace, debug, info, warn, and error. Configure minimum levels and filtering.',
		keywords: ['log levels', 'debug logging', 'error logging', 'log filtering'],
	},
	'/docs/core/structured': {
		title: 'Structured Output',
		description:
			'Configure JSON structured output for production logging. Format logs for ingestion by log management tools.',
		keywords: ['json logging', 'structured output', 'log format'],
	},
	'/docs/core/child-loggers': {
		title: 'Child Loggers',
		description:
			'Create namespaced child loggers with inherited context. Organize logs by module or feature.',
		keywords: ['child loggers', 'namespaced logging', 'logger hierarchy'],
	},

	// Tracing
	'/docs/tracing': {
		title: 'Native Tracing',
		description:
			'Add distributed tracing to your application with Vestig spans. Track performance and trace requests across services.',
		keywords: ['distributed tracing', 'spans', 'performance tracing', 'opentelemetry alternative'],
	},
	'/docs/tracing/spans': {
		title: 'Working with Spans',
		description:
			'Deep dive into Vestig Span API. Create spans, add attributes, record events, and handle errors.',
		keywords: ['span api', 'trace spans', 'span attributes', 'span events'],
	},

	// Security
	'/docs/security/sanitization': {
		title: 'PII Sanitization',
		description:
			'Automatic PII detection and redaction. Protect emails, passwords, credit cards, and SSNs in your logs.',
		keywords: ['pii sanitization', 'gdpr logging', 'hipaa logging', 'data redaction'],
	},

	// Sampling
	'/docs/sampling': {
		title: 'Log Sampling',
		description:
			'Control log volume with sampling strategies. Probability, rate-limit, and namespace-based sampling.',
		keywords: ['log sampling', 'rate limiting', 'log volume control'],
	},

	// Transports
	'/docs/transports': {
		title: 'Transports',
		description:
			'Configure log destinations with Vestig transports. Console, HTTP, File, and Datadog integrations.',
		keywords: ['log transports', 'logging destinations', 'datadog logging'],
	},

	// Next.js Integration
	'/docs/nextjs': {
		title: 'Next.js Integration',
		description:
			'First-class Next.js 15+ support. Server Components, Route Handlers, Middleware, and Client Components.',
		keywords: ['nextjs logging', 'react server components', 'app router logging'],
	},
	'/docs/nextjs/middleware': {
		title: 'Next.js Middleware',
		description:
			'Add request correlation and logging to Next.js middleware. Trace requests across your application.',
		keywords: ['nextjs middleware', 'request logging', 'correlation id'],
	},
	'/docs/nextjs/server-components': {
		title: 'Server Components',
		description: 'Logging in React Server Components with automatic context propagation.',
		keywords: ['server components logging', 'rsc logging', 'react 19 logging'],
	},
	'/docs/nextjs/route-handlers': {
		title: 'Route Handlers',
		description: 'Add logging and tracing to Next.js API Route Handlers with @vestig/next.',
		keywords: ['api route logging', 'route handler logging', 'nextjs api'],
	},
	'/docs/nextjs/server-actions': {
		title: 'Server Actions',
		description: 'Trace and log Server Actions with automatic context and error handling.',
		keywords: ['server actions', 'react actions logging', 'form actions'],
	},
	'/docs/nextjs/client': {
		title: 'Client Components',
		description:
			'Client-side logging with useLogger hook. Offline queue, batching, and error boundaries.',
		keywords: ['client logging', 'browser logging', 'useLogger hook'],
	},

	// Tracing - Context
	'/docs/tracing/context': {
		title: 'Context Propagation',
		description:
			'Automatic context propagation across async operations using AsyncLocalStorage. Correlation IDs, request context, and more.',
		keywords: ['context propagation', 'asynclocalstorage', 'correlation id', 'request context'],
	},
	'/docs/tracing/w3c': {
		title: 'W3C Trace Context',
		description:
			'Full W3C Trace Context compliance with traceparent and tracestate headers for distributed tracing across services.',
		keywords: ['w3c trace context', 'traceparent', 'tracestate', 'distributed tracing'],
	},

	// Runtime
	'/docs/runtime': {
		title: 'Runtime Detection',
		description:
			'Automatic runtime detection for Node.js, Bun, Deno, Edge, and Browser environments. Write universal JavaScript.',
		keywords: [
			'runtime detection',
			'bun',
			'deno',
			'node.js',
			'edge runtime',
			'universal javascript',
		],
	},

	// Express.js
	'/docs/express': {
		title: 'Express.js Integration',
		description:
			'First-class Express.js support with middleware, route handlers, error handling, and automatic correlation ID propagation.',
		keywords: ['express.js', 'express middleware', 'express logging', 'node.js logging'],
	},

	// Advanced
	'/docs/advanced/error-handling': {
		title: 'Error Handling',
		description:
			'Safe error serialization, cause chain support, and best practices for logging errors in production.',
		keywords: ['error handling', 'error serialization', 'error logging', 'cause chain'],
	},
	'/docs/advanced/custom-transports': {
		title: 'Custom Transports',
		description:
			'Build custom log transports to send logs anywhere. Simple interface with built-in batching, retry, and lifecycle management.',
		keywords: ['custom transport', 'log transport', 'transport development', 'batching'],
	},

	// Sampling - Advanced
	'/docs/sampling/advanced': {
		title: 'Advanced Sampling',
		description:
			'Deep dive into Vestig sampling strategies: probability, rate limiting, namespace-based sampling, and custom samplers.',
		keywords: ['log sampling', 'rate limiting', 'probability sampling', 'namespace sampling'],
	},

	// API Reference
	'/docs/api': {
		title: 'API Reference',
		description:
			'Complete API reference for the vestig core package. All functions, types, and configurations.',
		keywords: ['vestig api', 'logging api', 'typescript api'],
	},
	'/docs/api/next': {
		title: '@vestig/next API',
		description:
			'API reference for the @vestig/next package. Next.js-specific utilities and components.',
		keywords: ['vestig next api', 'nextjs logging api'],
	},
}

export function generateDocsMetadata(pathname: string): Metadata {
	const meta = docsMetadata[pathname]

	if (!meta) {
		return {
			title: 'Documentation',
			description: 'Vestig documentation',
		}
	}

	const url = `${BASE_URL}${pathname}`

	return {
		title: meta.title,
		description: meta.description,
		keywords: meta.keywords,
		alternates: {
			canonical: url,
		},
		openGraph: {
			title: `${meta.title} | Vestig Docs`,
			description: meta.description,
			url,
			type: 'article',
		},
		twitter: {
			title: `${meta.title} | Vestig Docs`,
			description: meta.description,
		},
	}
}
