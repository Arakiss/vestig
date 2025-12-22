import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ApiParam {
	name: string
	type: string
	default?: string
	required?: boolean
	description: string
}

interface ApiTableProps {
	title?: string
	params: ApiParam[]
	className?: string
}

export function ApiTable({ title, params, className }: ApiTableProps) {
	return (
		<div className={cn('my-6', className)}>
			{title && <h4 className="text-sm font-semibold text-white mb-3">{title}</h4>}
			<div className="border border-white/[0.06] overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-white/10 bg-white/[0.02]">
							<th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40">
								Parameter
							</th>
							<th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40">
								Type
							</th>
							<th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40">
								Default
							</th>
							<th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40">
								Description
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-white/[0.06]">
						{params.map((param) => (
							<tr key={param.name} className="hover:bg-white/[0.02] transition-colors">
								<td className="px-4 py-3">
									<code className="text-white font-mono text-sm">{param.name}</code>
									{param.required && (
										<span className="ml-1.5 text-[10px] text-red-400/70 uppercase">required</span>
									)}
								</td>
								<td className="px-4 py-3">
									<code className="text-white/50 font-mono text-sm">{param.type}</code>
								</td>
								<td className="px-4 py-3 text-white/40">
									{param.default ? (
										<code className="font-mono text-sm">{param.default}</code>
									) : (
										<span className="text-white/20">—</span>
									)}
								</td>
								<td className="px-4 py-3 text-white/60">{param.description}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

interface MethodSignatureProps {
	name: string
	params?: string
	returns?: string
	async?: boolean
}

export function MethodSignature({
	name,
	params = '',
	returns,
	async: isAsync,
}: MethodSignatureProps) {
	return (
		<div className="my-4 p-4 bg-surface border border-white/[0.06] font-mono text-sm">
			<span className="text-white/40">{isAsync ? 'async ' : ''}</span>
			<span className="text-white font-semibold">{name}</span>
			<span className="text-white/40">(</span>
			<span className="text-white/70">{params}</span>
			<span className="text-white/40">)</span>
			{returns && (
				<>
					<span className="text-white/40">: </span>
					<span className="text-white/70">{returns}</span>
				</>
			)}
		</div>
	)
}
