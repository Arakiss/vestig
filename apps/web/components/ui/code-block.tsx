'use client'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Check, Copy } from 'iconoir-react'

/**
 * CodeBlock - Syntax-highlighted code block with Cloudflare-style coloring
 *
 * Features:
 * - Keywords: white bold
 * - Strings: amber (#f59e0b)
 * - Comments: gray muted
 * - Copy button with feedback
 * - Optional line numbers
 * - Optional terminal output preview
 */

interface CodeBlockProps {
	/** Code content */
	code: string
	/** Programming language */
	language?: 'typescript' | 'javascript' | 'json' | 'bash' | 'text'
	/** Show line numbers */
	lineNumbers?: boolean
	/** Lines to highlight (1-indexed) */
	highlightLines?: number[]
	/** Show copy button */
	copyable?: boolean
	/** Optional file name/title */
	title?: string
	/** Optional output to show below code */
	output?: string
	/** Additional CSS classes */
	className?: string
}

export function CodeBlock({
	code,
	language = 'typescript',
	lineNumbers = false,
	highlightLines = [],
	copyable = true,
	title,
	output,
	className,
}: CodeBlockProps) {
	const { copied, copy } = useCopyToClipboard()

	const handleCopy = () => copy(code)

	const lines = code.split('\n')

	return (
		<div className={cn('relative group', className)}>
			{/* Header with title and copy button */}
			{(title || copyable) && (
				<div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-brand/10">
					{title && <span className="text-sm font-mono text-muted-foreground">{title}</span>}
					{copyable && (
						<button
							type="button"
							onClick={handleCopy}
							className={cn(
								'p-1.5 rounded transition-all duration-200',
								'text-muted-foreground hover:text-foreground',
								'hover:bg-brand/10',
								copied && 'text-brand',
							)}
							aria-label={copied ? 'Copied!' : 'Copy code'}
						>
							{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
						</button>
					)}
				</div>
			)}

			{/* Code content */}
			<div className="relative overflow-x-auto">
				<pre className="p-4 bg-surface font-mono text-sm leading-normal">
					<code>
						{lines.map((line, i) => (
							<div
								key={i}
								className={cn('flex', highlightLines.includes(i + 1) && 'bg-brand/10 -mx-4 px-4')}
							>
								{lineNumbers && (
									<span className="w-8 shrink-0 text-muted-foreground/50 select-none text-right pr-4">
										{i + 1}
									</span>
								)}
								<span className="flex-1">{highlightSyntax(line, language)}</span>
							</div>
						))}
					</code>
				</pre>
			</div>

			{/* Output section */}
			{output && (
				<div className="border-t border-brand/10">
					<div className="px-4 py-2 bg-surface-elevated">
						<span className="text-xs font-mono text-muted-foreground">Output</span>
					</div>
					<pre className="p-4 bg-black font-mono text-sm text-brand">{output}</pre>
				</div>
			)}
		</div>
	)
}

/**
 * Simple syntax highlighting
 * Keywords: white bold
 * Strings: amber
 * Comments: gray
 * Numbers: brand color
 */
function highlightSyntax(line: string, language: string): React.ReactNode {
	if (language === 'text' || language === 'bash') {
		// For bash, highlight $ prompt and commands differently
		if (language === 'bash' && line.startsWith('$')) {
			return (
				<>
					<span className="text-muted-foreground">$ </span>
					<span className="text-foreground">{line.slice(2)}</span>
				</>
			)
		}
		return <span className="text-foreground">{line}</span>
	}

	// TypeScript/JavaScript keywords
	const keywords = [
		'import',
		'export',
		'from',
		'const',
		'let',
		'var',
		'function',
		'return',
		'if',
		'else',
		'for',
		'while',
		'class',
		'interface',
		'type',
		'async',
		'await',
		'new',
		'try',
		'catch',
		'throw',
		'default',
		'true',
		'false',
		'null',
		'undefined',
	]

	// Tokenize the line
	const tokens: { type: 'keyword' | 'string' | 'comment' | 'number' | 'text'; value: string }[] = []
	let remaining = line

	while (remaining.length > 0) {
		// Check for comments
		if (remaining.startsWith('//')) {
			tokens.push({ type: 'comment', value: remaining })
			break
		}

		// Check for strings (single or double quotes)
		const stringMatch = remaining.match(/^(['"`])(?:[^\\]|\\.)*?\1/)
		if (stringMatch) {
			tokens.push({ type: 'string', value: stringMatch[0] })
			remaining = remaining.slice(stringMatch[0].length)
			continue
		}

		// Check for template literal start
		if (remaining.startsWith('`')) {
			const endIndex = remaining.indexOf('`', 1)
			if (endIndex > 0) {
				tokens.push({ type: 'string', value: remaining.slice(0, endIndex + 1) })
				remaining = remaining.slice(endIndex + 1)
				continue
			}
		}

		// Check for keywords
		let foundKeyword = false
		for (const kw of keywords) {
			const regex = new RegExp(`^\\b${kw}\\b`)
			if (regex.test(remaining)) {
				tokens.push({ type: 'keyword', value: kw })
				remaining = remaining.slice(kw.length)
				foundKeyword = true
				break
			}
		}
		if (foundKeyword) continue

		// Check for numbers
		const numberMatch = remaining.match(/^\b\d+\.?\d*\b/)
		if (numberMatch) {
			tokens.push({ type: 'number', value: numberMatch[0] })
			remaining = remaining.slice(numberMatch[0].length)
			continue
		}

		// Default: take one character as text
		tokens.push({ type: 'text', value: remaining[0] })
		remaining = remaining.slice(1)
	}

	return (
		<>
			{tokens.map((token, i) => {
				switch (token.type) {
					case 'keyword':
						return (
							<span key={i} className="text-foreground font-semibold">
								{token.value}
							</span>
						)
					case 'string':
						return (
							<span key={i} className="text-accent-amber">
								{token.value}
							</span>
						)
					case 'comment':
						return (
							<span key={i} className="text-muted-foreground italic">
								{token.value}
							</span>
						)
					case 'number':
						return (
							<span key={i} className="text-brand">
								{token.value}
							</span>
						)
					default:
						return <span key={i}>{token.value}</span>
				}
			})}
		</>
	)
}

/**
 * InlineCode - Styled inline code snippet
 */
interface InlineCodeProps {
	children: React.ReactNode
	className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
	return (
		<code
			className={cn(
				'px-1.5 py-0.5 font-mono text-sm',
				'bg-surface-elevated text-brand',
				'border border-brand/20',
				className,
			)}
		>
			{children}
		</code>
	)
}

/**
 * TerminalBlock - Terminal-style code block with prompt
 */
interface TerminalBlockProps {
	commands: string[]
	className?: string
}

export function TerminalBlock({ commands, className }: TerminalBlockProps) {
	const { copied, copy } = useCopyToClipboard()

	const handleCopy = () => copy(commands.join('\n'))

	return (
		<div className={cn('relative group', className)}>
			{/* Terminal header */}
			<div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-brand/10">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-red-500/60" />
					<div className="w-3 h-3 rounded-full bg-yellow-500/60" />
					<div className="w-3 h-3 rounded-full bg-green-500/60" />
				</div>
				<button
					type="button"
					onClick={handleCopy}
					className={cn(
						'p-1.5 rounded transition-all duration-200',
						'text-muted-foreground hover:text-foreground',
						'hover:bg-brand/10',
						copied && 'text-brand',
					)}
					aria-label={copied ? 'Copied!' : 'Copy commands'}
				>
					{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
				</button>
			</div>

			{/* Terminal content */}
			<pre className="p-4 bg-black font-mono text-sm">
				{commands.map((cmd, i) => (
					<div key={i} className="flex">
						<span className="text-brand mr-2">$</span>
						<span className="text-foreground">{cmd}</span>
					</div>
				))}
			</pre>
		</div>
	)
}

/**
 * OutputBlock - Simple output display for JSON/log output
 */
interface OutputBlockProps {
	lines: string[]
	className?: string
}

export function OutputBlock({ lines, className }: OutputBlockProps) {
	return (
		<pre
			className={cn(
				'p-4 bg-black font-mono text-xs leading-normal text-muted-foreground',
				className,
			)}
		>
			{lines.map((line, i) => (
				<div key={i} className="whitespace-pre-wrap break-all">
					{line}
				</div>
			))}
		</pre>
	)
}

export default CodeBlock
