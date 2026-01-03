'use client'

import {
	GlassButton,
	GlassCard,
	GlassCardBadge,
	GlassCardDescription,
	GlassCardHeader,
	GlassCardTitle,
	GlassGrid,
} from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import {
	Antenna,
	DatabaseScript,
	Flash,
	GraphUp,
	KeyframesCouple,
	Laptop,
	Lock,
	Play,
	PlugTypeA,
	Server,
	Sparks,
	ViewGrid,
	WarningTriangle,
} from 'iconoir-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * New v0.8 feature demos - showcased prominently
 */
const newFeatures = [
	{
		title: 'Dev Overlay',
		description: 'Real-time log viewer with filtering, search, and metrics.',
		icon: <ViewGrid className="h-5 w-5" />,
		href: '/playground/dev-overlay',
		color: 'indigo',
	},
	{
		title: 'Web Vitals',
		description: 'Core Web Vitals monitoring with LCP, CLS, INP tracking.',
		icon: <GraphUp className="h-5 w-5" />,
		href: '/playground/web-vitals',
		color: 'emerald',
	},
	{
		title: 'Error Boundary',
		description: 'Enhanced error handling with breadcrumbs and fingerprinting.',
		icon: <WarningTriangle className="h-5 w-5" />,
		href: '/playground/error-boundary',
		color: 'amber',
	},
	{
		title: 'Database Logging',
		description: 'Query logging for Prisma and Drizzle with slow query detection.',
		icon: <DatabaseScript className="h-5 w-5" />,
		href: '/playground/database',
		color: 'violet',
	},
]

/**
 * Core demo categories
 */
const coreDemos = [
	{
		title: 'Server Components',
		description: 'Logging in React Server Components with automatic runtime detection.',
		icon: <Server className="h-5 w-5" />,
		href: '/playground/server',
	},
	{
		title: 'Client Components',
		description: 'Browser-side logging with PII sanitization.',
		icon: <Laptop className="h-5 w-5" />,
		href: '/playground/client',
	},
	{
		title: 'API Routes',
		description: 'Request lifecycle logging with correlation IDs.',
		icon: <PlugTypeA className="h-5 w-5" />,
		href: '/playground/api-routes',
	},
	{
		title: 'Edge Runtime',
		description: 'Lightweight logging in edge functions.',
		icon: <Flash className="h-5 w-5" />,
		href: '/playground/edge',
	},
	{
		title: 'Server Actions',
		description: 'Logging in server actions for mutations.',
		icon: <Play className="h-5 w-5" />,
		href: '/playground/actions',
	},
	{
		title: 'PII Sanitization',
		description: 'Interactive demo of all sanitization presets.',
		icon: <Lock className="h-5 w-5" />,
		href: '/playground/sanitization',
	},
	{
		title: 'Transports',
		description: 'Multi-transport configuration demo.',
		icon: <Antenna className="h-5 w-5" />,
		href: '/playground/transports',
	},
]

const stats = [
	{ value: '5', label: 'Runtimes', sublabel: 'Node, Bun, Edge, Browser, Deno' },
	{ value: '6', label: 'Presets', sublabel: 'GDPR, HIPAA, PCI-DSS, Strict, Relaxed, None' },
	{ value: '4', label: 'Transports', sublabel: 'Console, HTTP, File, Datadog' },
	{ value: '0', label: 'Dependencies', sublabel: 'Zero external deps' },
]

/**
 * Feature card color variants
 */
const colorStyles = {
	indigo: {
		iconBg: 'from-indigo-500/20 to-violet-500/20',
		iconColor: 'text-indigo-400',
		border: 'border-indigo-500/20',
		glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
	},
	emerald: {
		iconBg: 'from-emerald-500/20 to-teal-500/20',
		iconColor: 'text-emerald-400',
		border: 'border-emerald-500/20',
		glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
	},
	amber: {
		iconBg: 'from-amber-500/20 to-orange-500/20',
		iconColor: 'text-amber-400',
		border: 'border-amber-500/20',
		glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
	},
	violet: {
		iconBg: 'from-violet-500/20 to-purple-500/20',
		iconColor: 'text-violet-400',
		border: 'border-violet-500/20',
		glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
	},
}

function FeatureCard({
	title,
	description,
	icon,
	href,
	color,
}: {
	title: string
	description: string
	icon: React.ReactNode
	href: string
	color: keyof typeof colorStyles
}) {
	const styles = colorStyles[color]
	const router = useRouter()

	return (
		<GlassCard
			variant="glow"
			hover
			padding="lg"
			className={`cursor-pointer ${styles.border} ${styles.glow} transition-all duration-300`}
			onClick={() => router.push(href)}
		>
			<div className="flex items-start gap-4">
				<div
					className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${styles.iconBg} border border-white/10`}
				>
					<span className={styles.iconColor}>{icon}</span>
				</div>
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-lg font-semibold text-white">{title}</h3>
						<GlassCardBadge variant="new">New</GlassCardBadge>
					</div>
					<p className="text-sm text-white/50 leading-relaxed">{description}</p>
				</div>
			</div>
		</GlassCard>
	)
}

function DemoCard({
	title,
	description,
	icon,
	href,
}: {
	title: string
	description: string
	icon: React.ReactNode
	href: string
}) {
	return (
		<Link href={href}>
			<GlassCard variant="subtle" hover padding="md" className="h-full">
				<div className="flex items-start gap-3">
					<div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10">
						<span className="text-white/60">{icon}</span>
					</div>
					<div className="flex-1 min-w-0">
						<h4 className="text-sm font-medium text-white mb-0.5">{title}</h4>
						<p className="text-xs text-white/40 line-clamp-2">{description}</p>
					</div>
				</div>
			</GlassCard>
		</Link>
	)
}

function StatCard({
	value,
	label,
	sublabel,
}: {
	value: string
	label: string
	sublabel: string
}) {
	return (
		<GlassCard variant="subtle" padding="md" hover={false}>
			<div className="text-center">
				<div className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
					{value}
				</div>
				<div className="text-xs font-medium text-white/70 uppercase tracking-wider mt-1">
					{label}
				</div>
				<div className="text-[10px] text-white/30 mt-0.5 truncate">{sublabel}</div>
			</div>
		</GlassCard>
	)
}

export default function PlaygroundPage() {
	return (
		<Container size="wide">
			{/* Hero section with glassmorphism */}
			<div className="relative mb-16">
				{/* Background glow effect */}
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative text-center pt-8">
					<div className="inline-flex items-center gap-2 mb-6">
						<span className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
							v0.8.0
						</span>
						<span className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/50 bg-white/5 border border-white/10 rounded-full">
							Interactive
						</span>
					</div>

					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						<span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
							Vestig Playground
						</span>
					</h1>

					<p className="text-lg text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
						Explore vestig's capabilities across all Next.js execution contexts. See logging in
						action with the new Dev Overlay in the bottom-right corner.
					</p>

					<div className="flex items-center justify-center gap-4">
						<Link href="/docs">
							<GlassButton variant="secondary" size="lg" icon={<Sparks className="h-4 w-4" />}>
								View Docs
							</GlassButton>
						</Link>
						<Link href="/playground/dev-overlay">
							<GlassButton
								variant="primary"
								size="lg"
								icon={<KeyframesCouple className="h-4 w-4" />}
							>
								Try Dev Overlay
							</GlassButton>
						</Link>
					</div>
				</div>
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
				{stats.map((stat, index) => (
					<div
						key={stat.label}
						className="animate-in fade-in slide-in-from-bottom-2"
						style={{ animationDelay: `${index * 100}ms` }}
					>
						<StatCard {...stat} />
					</div>
				))}
			</div>

			{/* New in v0.8 section */}
			<div className="mb-16">
				<div className="flex items-center gap-3 mb-6">
					<h2 className="text-xl font-semibold text-white">New in v0.8</h2>
					<div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{newFeatures.map((feature, index) => (
						<div
							key={feature.href}
							className="animate-in fade-in slide-in-from-bottom-2"
							style={{ animationDelay: `${200 + index * 100}ms` }}
						>
							<FeatureCard {...feature} color={feature.color as keyof typeof colorStyles} />
						</div>
					))}
				</div>
			</div>

			{/* Core demos section */}
			<div className="mb-16">
				<div className="flex items-center gap-3 mb-6">
					<h2 className="text-xl font-semibold text-white">Core Demos</h2>
					<div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
				</div>

				<GlassGrid cols={3}>
					{coreDemos.map((demo, index) => (
						<div
							key={demo.href}
							className="animate-in fade-in slide-in-from-bottom-2"
							style={{ animationDelay: `${400 + index * 50}ms` }}
						>
							<DemoCard {...demo} />
						</div>
					))}
				</GlassGrid>
			</div>

			{/* Instructions card */}
			<GlassCard variant="default" padding="lg" className="border-indigo-500/20">
				<div className="flex items-start gap-4">
					<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10">
						<ViewGrid className="h-5 w-5 text-indigo-400" />
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-white mb-2">Using the Dev Overlay</h3>
						<p className="text-sm text-white/50 leading-relaxed mb-4">
							The Dev Overlay is visible in the bottom-right corner. Click on any demo to generate
							logs, then use the overlay to view them in real-time. Try the keyboard shortcut{' '}
							<kbd className="px-1.5 py-0.5 text-xs bg-white/10 border border-white/20 rounded">
								⌘+L
							</kbd>{' '}
							to toggle the overlay.
						</p>
						<div className="flex flex-wrap gap-2">
							<span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
								🔍 Search logs
							</span>
							<span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
								🏷️ Filter by level
							</span>
							<span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
								📊 View metrics
							</span>
							<span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
								⚙️ Configure settings
							</span>
						</div>
					</div>
				</div>
			</GlassCard>
		</Container>
	)
}
