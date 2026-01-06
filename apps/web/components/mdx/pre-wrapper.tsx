'use client'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Check, Copy } from 'iconoir-react'
import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react'
import { codeToHtml } from 'shiki'

interface PreWrapperProps {
	children: ReactNode
	className?: string
	'data-language'?: string
}

// Parse meta string for features like {1,3-5} for highlighting or showLineNumbers
function parseMetaString(meta: string | undefined): {
	highlightLines: Set<number>
	showLineNumbers: boolean
	filename: string | null
} {
	const highlightLines = new Set<number>()
	let showLineNumbers = true // Default to showing line numbers
	let filename: string | null = null

	if (!meta) return { highlightLines, showLineNumbers, filename }

	// Parse highlight ranges like {1,3-5,8}
	const highlightMatch = meta.match(/\{([^}]+)\}/)
	if (highlightMatch) {
		const ranges = highlightMatch[1].split(',')
		for (const range of ranges) {
			if (range.includes('-')) {
				const [start, end] = range.split('-').map(Number)
				for (let i = start; i <= end; i++) {
					highlightLines.add(i)
				}
			} else {
				highlightLines.add(Number(range))
			}
		}
	}

	// Parse showLineNumbers=false
	if (meta.includes('showLineNumbers=false')) {
		showLineNumbers = false
	}

	// Parse filename like title="app.ts" or filename="app.ts"
	const filenameMatch = meta.match(/(?:title|filename)="([^"]+)"/)
	if (filenameMatch) {
		filename = filenameMatch[1]
	}

	return { highlightLines, showLineNumbers, filename }
}

// Extract lines from Shiki HTML output
function extractLinesFromHtml(html: string): string[] {
	// Shiki structure: <code><span class="line">content</span>\n<span class="line">content</span></code>
	// We need to handle nested spans within each line

	// First, extract content inside <code>...</code>
	const codeMatch = html.match(/<code[^>]*>([\s\S]*)<\/code>/)
	if (!codeMatch) return []

	const codeContent = codeMatch[1]

	// Split by the line span boundaries
	// Each line is wrapped in <span class="line">...</span>
	const lines: string[] = []

	// Use a state machine approach to properly match nested spans
	const lineStartTag = '<span class="line">'
	const spanEndTag = '</span>'

	let pos = 0
	while (pos < codeContent.length) {
		const lineStart = codeContent.indexOf(lineStartTag, pos)
		if (lineStart === -1) break

		// Find the matching closing </span> by counting nested spans
		const contentStart = lineStart + lineStartTag.length
		let depth = 1
		let searchPos = contentStart

		while (depth > 0 && searchPos < codeContent.length) {
			const nextOpen = codeContent.indexOf('<span', searchPos)
			const nextClose = codeContent.indexOf(spanEndTag, searchPos)

			if (nextClose === -1) break

			if (nextOpen !== -1 && nextOpen < nextClose) {
				// Found an opening span before the next close
				depth++
				searchPos = nextOpen + 5 // Move past "<span"
			} else {
				// Found a closing span
				depth--
				if (depth === 0) {
					// This is our matching close tag
					const lineContent = codeContent.slice(contentStart, nextClose)
					lines.push(lineContent)
				}
				searchPos = nextClose + spanEndTag.length
			}
		}

		pos = searchPos
	}

	return lines
}

export function PreWrapper({
	children,
	className,
	'data-language': dataLang,
	...props
}: PreWrapperProps) {
	const { copied, copy } = useCopyToClipboard()
	const [highlightedLines, setHighlightedLines] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)

	// Extract language and meta from code element's className
	const getLanguageAndMeta = (): { language: string; meta: string | undefined } => {
		if (children && typeof children === 'object' && 'props' in children) {
			const codeProps = (children as ReactElement<{ className?: string; meta?: string }>).props
			const codeClassName = codeProps?.className || ''
			const match = codeClassName.match(/language-(\w+)/)
			return {
				language: match ? match[1] : 'text',
				meta: codeProps?.meta,
			}
		}
		if (dataLang) return { language: dataLang, meta: undefined }
		const langMatch = className?.match(/language-(\w+)/)
		return { language: langMatch ? langMatch[1] : 'text', meta: undefined }
	}

	const { language, meta } = getLanguageAndMeta()
	const { highlightLines, showLineNumbers, filename } = parseMetaString(meta)

	// Extract raw code from children
	const extractText = (node: ReactNode): string => {
		if (typeof node === 'string') return node
		if (typeof node === 'number') return String(node)
		if (Array.isArray(node)) return node.map(extractText).join('')
		if (node && typeof node === 'object' && 'props' in node) {
			const element = node as ReactElement<{ children?: ReactNode }>
			return extractText(element.props.children)
		}
		return ''
	}

	const rawCode = extractText(children).trim()

	// Memoize lines to avoid recalculating on every render
	const lines = useMemo(() => rawCode.split('\n'), [rawCode])
	const lineCount = lines.length
	const gutterWidth = Math.max(2, String(lineCount).length)

	// Highlight code on mount
	useEffect(() => {
		const highlight = async () => {
			setIsLoading(true)
			try {
				const langMap: Record<string, string> = {
					ts: 'typescript',
					js: 'javascript',
					tsx: 'tsx',
					jsx: 'jsx',
					sh: 'bash',
					shell: 'bash',
					zsh: 'bash',
				}
				const lang = langMap[language] || language

				// Process entire code at once to preserve context (multi-line strings, etc.)
				const html = await codeToHtml(rawCode, {
					lang,
					theme: 'github-dark',
				})

				const extractedLines = extractLinesFromHtml(html)
				setHighlightedLines(extractedLines)
			} catch {
				// Fallback to raw lines if highlighting fails
				setHighlightedLines(lines.map((line) => escapeHtml(line)))
			} finally {
				setIsLoading(false)
			}
		}

		if (rawCode) {
			highlight()
		}
	}, [rawCode, language, lines])

	const handleCopy = () => copy(rawCode)

	// Escape HTML for fallback rendering
	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;')
	}

	const renderLines = isLoading ? lines.map((line) => escapeHtml(line)) : highlightedLines

	return (
		<div className="relative group my-6 bg-surface border border-white/[0.06] overflow-hidden">
			{/* Header with language badge and optional filename */}
			<div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
				<div className="flex items-center gap-3">
					<span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
						{language}
					</span>
					{filename && (
						<>
							<span className="text-white/20">·</span>
							<span className="text-xs font-mono text-white/40">{filename}</span>
						</>
					)}
				</div>
				{/* Copy button in header */}
				<button
					type="button"
					onClick={handleCopy}
					className={cn(
						'p-1.5 -mr-1.5 text-white/40 hover:text-white/70 transition-colors',
						'opacity-0 group-hover:opacity-100',
					)}
					aria-label="Copy code"
				>
					{copied ? (
						<Check className="h-3.5 w-3.5 text-green-400" />
					) : (
						<Copy className="h-3.5 w-3.5" />
					)}
				</button>
			</div>

			{/* Code content */}
			<div className="relative overflow-x-auto scrollbar-thin">
				<pre className="!p-0 text-sm font-mono !bg-transparent !border-0 !m-0">
					<code className="!bg-transparent block">
						{renderLines.map((lineHtml, i) => (
							<div key={i} className={cn('flex', highlightLines.has(i + 1) && 'bg-yellow-500/10')}>
								{showLineNumbers && (
									<span
										className="select-none text-white/20 text-right pr-4 pl-4 py-0.5 border-r border-white/[0.06] bg-white/[0.01] shrink-0"
										style={{ minWidth: `${gutterWidth + 2}ch` }}
									>
										{i + 1}
									</span>
								)}
								<span
									className={cn('flex-1 px-4 py-0.5', isLoading && 'text-white/70')}
									dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
								/>
							</div>
						))}
					</code>
				</pre>
			</div>
		</div>
	)
}
