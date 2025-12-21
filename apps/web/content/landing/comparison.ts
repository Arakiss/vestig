import type { ComparisonConfig } from '@/lib/content/types'

export const comparisonConfig: ComparisonConfig = {
	title: 'How Vestig Compares',
	description:
		'See how Vestig stacks up against other popular logging libraries in terms of features and bundle size.',
	rows: [
		{
			feature: 'Bundle Size (gzip)',
			vestig: '<5KB',
			pino: '~25KB',
			winston: '~80KB',
			bunyan: '~45KB',
		},
		{
			feature: 'Dependencies',
			vestig: '0',
			pino: '3',
			winston: '8',
			bunyan: '4',
		},
		{
			feature: 'TypeScript',
			vestig: true,
			pino: true,
			winston: true,
			bunyan: false,
		},
		{
			feature: 'Auto PII Sanitization',
			vestig: true,
			pino: false,
			winston: false,
			bunyan: false,
		},
		{
			feature: 'Native Tracing',
			vestig: true,
			pino: false,
			winston: false,
			bunyan: false,
		},
		{
			feature: 'Context Propagation',
			vestig: true,
			pino: 'Plugin',
			winston: 'Plugin',
			bunyan: false,
		},
		{
			feature: 'Edge Runtime',
			vestig: true,
			pino: 'Partial',
			winston: false,
			bunyan: false,
		},
		{
			feature: 'Browser Support',
			vestig: true,
			pino: 'pino-browser',
			winston: 'winston-browser',
			bunyan: false,
		},
		{
			feature: 'Structured Logging',
			vestig: true,
			pino: true,
			winston: true,
			bunyan: true,
		},
		{
			feature: 'Sampling',
			vestig: true,
			pino: 'Plugin',
			winston: false,
			bunyan: false,
		},
	],
	footnote: 'Bundle sizes measured with esbuild minify + gzip. Feature comparisons as of Dec 2024.',
}
