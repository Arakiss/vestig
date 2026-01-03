'use client'

import { Container, Section } from '@/components/layout'
import { BlueprintSection } from '@/components/ui/blueprint-grid'
import { CodeBlock } from '@/components/ui/code-block'
import { LineTitle } from '@/components/ui/line-title'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FlowDiagram, type FlowNode } from './FlowDiagram'
import {
	ContextPropagationFlow,
	FeatureGrid,
	InteractiveFeatureCard,
	MultiRuntimeIcons,
	PIISanitizationFlow,
} from './InteractiveFeatureCard'

/**
 * InteractiveFeatures - Cloudflare Sandbox inspired features section
 *
 * Replaces the previous BentoFeatures with large 2-column cards
 * featuring interactive visualizations for each feature.
 */

// Feature content with visualizations
const features = [
	{
		id: 'pii-sanitization',
		title: 'Auto PII Sanitization',
		description:
			'Automatically detects and redacts sensitive data like passwords, emails, credit cards, and API keys before they reach your logs. GDPR & HIPAA compliant by default.',
		visualization: 'flow' as const,
		badge: 'Popular',
		link: {
			text: 'Learn more about sanitization',
			href: '/docs/security/sanitization',
		},
	},
	{
		id: 'multi-runtime',
		title: 'Run Everywhere',
		description:
			'Works seamlessly across Bun, Node.js, Deno, Edge runtimes (Vercel, Cloudflare Workers), and browsers. Automatic runtime detection with zero configuration.',
		visualization: 'icons' as const,
		link: {
			text: 'See supported runtimes',
			href: '/docs/runtime',
		},
	},
	{
		id: 'native-tracing',
		title: 'Native Distributed Tracing',
		description:
			'Built-in span-based tracing with automatic context propagation. No OpenTelemetry overhead—just simple, powerful observability.',
		visualization: 'code' as const,
		badge: 'New',
		link: {
			text: 'Tracing guide',
			href: '/docs/tracing',
		},
	},
	{
		id: 'context-propagation',
		title: 'Context That Flows',
		description:
			'AsyncLocalStorage-based context that automatically propagates through your entire request lifecycle. Correlation IDs, user context, and metadata flow effortlessly.',
		visualization: 'flow' as const,
		link: {
			text: 'Context documentation',
			href: '/docs/tracing/context',
		},
	},
	{
		id: 'zero-deps',
		title: 'Zero Dependencies',
		description:
			'No external dependencies means tiny bundle sizes (<5KB gzipped), faster installs, and zero supply chain risks. Pure TypeScript, maximum performance.',
		visualization: 'custom' as const,
		link: {
			text: 'See performance benchmarks',
			href: '/docs/features',
		},
	},
	{
		id: 'transports',
		title: 'Flexible Transports',
		description:
			'Console, HTTP, File, Datadog, and more. Create custom transports with a simple interface. Built-in batching and retry logic keeps your logs flowing.',
		visualization: 'flow' as const,
		link: {
			text: 'Transport documentation',
			href: '/docs/transports',
		},
	},
]

// Code example for tracing feature
const tracingCode = `import { log } from 'vestig'

// Automatic span creation
const result = await log.span('fetch-user', async () => {
  const user = await db.users.findById(id)
  log.info('User found', { userId: user.id })
  return user
})`

// Flow nodes for transports
const transportNodes: FlowNode[] = [
	{ id: 'log', label: 'log', type: 'start', sublabel: 'vestig' },
	{ id: 'batch', label: 'batch', type: 'process' },
	{ id: 'console', label: 'console', type: 'end' },
]

export function InteractiveFeatures() {
	const headerRef = useRef(null)
	const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' })

	return (
		<BlueprintSection corners className="py-24 md:py-32">
			<Container size="wide">
				{/* Section Header */}
				<motion.div
					ref={headerRef}
					className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
					initial={{ opacity: 0, y: 20 }}
					animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5 }}
				>
					<LineTitle variant="chevron" size="xl" lines={3} className="mb-6">
						Built for Modern Apps
					</LineTitle>
					<p className="text-lg md:text-xl text-muted-foreground">
						Everything you need for production-grade logging, without the bloat. Type-safe,
						performant, and ready for any runtime.
					</p>
				</motion.div>

				{/* Feature Cards */}
				<FeatureGrid>
					{/* PII Sanitization */}
					<InteractiveFeatureCard
						title={features[0].title}
						description={features[0].description}
						visualization="custom"
						visualizationProps={{
							custom: <PIISanitizationFlow />,
						}}
						badge={features[0].badge}
						link={features[0].link}
						delay={0}
					/>

					{/* Multi-Runtime */}
					<InteractiveFeatureCard
						title={features[1].title}
						description={features[1].description}
						visualization="custom"
						visualizationProps={{
							custom: <MultiRuntimeIcons />,
						}}
						link={features[1].link}
						reversed
						delay={0.1}
					/>

					{/* Native Tracing */}
					<InteractiveFeatureCard
						title={features[2].title}
						description={features[2].description}
						visualization="code"
						visualizationProps={{
							code: tracingCode,
							language: 'typescript',
						}}
						badge={features[2].badge}
						link={features[2].link}
						delay={0.15}
					/>

					{/* Context Propagation */}
					<InteractiveFeatureCard
						title={features[3].title}
						description={features[3].description}
						visualization="custom"
						visualizationProps={{
							custom: <ContextPropagationFlow />,
						}}
						link={features[3].link}
						reversed
						delay={0.2}
					/>

					{/* Zero Dependencies */}
					<InteractiveFeatureCard
						title={features[4].title}
						description={features[4].description}
						visualization="custom"
						visualizationProps={{
							custom: <ZeroDepsVisual />,
						}}
						link={features[4].link}
						delay={0.25}
					/>

					{/* Flexible Transports */}
					<InteractiveFeatureCard
						title={features[5].title}
						description={features[5].description}
						visualization="custom"
						visualizationProps={{
							custom: <TransportsFlow />,
						}}
						link={features[5].link}
						reversed
						delay={0.3}
					/>
				</FeatureGrid>
			</Container>
		</BlueprintSection>
	)
}

/**
 * Zero Dependencies Visual - Size comparison
 */
function ZeroDepsVisual() {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true })

	const libraries = [
		{ name: 'vestig', size: 4.8, label: '<5KB' },
		{ name: 'pino', size: 28, label: '28KB' },
		{ name: 'winston', size: 89, label: '89KB' },
		{ name: 'bunyan', size: 42, label: '42KB' },
	]

	const maxSize = Math.max(...libraries.map((l) => l.size))

	return (
		<div ref={ref} className="w-full space-y-4">
			{libraries.map((lib, i) => (
				<div key={lib.name} className="flex items-center gap-4">
					<span
						className={`w-16 text-sm font-mono ${i === 0 ? 'text-brand font-bold' : 'text-muted-foreground'}`}
					>
						{lib.name}
					</span>
					<div className="flex-1 h-6 bg-surface-elevated rounded-full overflow-hidden border border-brand/10">
						<motion.div
							className={`h-full rounded-full ${i === 0 ? 'bg-brand' : 'bg-muted-foreground/30'}`}
							initial={{ width: 0 }}
							animate={isInView ? { width: `${(lib.size / maxSize) * 100}%` } : { width: 0 }}
							transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
						/>
					</div>
					<span
						className={`w-12 text-sm font-mono text-right ${i === 0 ? 'text-brand' : 'text-muted-foreground'}`}
					>
						{lib.label}
					</span>
				</div>
			))}
			<p className="text-xs text-muted-foreground/60 text-center mt-4">
				Gzipped bundle size comparison
			</p>
		</div>
	)
}

/**
 * Transports Flow - Multiple output targets
 */
function TransportsFlow() {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true })

	const transports = [
		{ id: 'console', label: 'Console', icon: '💻' },
		{ id: 'http', label: 'HTTP', icon: '🌐' },
		{ id: 'file', label: 'File', icon: '📄' },
		{ id: 'datadog', label: 'Datadog', icon: '🐕' },
	]

	return (
		<div ref={ref} className="w-full">
			<div className="flex items-center justify-center gap-4">
				{/* Source */}
				<motion.div
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
					transition={{ duration: 0.3 }}
				>
					<div className="w-14 h-14 flex items-center justify-center bg-brand rounded-full text-brand-foreground font-bold text-lg">
						V
					</div>
					<span className="text-xs font-mono text-brand">vestig</span>
				</motion.div>

				{/* Connectors */}
				<div className="flex flex-col gap-1">
					{transports.map((_, i) => (
						<motion.div
							key={i}
							className="w-8 h-px bg-brand/50"
							initial={{ scaleX: 0 }}
							animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
							transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
							style={{ transformOrigin: 'left' }}
						/>
					))}
				</div>

				{/* Targets */}
				<div className="flex flex-col gap-2">
					{transports.map((transport, i) => (
						<motion.div
							key={transport.id}
							className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border border-brand/20 rounded-full"
							initial={{ opacity: 0, x: 10 }}
							animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
							transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
						>
							<span className="text-sm">{transport.icon}</span>
							<span className="text-xs font-mono text-muted-foreground">{transport.label}</span>
						</motion.div>
					))}
				</div>
			</div>
		</div>
	)
}

export default InteractiveFeatures
