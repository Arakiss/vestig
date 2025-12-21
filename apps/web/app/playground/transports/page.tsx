import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME } from 'vestig'

/**
 * Transport configurations for demonstration
 */
const transports = [
	{
		name: 'ConsoleTransport',
		icon: '🖥️',
		description: 'Output logs to the console with colors and formatting',
		config: `new ConsoleTransport({
  level: 'debug',
  colors: true,
  structured: false, // Pretty print for dev
})`,
		features: ['Color-coded levels', 'Pretty printing', 'JSON mode for prod'],
	},
	{
		name: 'HTTPTransport',
		icon: '🌐',
		description: 'Send logs to any HTTP endpoint with batching',
		config: `new HTTPTransport({
  endpoint: 'https://logs.example.com/ingest',
  batchSize: 100,
  flushInterval: 5000,
  headers: {
    'Authorization': 'Bearer ${'${API_KEY}'}',
  },
})`,
		features: ['Batch processing', 'Retry with backoff', 'Custom headers'],
	},
	{
		name: 'FileTransport',
		icon: '📁',
		description: 'Write logs to files with rotation and compression',
		config: `new FileTransport({
  filename: './logs/app.log',
  maxSize: '10mb',
  maxFiles: 5,
  compress: true, // gzip old files
})`,
		features: ['Log rotation', 'Gzip compression', 'Size limits'],
	},
	{
		name: 'DatadogTransport',
		icon: '🐕',
		description: 'Send logs directly to Datadog Log Management',
		config: `new DatadogTransport({
  apiKey: process.env.DD_API_KEY,
  service: 'my-app',
  source: 'nodejs',
  tags: ['env:production'],
})`,
		features: ['Datadog integration', 'Automatic tagging', 'Source mapping'],
	},
]

/**
 * Transports Demo Page
 *
 * Shows multi-transport configuration with HTTP, File, and Datadog.
 */
export default async function TransportsPage() {
	const log = await getLogger('transports-demo')
	const ctx = await getRequestContext()

	log.info('Transports demo page rendering', {
		route: '/playground/transports',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		requestId: ctx.requestId,
	})

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">📡</span>
					<h1 className="text-2xl font-bold text-white">Transports</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Configure multiple log destinations with different transports. Vestig supports console,
					HTTP, file, and Datadog out of the box.
				</p>
				<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
			</div>

			{/* Transport cards */}
			<div className="space-y-6">
				{transports.map((transport) => (
					<div
						key={transport.name}
						className="bg-gray-900/50 border border-white/10 rounded-lg overflow-hidden"
					>
						<div className="px-5 py-4 border-b border-white/10 bg-gray-800/30">
							<div className="flex items-center gap-3">
								<span className="text-2xl">{transport.icon}</span>
								<div>
									<h3 className="text-lg font-semibold text-white">{transport.name}</h3>
									<p className="text-sm text-gray-400">{transport.description}</p>
								</div>
							</div>
						</div>

						<div className="p-5 space-y-4">
							{/* Config */}
							<div>
								<h4 className="text-sm font-medium text-gray-400 mb-2">Configuration</h4>
								<pre className="bg-gray-950 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
									{transport.config}
								</pre>
							</div>

							{/* Features */}
							<div>
								<h4 className="text-sm font-medium text-gray-400 mb-2">Features</h4>
								<div className="flex flex-wrap gap-2">
									{transport.features.map((feature) => (
										<span
											key={feature}
											className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs"
										>
											{feature}
										</span>
									))}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Multi-transport example */}
			<div className="mt-8">
				<DemoCard
					title="Multi-Transport Configuration"
					description="Send logs to multiple destinations simultaneously"
					icon="🔀"
					code={`import {
  createLogger,
  ConsoleTransport,
  HTTPTransport,
  FileTransport,
} from 'vestig'

const log = createLogger({
  level: 'debug',
  transports: [
    // Console for development
    new ConsoleTransport({
      enabled: process.env.NODE_ENV !== 'production',
      colors: true,
    }),

    // HTTP for log aggregation service
    new HTTPTransport({
      endpoint: process.env.LOG_ENDPOINT,
      batchSize: 50,
      headers: {
        'X-API-Key': process.env.LOG_API_KEY,
      },
    }),

    // File for local persistence
    new FileTransport({
      filename: './logs/app.log',
      maxSize: '50mb',
      maxFiles: 10,
    }),
  ],
})

// All transports receive every log
log.info('Application started', { version: '1.0.0' })`}
				/>
			</div>

			{/* Transport options */}
			<div className="mt-8">
				<DemoCard
					title="Common Transport Options"
					description="Options shared across all transport types"
					icon="⚙️"
				>
					<DemoResult>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div className="space-y-2">
								<div className="text-gray-400">
									<strong className="text-white">level</strong> — Minimum log level
								</div>
								<div className="text-gray-400">
									<strong className="text-white">enabled</strong> — Toggle transport on/off
								</div>
								<div className="text-gray-400">
									<strong className="text-white">filter</strong> — Custom filter function
								</div>
							</div>
							<div className="space-y-2">
								<div className="text-gray-400">
									<strong className="text-white">batchSize</strong> — Logs per batch
								</div>
								<div className="text-gray-400">
									<strong className="text-white">flushInterval</strong> — Auto-flush timing
								</div>
								<div className="text-gray-400">
									<strong className="text-white">maxRetries</strong> — Retry attempts
								</div>
							</div>
						</div>
					</DemoResult>
				</DemoCard>
			</div>

			{/* Key points */}
			<div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-green-400 mb-3">✅ Key Features</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">Multiple Destinations</strong> — Send logs to console,
						files, HTTP, and Datadog simultaneously
					</li>
					<li>
						• <strong className="text-white">Batch Processing</strong> — Efficient batching with
						configurable size and flush intervals
					</li>
					<li>
						• <strong className="text-white">Retry Logic</strong> — Automatic retries with
						exponential backoff for network transports
					</li>
					<li>
						• <strong className="text-white">Level Filtering</strong> — Each transport can have its
						own minimum log level
					</li>
					<li>
						• <strong className="text-white">Custom Transports</strong> — Extend BatchTransport to
						create your own
					</li>
				</ul>
			</div>
		</div>
	)
}
