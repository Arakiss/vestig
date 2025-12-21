import { Check, Xmark, Minus } from 'iconoir-react'
import type { ComparisonConfig } from '@/lib/content/types'
import { Container, Section } from '@/components/layout'
import { cn } from '@/lib/utils'

interface ComparisonProps {
	config: ComparisonConfig
}

function CellValue({ value }: { value: string | boolean }) {
	if (typeof value === 'boolean') {
		return value ? (
			<Check className="h-5 w-5 text-white mx-auto" />
		) : (
			<Xmark className="h-5 w-5 text-white/20 mx-auto" />
		)
	}

	if (value === 'Partial' || value === 'Plugin') {
		return (
			<span className="inline-flex items-center gap-1 text-white/50">
				<Minus className="h-4 w-4" />
				<span className="text-sm">{value}</span>
			</span>
		)
	}

	return <span className="text-sm text-white/70">{value}</span>
}

export function Comparison({ config }: ComparisonProps) {
	const libraries = ['vestig', 'pino', 'winston', 'bunyan'] as const

	return (
		<Section id="comparison" spacing="lg" divider>
			<Container>
				{/* Section header */}
				<div className="text-center mb-20">
					<h2 className="text-4xl md:text-5xl font-bold text-white">{config.title}</h2>
					<p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto">{config.description}</p>
				</div>

				{/* Comparison table */}
				<div className="overflow-x-auto">
					<div className="inline-block min-w-full align-middle">
						<div className="overflow-hidden border border-white/10">
							<table className="min-w-full">
								<thead className="bg-white/[0.02]">
									<tr>
										<th className="px-6 py-4 text-left text-sm font-semibold text-white">
											Feature
										</th>
										{libraries.map((lib) => (
											<th
												key={lib}
												className={cn(
													'px-6 py-4 text-center text-sm font-semibold',
													lib === 'vestig' ? 'text-white bg-white/5' : 'text-white/70',
												)}
											>
												{lib.charAt(0).toUpperCase() + lib.slice(1)}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-white/10">
									{config.rows.map((row, index) => (
										<tr
											key={row.feature}
											className={cn(
												'transition-colors hover:bg-white/[0.02]',
												index % 2 === 0 ? 'bg-black' : 'bg-white/[0.01]',
											)}
										>
											<td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
												{row.feature}
											</td>
											{libraries.map((lib) => {
												const value = row[lib]
												return (
													<td
														key={lib}
														className={cn(
															'px-6 py-4 text-center',
															lib === 'vestig' && 'bg-white/5',
														)}
													>
														{value !== undefined ? (
															<CellValue value={value} />
														) : (
															<Minus className="h-4 w-4 text-white/10 mx-auto" />
														)}
													</td>
												)
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Footnote */}
				{config.footnote && (
					<p className="mt-8 text-sm text-white/40 text-center">{config.footnote}</p>
				)}
			</Container>
		</Section>
	)
}
