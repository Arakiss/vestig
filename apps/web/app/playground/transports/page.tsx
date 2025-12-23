import { GlassCard, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { Antenna, Terminal, Globe, Folder, Database, Shuffle, Settings } from 'iconoir-react'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME } from 'vestig'

const transports = [
	{
		name: 'ConsoleTransport',
		icon: <Terminal className="h-5 w-5" />,
		color: 'text-gray-400',
		bgColor: 'from-gray-500/20 to-slate-500/20',
		borderColor: 'border-gray-500/20',
		description: 'Output logs to the console with colors and formatting',
		config: `new ConsoleTransport({
  level: 'debug',
  colors: true,
  structured: false,
})`,
		features: ['Color-coded levels', 'Pretty printing', 'JSON mode for prod'],
	},
	{
		name: 'HTTPTransport',
		icon: <Globe className="h-5 w-5" />,
		color: 'text-blue-400',
		bgColor: 'from-blue-500/20 to-indigo-500/20',
		borderColor: 'border-blue-500/20',
		description: 'Send logs to any HTTP endpoint with batching',
		config: `new HTTPTransport({
  endpoint: 'https://logs.example.com/ingest',
  batchSize: 100,
  flushInterval: 5000,
  headers: { 'Authorization': 'Bearer \${API_KEY}' },
})`,
		features: ['Batch processing', 'Retry with backoff', 'Custom headers'],
	},
	{
		name: 'FileTransport',
		icon: <Folder className="h-5 w-5" />,
		color: 'text-amber-400',
		bgColor: 'from-amber-500/20 to-orange-500/20',
		borderColor: 'border-amber-500/20',
		description: 'Write logs to files with rotation and compression',
		config: `new FileTransport({
  filename: './logs/app.log',
  maxSize: '10mb',
  maxFiles: 5,
  compress: true,
})`,
		features: ['Log rotation', 'Gzip compression', 'Size limits'],
	},
	{
		name: 'DatadogTransport',
		icon: <Database className="h-5 w-5" />,
		color: 'text-violet-400',
		bgColor: 'from-violet-500/20 to-purple-500/20',
		borderColor: 'border-violet-500/20',
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
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-violet-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
							<Antenna className="h-6 w-6 text-violet-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Transports</h1>
							<p className="text-white/50 text-sm">Configure multiple log destinations</p>
						</div>
					</div>
				</div>
			</div>

			{/* Transport Cards */}
			<div className="space-y-6 mb-8">
				{transports.map((transport) => (
					<GlassCard
						key={transport.name}
						variant="default"
						padding="lg"
						className={transport.borderColor}
					>
						<div className="flex items-start gap-4 mb-4">
							<div
								className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${transport.bgColor} border border-white/10`}
							>
								<span className={transport.color}>{transport.icon}</span>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-white">{transport.name}</h3>
								<p className="text-sm text-white/50">{transport.description}</p>
							</div>
						</div>

						<div className="mb-4">
							<h4 className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">
								Configuration
							</h4>
							<pre className="bg-white/5 rounded-lg p-3 text-xs text-white/60 overflow-x-auto border border-white/10">
								{transport.config}
							</pre>
						</div>

						<div className="flex flex-wrap gap-2">
							{transport.features.map((feature) => (
								<span
									key={feature}
									className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-white/50"
								>
									{feature}
								</span>
							))}
						</div>
					</GlassCard>
				))}
			</div>

			{/* Multi-Transport Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Shuffle className="h-5 w-5 text-violet-400" />
					Multi-Transport Configuration
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`import {
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
    }),

    // File for local persistence
    new FileTransport({
      filename: './logs/app.log',
      maxSize: '50mb',
    }),
  ],
})

// All transports receive every log
log.info('Application started', { version: '1.0.0' })`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Common Options */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Settings className="h-5 w-5 text-violet-400" />
					Common Transport Options
				</h2>
				<GlassCard variant="default" padding="lg">
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						{[
							{ name: 'level', desc: 'Minimum log level' },
							{ name: 'enabled', desc: 'Toggle transport on/off' },
							{ name: 'filter', desc: 'Custom filter function' },
							{ name: 'batchSize', desc: 'Logs per batch' },
							{ name: 'flushInterval', desc: 'Auto-flush timing' },
							{ name: 'maxRetries', desc: 'Retry attempts' },
						].map((option) => (
							<div key={option.name}>
								<span className="text-white font-medium">{option.name}</span>
								<span className="text-white/40"> — {option.desc}</span>
							</div>
						))}
					</div>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-violet-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{
							title: 'Multiple Destinations',
							desc: 'Send logs to console, files, HTTP, and Datadog',
						},
						{ title: 'Batch Processing', desc: 'Efficient batching with configurable size' },
						{ title: 'Retry Logic', desc: 'Automatic retries with exponential backoff' },
						{ title: 'Custom Transports', desc: 'Extend BatchTransport to create your own' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-violet-400 mt-0.5">›</span>
							<div>
								<span className="text-sm text-white font-medium">{feature.title}</span>
								<span className="text-sm text-white/40"> — {feature.desc}</span>
							</div>
						</div>
					))}
				</GlassGrid>
			</GlassCard>
		</Container>
	)
}
