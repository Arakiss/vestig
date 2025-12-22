import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TableProps {
	children: ReactNode
	className?: string
}

export function Table({ children, className }: TableProps) {
	return (
		<div className={cn('my-6 overflow-x-auto', className)}>
			<table className="w-full text-sm">{children}</table>
		</div>
	)
}

export function TableHead({ children }: { children: ReactNode }) {
	return <thead className="border-b border-white/10">{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
	return <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
	return <tr className={cn('hover:bg-white/[0.02] transition-colors', className)}>{children}</tr>
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<th
			className={cn(
				'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40',
				className,
			)}
		>
			{children}
		</th>
	)
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
	return <td className={cn('px-4 py-3 text-white/70', className)}>{children}</td>
}
