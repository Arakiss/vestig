'use client'

import { cn } from '@/lib/utils'
import { Check, Copy, Terminal } from 'iconoir-react'
import { useState } from 'react'

interface CodeBlockProps {
	children: string
	language?: string
	filename?: string
	showLineNumbers?: boolean
	highlight?: number[]
	className?: string
}

export function CodeBlock({
	children,
	language = 'typescript',
	filename,
	showLineNumbers = false,
	highlight = [],
	className,
}: CodeBlockProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(children)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const lines = children.trim().split('\n')

	return (
		<div
			className={cn(
				'relative group my-6 bg-surface border border-white/[0.06] overflow-hidden',
				className,
			)}
		>
			{/* Header with filename or language badge */}
			{filename ? (
				<div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
					<div className="flex items-center gap-2">
						<Terminal className="h-3.5 w-3.5 text-white/40" />
						<span className="text-xs font-mono text-white/50">{filename}</span>
					</div>
					<span className="text-[10px] uppercase tracking-widest text-white/30">{language}</span>
				</div>
			) : (
				<div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
					<span className="text-[10px] uppercase tracking-widest text-white/30">{language}</span>
				</div>
			)}

			{/* Code content */}
			<div className="relative overflow-x-auto scrollbar-thin">
				<pre className="!p-4 text-sm leading-relaxed font-mono !bg-transparent !border-0 !m-0">
					<code className="!bg-transparent !p-0">
						{lines.map((line, i) => (
							<div
								key={i}
								className={cn('flex', highlight.includes(i + 1) && 'bg-white/[0.05] -mx-4 px-4')}
							>
								{showLineNumbers && (
									<span className="select-none text-white/20 w-8 pr-4 text-right shrink-0">
										{i + 1}
									</span>
								)}
								<span className="flex-1 text-white/70">{line || ' '}</span>
							</div>
						))}
					</code>
				</pre>
			</div>

			{/* Copy button */}
			<button
				onClick={handleCopy}
				className={cn(
					'absolute top-2 right-2 p-2 bg-white/5 border border-white/10',
					'opacity-0 group-hover:opacity-100 transition-all duration-200',
					'hover:bg-white/10 hover:border-white/20',
				)}
				aria-label="Copy code"
			>
				{copied ? (
					<Check className="h-4 w-4 text-white/70" />
				) : (
					<Copy className="h-4 w-4 text-white/40" />
				)}
			</button>
		</div>
	)
}

/**
 * Inline code component
 */
export function InlineCode({ children }: { children: React.ReactNode }) {
	return (
		<code className="px-1.5 py-0.5 bg-white/10 text-white/90 text-sm font-mono">{children}</code>
	)
}
