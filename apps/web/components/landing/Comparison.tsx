'use client'

import { Container, Section } from '@/components/layout'
import { BlueprintSection } from '@/components/ui/blueprint-grid'
import { LineTitle } from '@/components/ui/line-title'
import type { ComparisonConfig } from '@/lib/content/types'
import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { Check, Minus, Xmark } from 'iconoir-react'
import { useRef } from 'react'

/**
 * Comparison - Cloudflare Sandbox inspired comparison table
 *
 * Features:
 * - Blueprint section wrapper with corners
 * - Brand color glow on Vestig column
 * - Animated table rows on scroll
 * - Updated icons with brand colors
 */

interface ComparisonProps {
	config: ComparisonConfig
}

function CellValue({ value, isVestig }: { value: string | boolean; isVestig?: boolean }) {
	if (typeof value === 'boolean') {
		return value ? (
			<div className={cn('flex items-center justify-center', isVestig && 'text-brand')}>
				<div
					className={cn(
						'w-6 h-6 rounded-full flex items-center justify-center',
						isVestig ? 'bg-brand/20' : 'bg-white/10',
					)}
				>
					<Check className="h-4 w-4" />
				</div>
			</div>
		) : (
			<div className="flex items-center justify-center text-muted-foreground/30">
				<Xmark className="h-5 w-5" />
			</div>
		)
	}

	if (value === 'Partial' || value === 'Plugin') {
		return (
			<span className="inline-flex items-center gap-1 text-muted-foreground">
				<Minus className="h-4 w-4" />
				<span className="text-xs">{value}</span>
			</span>
		)
	}

	return (
		<span
			className={cn(
				'text-sm font-mono',
				isVestig ? 'text-brand font-bold' : 'text-muted-foreground',
			)}
		>
			{value}
		</span>
	)
}

export function Comparison({ config }: ComparisonProps) {
	const libraries = ['vestig', 'pino', 'winston', 'bunyan'] as const
	const headerRef = useRef(null)
	const tableRef = useRef(null)
	const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' })
	const isTableInView = useInView(tableRef, { once: true, margin: '-50px' })

	return (
		<BlueprintSection corners className="py-24 md:py-32">
			<Container size="wide">
				{/* Section header */}
				<motion.div
					ref={headerRef}
					className="text-center mb-12 md:mb-16"
					initial={{ opacity: 0, y: 20 }}
					animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5 }}
				>
					<LineTitle variant="arc" size="xl" lines={3} className="mb-6">
						{config.title}
					</LineTitle>
					<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
						{config.description}
					</p>
				</motion.div>

				{/* Comparison table */}
				<motion.div
					ref={tableRef}
					className="overflow-x-auto"
					initial={{ opacity: 0, y: 30 }}
					animate={isTableInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
					transition={{ duration: 0.5, delay: 0.1 }}
				>
					<div className="inline-block min-w-full align-middle">
						<div className="relative overflow-hidden border border-brand/20 bg-surface">
							{/* Corner markers */}
							<div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-brand/40" />
							<div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-brand/40" />
							<div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-brand/40" />
							<div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-brand/40" />

							<table
								className="min-w-full"
								aria-label="Feature comparison between Vestig and other logging libraries"
							>
								<thead className="bg-surface-elevated">
									<tr>
										<th
											scope="col"
											className="px-6 py-4 text-left text-sm font-semibold text-foreground"
										>
											Feature
										</th>
										{libraries.map((lib) => (
											<th
												key={lib}
												scope="col"
												className={cn(
													'px-6 py-4 text-center text-sm font-semibold relative',
													lib === 'vestig' ? 'text-brand bg-brand/5' : 'text-muted-foreground',
												)}
											>
												{/* Glow effect for vestig column */}
												{lib === 'vestig' && (
													<div className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />
												)}
												<span className="relative z-10">
													{lib.charAt(0).toUpperCase() + lib.slice(1)}
												</span>
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-brand/10">
									{config.rows.map((row, index) => (
										<motion.tr
											key={row.feature}
											className={cn(
												'transition-colors hover:bg-brand/5',
												index % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated/50',
											)}
											initial={{ opacity: 0, x: -20 }}
											animate={isTableInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
											transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
										>
											<th
												scope="row"
												className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap text-left"
											>
												{row.feature}
											</th>
											{libraries.map((lib) => {
												const value = row[lib]
												const isVestig = lib === 'vestig'
												return (
													<td
														key={lib}
														className={cn(
															'px-6 py-4 text-center relative',
															isVestig && 'bg-brand/5',
														)}
													>
														{value !== undefined ? (
															<CellValue value={value} isVestig={isVestig} />
														) : (
															<Minus className="h-4 w-4 text-muted-foreground/20 mx-auto" />
														)}
													</td>
												)
											})}
										</motion.tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</motion.div>

				{/* Footnote */}
				{config.footnote && (
					<motion.p
						className="mt-8 text-sm text-muted-foreground/60 text-center"
						initial={{ opacity: 0 }}
						animate={isTableInView ? { opacity: 1 } : { opacity: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
					>
						{config.footnote}
					</motion.p>
				)}
			</Container>
		</BlueprintSection>
	)
}

export default Comparison
