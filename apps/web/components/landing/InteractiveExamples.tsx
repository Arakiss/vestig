'use client'

import { Container, Section } from '@/components/layout'
import { BlueprintCard, BlueprintSection } from '@/components/ui/blueprint-grid'
import { CodeBlock, OutputBlock } from '@/components/ui/code-block'
import { LineTitle } from '@/components/ui/line-title'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ArrowRight, Check, Play } from 'iconoir-react'
import { useRef, useState } from 'react'
import { SimpleFlowIndicator } from './FlowDiagram'

/**
 * InteractiveExamples - Cloudflare Sandbox inspired examples section
 *
 * Tab-based code examples with:
 * - Vertical tab list on the left
 * - Code + output on the right
 * - Flow indicators (start → finish)
 * - Copy functionality
 */

interface Example {
	id: string
	title: string
	description: string
	code: string
	output?: string
	flow?: string[]
}

const examples: Example[] = [
	{
		id: 'basic',
		title: 'Basic Logging',
		description: 'Get started with structured logging in seconds.',
		code: `import { log } from 'vestig'

// Simple structured logging
log.info('User logged in', {
  userId: 'user_123',
  email: 'user@example.com',
  method: 'oauth'
})

// Different log levels
log.debug('Debug information')
log.warn('Warning message')
log.error('Error occurred', { code: 'E001' })`,
		output: `{"level":"info","msg":"User logged in","userId":"user_123","email":"user@example.com","method":"oauth","timestamp":"2025-01-15T10:30:00Z"}
{"level":"debug","msg":"Debug information","timestamp":"2025-01-15T10:30:00Z"}
{"level":"warn","msg":"Warning message","timestamp":"2025-01-15T10:30:01Z"}
{"level":"error","msg":"Error occurred","code":"E001","timestamp":"2025-01-15T10:30:01Z"}`,
		flow: ['import', 'configure', 'log'],
	},
	{
		id: 'sanitization',
		title: 'PII Sanitization',
		description: 'Automatically redact sensitive data from your logs.',
		code: `import { log } from 'vestig'

// Sensitive data is automatically redacted
log.info('Processing payment', {
  email: 'user@example.com',
  card: '4111-1111-1111-1111',
  password: 'secret123',
  apiKey: 'sk-1234567890'
})

// Output: sensitive fields are [REDACTED]`,
		output: `{"level":"info","msg":"Processing payment","email":"[EMAIL]","card":"[CREDIT_CARD]","password":"[REDACTED]","apiKey":"[API_KEY]","timestamp":"2025-01-15T10:30:00Z"}`,
		flow: ['input', 'detect', 'redact', 'safe'],
	},
	{
		id: 'tracing',
		title: 'Distributed Tracing',
		description: 'Track requests across your entire system with spans.',
		code: `import { log } from 'vestig'

// Create spans for operations
const result = await log.span('api-request', async (span) => {
  span.addAttribute('endpoint', '/api/users')

  const user = await log.span('db-query', async () => {
    return db.users.findById(id)
  })

  log.info('User fetched', { userId: user.id })
  return user
})

// Automatic timing and correlation`,
		output: `{"level":"info","msg":"span.start","spanId":"span_abc","name":"api-request","timestamp":"2025-01-15T10:30:00Z"}
{"level":"info","msg":"span.start","spanId":"span_def","parentId":"span_abc","name":"db-query","timestamp":"2025-01-15T10:30:00Z"}
{"level":"info","msg":"span.end","spanId":"span_def","duration":45,"timestamp":"2025-01-15T10:30:00Z"}
{"level":"info","msg":"User fetched","userId":"user_123","spanId":"span_abc","timestamp":"2025-01-15T10:30:00Z"}
{"level":"info","msg":"span.end","spanId":"span_abc","duration":52,"timestamp":"2025-01-15T10:30:00Z"}`,
		flow: ['request', 'span', 'child span', 'complete'],
	},
	{
		id: 'nextjs',
		title: 'Next.js Integration',
		description: 'Seamless integration with Next.js App Router.',
		code: `// app/api/users/route.ts
import { log } from 'vestig'
import { withLogging } from 'vestig/next'

export const GET = withLogging(async (request) => {
  // Request context automatically available
  log.info('Fetching users', {
    path: request.url,
    method: 'GET'
  })

  const users = await db.users.findMany()

  log.info('Users fetched', { count: users.length })

  return Response.json(users)
})`,
		output: `{"level":"info","msg":"Fetching users","path":"/api/users","method":"GET","requestId":"req_xyz","timestamp":"2025-01-15T10:30:00Z"}
{"level":"info","msg":"Users fetched","count":42,"requestId":"req_xyz","timestamp":"2025-01-15T10:30:01Z"}`,
		flow: ['request', 'middleware', 'handler', 'response'],
	},
]

export function InteractiveExamples() {
	const [activeExample, setActiveExample] = useState(examples[0])
	const headerRef = useRef(null)
	const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' })

	return (
		<Section className="py-24 md:py-32 bg-background">
			<Container size="wide">
				{/* Section Header */}
				<motion.div
					ref={headerRef}
					className="text-center max-w-3xl mx-auto mb-12 md:mb-16"
					initial={{ opacity: 0, y: 20 }}
					animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5 }}
				>
					<LineTitle variant="parallel" size="xl" lines={3} className="mb-6">
						See It in Action
					</LineTitle>
					<p className="text-lg md:text-xl text-muted-foreground">
						From basic logging to distributed tracing, vestig handles it all with elegant
						simplicity.
					</p>
				</motion.div>

				{/* Examples Container */}
				<motion.div
					className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
					initial={{ opacity: 0, y: 30 }}
					animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					{/* Tab List - Left Side */}
					<div className="lg:col-span-4 xl:col-span-3">
						<div className="space-y-2">
							{examples.map((example, i) => (
								<TabButton
									key={example.id}
									example={example}
									isActive={activeExample.id === example.id}
									onClick={() => setActiveExample(example)}
									index={i}
								/>
							))}
						</div>
					</div>

					{/* Code + Output - Right Side */}
					<div className="lg:col-span-8 xl:col-span-9">
						<BlueprintCard corners glow className="overflow-hidden">
							<AnimatePresence mode="wait">
								<motion.div
									key={activeExample.id}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3 }}
								>
									{/* Header with Flow */}
									<div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-b border-brand/10">
										<div className="flex items-center gap-3">
											<div className="flex items-center gap-1.5">
												<div className="w-3 h-3 rounded-full bg-red-500/60" />
												<div className="w-3 h-3 rounded-full bg-yellow-500/60" />
												<div className="w-3 h-3 rounded-full bg-green-500/60" />
											</div>
											<span className="text-sm font-mono text-muted-foreground">
												{activeExample.title.toLowerCase().replace(/\s+/g, '-')}.ts
											</span>
										</div>
										{activeExample.flow && (
											<SimpleFlowIndicator steps={activeExample.flow} className="hidden md:flex" />
										)}
									</div>

									{/* Code Section */}
									<div className="p-0">
										<CodeBlock
											code={activeExample.code}
											language="typescript"
											copyable={false}
											className="rounded-none border-0"
										/>
									</div>

									{/* Output Section */}
									{activeExample.output && (
										<div className="border-t border-brand/10">
											<div className="px-6 py-2 bg-surface border-b border-brand/10">
												<div className="flex items-center gap-2">
													<Play className="w-4 h-4 text-brand" />
													<span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
														Output
													</span>
												</div>
											</div>
											<OutputBlock
												lines={activeExample.output.split('\n')}
												className="max-h-48 overflow-y-auto"
											/>
										</div>
									)}
								</motion.div>
							</AnimatePresence>
						</BlueprintCard>
					</div>
				</motion.div>
			</Container>
		</Section>
	)
}

/**
 * Tab Button Component
 */
interface TabButtonProps {
	example: Example
	isActive: boolean
	onClick: () => void
	index: number
}

function TabButton({ example, isActive, onClick, index }: TabButtonProps) {
	return (
		<motion.button
			onClick={onClick}
			className={cn(
				'w-full text-left p-4 rounded-lg transition-all duration-200',
				'border border-transparent',
				isActive
					? 'bg-brand/10 border-brand/30 text-foreground'
					: 'bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground',
			)}
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
			whileHover={{ x: isActive ? 0 : 4 }}
		>
			<div className="flex items-start gap-3">
				{/* Step indicator */}
				<div
					className={cn(
						'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5',
						isActive
							? 'bg-brand text-brand-foreground'
							: 'bg-surface-elevated text-muted-foreground',
					)}
				>
					{isActive ? <Check className="w-3 h-3" /> : index + 1}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className={cn('font-medium', isActive && 'text-brand')}>{example.title}</span>
						{isActive && <ArrowRight className="w-4 h-4 text-brand" />}
					</div>
					<p className="text-sm text-muted-foreground mt-1 line-clamp-2">{example.description}</p>
				</div>
			</div>
		</motion.button>
	)
}

export default InteractiveExamples
