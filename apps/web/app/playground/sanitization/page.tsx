import { DemoCard, DemoResult } from '@/app/components/demo-card'
import { FullRuntimeBadge } from '@/app/components/runtime-badge'
import { getLogger, getRequestContext } from '@vestig/next'
import { IS_SERVER, RUNTIME, Sanitizer, PRESETS, type SanitizePreset } from 'vestig'

/**
 * Sample data containing various types of PII
 */
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

/**
 * PII Sanitization Demo Page
 *
 * Interactive comparison of all sanitization presets side-by-side.
 */
export default async function SanitizationPage() {
	const log = await getLogger('sanitization-demo')
	const ctx = await getRequestContext()

	log.info('PII Sanitization demo page rendering', {
		route: '/playground/sanitization',
		runtime: RUNTIME,
		isServer: IS_SERVER,
		requestId: ctx.requestId,
	})

	// Sanitize the sample data with each preset
	const sanitizedResults = Object.entries(PRESETS).map(([name]) => {
		const sanitizer = Sanitizer.fromPreset(name as SanitizePreset)
		return {
			name,
			description: presetDescriptions[name] || '',
			result: sanitizer.sanitize(sampleData),
		}
	})

	return (
		<div className="max-w-5xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-3xl">🔒</span>
					<h1 className="text-2xl font-bold text-white">PII Sanitization</h1>
				</div>
				<p className="text-gray-400 mb-4">
					Compare all sanitization presets side-by-side. See how different compliance requirements
					affect data masking.
				</p>
				<FullRuntimeBadge runtime={RUNTIME} isServer={IS_SERVER} />
			</div>

			{/* Sample data */}
			<DemoCard
				title="Sample Data (Unsanitized)"
				description="This is the raw data that will be sanitized with each preset"
				icon="📋"
			>
				<DemoResult>
					<pre className="text-xs text-gray-300 overflow-x-auto">
						{JSON.stringify(sampleData, null, 2)}
					</pre>
				</DemoResult>
			</DemoCard>

			{/* Preset comparisons */}
			<div className="mt-8 space-y-6">
				<h2 className="text-xl font-semibold text-white">Preset Comparison</h2>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{sanitizedResults.map(({ name, description, result }) => (
						<div
							key={name}
							className="bg-gray-900/50 border border-white/10 rounded-lg overflow-hidden"
						>
							<div className="px-4 py-3 border-b border-white/10 bg-gray-800/50">
								<div className="flex items-center gap-2">
									<span
										className={`px-2 py-0.5 rounded text-xs font-medium ${
											name === 'none'
												? 'bg-red-500/20 text-red-400'
												: name === 'minimal'
													? 'bg-yellow-500/20 text-yellow-400'
													: name === 'default'
														? 'bg-blue-500/20 text-blue-400'
														: 'bg-green-500/20 text-green-400'
										}`}
									>
										{name.toUpperCase()}
									</span>
								</div>
								<p className="text-xs text-gray-500 mt-1">{description}</p>
							</div>
							<div className="p-4">
								<pre className="text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
									{JSON.stringify(result, null, 2)}
								</pre>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Code example */}
			<div className="mt-8">
				<DemoCard
					title="Code Example"
					description="How to use sanitization presets in your code"
					icon="📝"
					code={`import { createLogger, sanitize } from 'vestig'

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
const cleanData = sanitize(userData, { preset: 'hipaa' })`}
				/>
			</div>

			{/* Field types */}
			<div className="mt-8">
				<DemoCard
					title="Sanitized Field Types"
					description="Types of data automatically detected and sanitized"
					icon="🔍"
				>
					<DemoResult>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
							{[
								{ field: 'password', icon: '🔐' },
								{ field: 'email', icon: '📧' },
								{ field: 'creditCard', icon: '💳' },
								{ field: 'ssn', icon: '🆔' },
								{ field: 'phone', icon: '📱' },
								{ field: 'apiKey', icon: '🔑' },
								{ field: 'token', icon: '🎫' },
								{ field: 'secret', icon: '🤫' },
								{ field: 'address', icon: '🏠' },
							].map(({ field, icon }) => (
								<div
									key={field}
									className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded"
								>
									<span>{icon}</span>
									<span className="text-gray-300">{field}</span>
								</div>
							))}
						</div>
					</DemoResult>
				</DemoCard>
			</div>

			{/* Key points */}
			<div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6">
				<h3 className="text-sm font-semibold text-green-400 mb-3">✅ Key Features</h3>
				<ul className="text-sm text-gray-400 space-y-2">
					<li>
						• <strong className="text-white">6 Built-in Presets</strong> — From minimal to
						compliance-ready (GDPR, HIPAA, PCI-DSS)
					</li>
					<li>
						• <strong className="text-white">Automatic Detection</strong> — Recognizes emails,
						credit cards, SSNs, tokens, and more
					</li>
					<li>
						• <strong className="text-white">Deep Object Sanitization</strong> — Recursively
						sanitizes nested objects and arrays
					</li>
					<li>
						• <strong className="text-white">Custom Patterns</strong> — Add your own field matchers
						and regex patterns
					</li>
					<li>
						• <strong className="text-white">Zero Dependencies</strong> — Lightweight and fast, no
						external libraries
					</li>
				</ul>
			</div>
		</div>
	)
}
