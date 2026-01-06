'use client'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Check, Copy } from 'iconoir-react'
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'

interface PreWrapperProps {
	children: ReactNode
	className?: string
	'data-language'?: string
}

export function PreWrapper({
	children,
	className,
	'data-language': dataLang,
	...props
}: PreWrapperProps) {
	const { copied, copy } = useCopyToClipboard()
	const [highlightedCode, setHighlightedCode] = useState<string | null>(null)
	const preRef = useRef<HTMLDivElement>(null)

	// Extract language from code element's className or pre's className
	const getLanguage = (): string => {
		// Check if children is a code element with language class
		if (children && typeof children === 'object' && 'props' in children) {
			const codeProps = (children as ReactElement<{ className?: string }>).props
			const codeClassName = codeProps?.className || ''
			const match = codeClassName.match(/language-(\w+)/)
			if (match) return match[1]
		}
		// Fallback to pre className or data attribute
		if (dataLang) return dataLang
		const langMatch = className?.match(/language-(\w+)/)
		if (langMatch) return langMatch[1]
		return 'text'
	}

	const language = getLanguage()

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

	// Highlight code on mount
	useEffect(() => {
		const highlight = async () => {
			try {
				// Map common aliases
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

				const html = await codeToHtml(rawCode, {
					lang,
					theme: 'github-dark',
				})

				setHighlightedCode(html)
			} catch {
				// Fallback if language not supported
				setHighlightedCode(null)
			}
		}

		if (rawCode) {
			highlight()
		}
	}, [rawCode, language])

	const handleCopy = () => copy(rawCode)

	return (
		<div
			ref={preRef}
			className="relative group my-6 bg-surface border border-white/[0.06] overflow-hidden"
		>
			{/* Language badge header */}
			<div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
				<span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
					{language}
				</span>
			</div>

			{/* Code content */}
			<div className="relative overflow-x-auto scrollbar-thin">
				{highlightedCode ? (
					<div
						className={cn(
							'p-4 text-sm leading-normal font-mono',
							'[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!border-0',
							'[&_code]:!bg-transparent [&_code]:!border-0 [&_code]:!outline-0',
							'[&_.line]:block [&_.line]:!border-0',
						)}
						dangerouslySetInnerHTML={{ __html: highlightedCode }}
					/>
				) : (
					<pre
						className={cn(
							'!p-4 text-sm leading-normal font-mono !bg-transparent !border-0 !m-0',
							'[&_code]:!bg-transparent [&_code]:!p-0',
							className,
						)}
						{...props}
					>
						<code className="text-white/70">{rawCode}</code>
					</pre>
				)}
			</div>

			{/* Copy button */}
			<button
				type="button"
				onClick={handleCopy}
				className={cn(
					'absolute top-2 right-2 p-2 bg-white/5 border border-white/10',
					'opacity-0 group-hover:opacity-100 transition-all duration-200',
					'hover:bg-white/10 hover:border-white/20',
				)}
				aria-label="Copy code"
			>
				{copied ? (
					<Check className="h-4 w-4 text-green-400" />
				) : (
					<Copy className="h-4 w-4 text-white/60" />
				)}
			</button>
		</div>
	)
}
