import { GlassCard, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import { Lock, Copy, Code, Search } from 'iconoir-react'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME, Sanitizer, PRESETS, type SanitizePreset } from 'vestig'

const sampleData = {
	user: {
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'super_secret_123',
		ssn: '123-45-6789',
		phone: '+1 (555) 123-4567',
	},
	payment: {
		cardNumber: '4111-1111-1111-1111',
		cvv: '123',
		expiryDate: '12/25',
		billingAddress: '123 Main St, New York, NY 10001',
	},
	medical: {
		patientId: 'PAT-2024-001',
		diagnosis: 'Common cold',
		medications: ['Acetaminophen', 'Vitamin C'],
		insuranceId: 'INS-987654321',
	},
	api: {
		apiKey: 'sk_live_abc123xyz789',
		secretToken: 'ghp_xxxxxxxxxxxxxxxxxxxx',
		bearerToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
	},
}

const presetDescriptions: Record<string, string> = {
	none: 'No sanitization - shows raw data (not recommended for production)',
	minimal: 'Basic sanitization - passwords and secrets only',
	default: 'Standard sanitization - common PII fields and patterns',
	gdpr: 'GDPR compliant - EU personal data protection requirements',
	hipaa: 'HIPAA compliant - Healthcare data protection (US)',
	'pci-dss': 'PCI-DSS compliant - Payment card industry standards',
}

const presetColors: Record<string, string> = {
	none: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
	minimal: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
	default: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
	gdpr: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
	hipaa: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
	'pci-dss': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export default async function SanitizationPage() {
	const log = await getLogger('sanitization-demo')
	const ctx = await getRequestContext()

	log.info('PII Sanitization demo page rendering', {
		route: '/playground/sanitization',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		requestId: ctx.requestId,
	})

	const sanitizedResults = Object.entries(PRESETS).map(([name]) => {
		const sanitizer = Sanitizer.fromPreset(name as SanitizePreset)
		return {
			name,
			description: presetDescriptions[name] || '',
			result: sanitizer.sanitize(sampleData),
		}
	})

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
							<Lock className="h-6 w-6 text-emerald-400" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">PII Sanitization</h1>
							<p className="text-white/50 text-sm">Compare sanitization presets side-by-side</p>
						</div>
					</div>
				</div>
			</div>

			{/* Sample Data */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Copy className="h-5 w-5 text-emerald-400" />
					Sample Data (Unsanitized)
				</h2>
				<GlassCard variant="default" padding="none">
					<pre className="p-4 text-xs text-white/60 overflow-x-auto max-h-64 overflow-y-auto">
						{JSON.stringify(sampleData, null, 2)}
					</pre>
				</GlassCard>
			</div>

			{/* Preset Comparison */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4">Preset Comparison</h2>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{sanitizedResults.map(({ name, description, result }) => (
						<GlassCard key={name} variant="subtle" padding="none">
							<div className="p-4 border-b border-white/10">
								<div className="flex items-center gap-2 mb-1">
									<span
										className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${presetColors[name]}`}
									>
										{name}
									</span>
								</div>
								<p className="text-xs text-white/40">{description}</p>
							</div>
							<pre className="p-4 text-xs text-white/50 overflow-x-auto max-h-48 overflow-y-auto">
								{JSON.stringify(result, null, 2)}
							</pre>
						</GlassCard>
					))}
				</div>
			</div>

			{/* Code Example */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Code className="h-5 w-5 text-emerald-400" />
					Code Example
				</h2>
				<GlassCard variant="subtle" padding="none">
					<pre className="p-4 text-sm text-white/80 overflow-x-auto">
						<code>{`import { createLogger, sanitize } from 'vestig'

// Using preset in logger config
const log = createLogger({
  sanitize: 'gdpr', // or 'hipaa', 'pci-dss', 'default', 'minimal'
})

// All logs automatically sanitized
log.info('User login', {
  email: 'john@example.com',     // → [EMAIL REDACTED]
  password: 'secret123',          // → [REDACTED]
  creditCard: '4111-1111-1111',   // → [CARD REDACTED]
})

// Direct sanitization
const cleanData = sanitize(userData, { preset: 'hipaa' })`}</code>
					</pre>
				</GlassCard>
			</div>

			{/* Field Types */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Search className="h-5 w-5 text-emerald-400" />
					Sanitized Field Types
				</h2>
				<GlassCard variant="default" padding="lg">
					<div className="flex flex-wrap gap-2">
						{[
							'password',
							'email',
							'creditCard',
							'ssn',
							'phone',
							'apiKey',
							'token',
							'secret',
							'address',
						].map((field) => (
							<span
								key={field}
								className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60"
							>
								{field}
							</span>
						))}
					</div>
				</GlassCard>
			</div>

			{/* Key Features */}
			<GlassCard variant="default" padding="lg" className="border-emerald-500/20">
				<h3 className="text-sm font-semibold text-white mb-4">Key Features</h3>
				<GlassGrid cols={2}>
					{[
						{
							title: '6 Built-in Presets',
							desc: 'From minimal to compliance-ready (GDPR, HIPAA, PCI-DSS)',
						},
						{
							title: 'Automatic Detection',
							desc: 'Recognizes emails, credit cards, SSNs, tokens, and more',
						},
						{
							title: 'Deep Object Sanitization',
							desc: 'Recursively sanitizes nested objects and arrays',
						},
						{ title: 'Zero Dependencies', desc: 'Lightweight and fast, no external libraries' },
					].map((feature) => (
						<div key={feature.title} className="flex items-start gap-2">
							<span className="text-emerald-400 mt-0.5">›</span>
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
