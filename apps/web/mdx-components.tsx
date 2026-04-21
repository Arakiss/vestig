import { ApiTable } from '@/components/mdx/api-table'
import { Callout } from '@/components/mdx/callout'
import { Card, CardGrid } from '@/components/mdx/card'
import { Feature, FeatureList } from '@/components/mdx/feature-list'
import { Step, Steps } from '@/components/mdx/steps'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/mdx/table'
import { cn } from '@/lib/utils'
import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { type HTMLAttributes, type ReactNode, isValidElement } from 'react'

type CodeProps = HTMLAttributes<HTMLElement> & {
	children?: ReactNode
}

type StaticCodeBlockProps = {
	children: ReactNode
	language?: string
	filename?: string
	showLineNumbers?: boolean
	highlight?: number[]
	className?: string
}

type StaticTabsProps = HTMLAttributes<HTMLDivElement> & {
	defaultValue?: string
	value?: string
}

type StaticTabPartProps = HTMLAttributes<HTMLDivElement> & {
	value?: string
}

function extractText(node: ReactNode): string {
	if (typeof node === 'string') return node
	if (typeof node === 'number') return String(node)
	if (Array.isArray(node)) return node.map(extractText).join('')
	if (isValidElement<{ children?: ReactNode }>(node)) {
		return extractText(node.props.children)
	}
	return ''
}

function extractLanguage(className?: string): string | undefined {
	const match = className?.match(/language-([\w-]+)/)
	return match?.[1]
}

function getPreLanguage(children: ReactNode, className?: string): string {
	if (isValidElement<{ className?: string }>(children)) {
		return extractLanguage(children.props.className) ?? extractLanguage(className) ?? 'text'
	}
	if (Array.isArray(children)) {
		const codeChild = children.find((child) => isValidElement<{ className?: string }>(child))
		if (isValidElement<{ className?: string }>(codeChild)) {
			return extractLanguage(codeChild.props.className) ?? extractLanguage(className) ?? 'text'
		}
	}
	return extractLanguage(className) ?? 'text'
}

function InlineCode({ children }: { children?: ReactNode }) {
	return (
		<code className="px-1.5 py-0.5 bg-white/10 text-white/90 text-sm font-mono">{children}</code>
	)
}

function Pre({ children, className, ...props }: HTMLAttributes<HTMLPreElement>) {
	const language = getPreLanguage(children, className)

	return (
		<div className="relative my-6 bg-surface border border-white/[0.06] overflow-hidden">
			<div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
				<span className="text-[10px] uppercase tracking-widest text-white/50">{language}</span>
			</div>
			<pre
				className={cn(
					'overflow-x-auto p-4 text-sm leading-6 font-mono text-white/70 bg-transparent',
					className,
				)}
				{...props}
			>
				{children}
			</pre>
		</div>
	)
}

function CodeBlock({
	children,
	language = 'typescript',
	filename,
	showLineNumbers = false,
	highlight = [],
	className,
}: StaticCodeBlockProps) {
	const lines = extractText(children).trimEnd().split('\n')

	return (
		<div
			className={cn(
				'relative my-6 bg-surface border border-white/[0.06] overflow-hidden',
				className,
			)}
		>
			<div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
				<span className="text-[10px] uppercase tracking-widest text-white/50">{language}</span>
				{filename && <span className="text-xs font-mono text-white/40">{filename}</span>}
			</div>
			<pre className="overflow-x-auto p-4 text-sm leading-6 font-mono text-white/70 bg-transparent">
				<code className="block bg-transparent p-0">
					{lines.map((line, index) => (
						<span
							key={`${index}-${line}`}
							className={cn(
								'block',
								highlight.includes(index + 1) && 'bg-yellow-500/10 -mx-4 px-4',
							)}
						>
							{showLineNumbers && (
								<span className="inline-block w-8 pr-4 text-right select-none text-white/20">
									{index + 1}
								</span>
							)}
							{line || ' '}
						</span>
					))}
				</code>
			</pre>
		</div>
	)
}

function Tabs({
	children,
	className,
	defaultValue: _defaultValue,
	value: _value,
	...props
}: StaticTabsProps) {
	return (
		<div className={cn('my-6 space-y-4', className)} {...props}>
			{children}
		</div>
	)
}

function TabsList({ children, className, value: _value, ...props }: StaticTabPartProps) {
	return (
		<div className={cn('flex flex-wrap gap-2 text-sm text-white/50', className)} {...props}>
			{children}
		</div>
	)
}

function TabsTrigger({ children, className, value: _value, ...props }: StaticTabPartProps) {
	return (
		<div
			className={cn(
				'px-3 py-1.5 border border-white/[0.06] bg-white/[0.02] text-white/70',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

function TabsContent({ children, className, value: _value, ...props }: StaticTabPartProps) {
	return (
		<div className={cn('mt-4', className)} {...props}>
			{children}
		</div>
	)
}

const mdxComponents = {
	code: ({ children, className, ...props }: CodeProps) => {
		if (className?.includes('language-')) {
			return (
				<code className={className} {...props}>
					{children}
				</code>
			)
		}
		return <InlineCode>{children}</InlineCode>
	},
	pre: Pre,
	table: Table,
	thead: TableHead,
	tbody: TableBody,
	tr: TableRow,
	th: TableHeader,
	td: TableCell,
	Callout,
	Steps,
	Step,
	Card,
	CardGrid,
	CodeBlock,
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		// Headings with proper styling
		h1: ({ children, className, ...props }) => (
			<h1
				className={cn(
					'text-3xl font-bold tracking-tight text-white mt-8 mb-4 first:mt-0',
					className,
				)}
				{...props}
			>
				{children}
			</h1>
		),
		h2: ({ children, className, ...props }) => (
			<h2
				className={cn(
					'text-2xl font-semibold tracking-tight text-white mt-10 mb-4',
					'border-b border-white/[0.06] pb-3',
					className,
				)}
				{...props}
			>
				{children}
			</h2>
		),
		h3: ({ children, className, ...props }) => (
			<h3 className={cn('text-xl font-semibold text-white mt-8 mb-3', className)} {...props}>
				{children}
			</h3>
		),
		h4: ({ children, className, ...props }) => (
			<h4 className={cn('text-lg font-medium text-white mt-6 mb-2', className)} {...props}>
				{children}
			</h4>
		),

		// Paragraphs
		p: ({ children, className, ...props }) => (
			<p className={cn('text-base leading-7 text-white/60 mb-4', className)} {...props}>
				{children}
			</p>
		),

		// Lists
		ul: ({ children, className, ...props }) => (
			<ul
				className={cn('my-4 ml-6 list-disc text-white/60 space-y-2', '[&>li]:pl-1', className)}
				{...props}
			>
				{children}
			</ul>
		),
		ol: ({ children, className, ...props }) => (
			<ol
				className={cn('my-4 ml-6 list-decimal text-white/60 space-y-2', '[&>li]:pl-1', className)}
				{...props}
			>
				{children}
			</ol>
		),
		li: ({ children, className, ...props }) => (
			<li className={cn('leading-7', 'marker:text-white/30', className)} {...props}>
				{children}
			</li>
		),

		// Links
		a: ({ href, children, className, ...props }) => {
			const isExternal = href?.startsWith('http')

			if (isExternal) {
				return (
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							'text-white underline underline-offset-4 decoration-white/30',
							'hover:decoration-white/60 transition-colors',
							className,
						)}
						{...props}
					>
						{children}
					</a>
				)
			}

			return (
				<Link
					href={href || '#'}
					className={cn(
						'text-white underline underline-offset-4 decoration-white/30',
						'hover:decoration-white/60 transition-colors',
						className,
					)}
					{...props}
				>
					{children}
				</Link>
			)
		},

		// Blockquote
		blockquote: ({ children, className, ...props }) => (
			<blockquote
				className={cn('border-l-2 border-white/20 pl-4 my-6', 'text-white/50 italic', className)}
				{...props}
			>
				{children}
			</blockquote>
		),

		// Horizontal rule
		hr: ({ className, ...props }) => (
			<hr className={cn('my-8 border-0 h-px bg-white/[0.06]', className)} {...props} />
		),

		// Strong/Bold
		strong: ({ children, className, ...props }) => (
			<strong className={cn('font-semibold text-white', className)} {...props}>
				{children}
			</strong>
		),

		// Emphasis/Italic
		em: ({ children, className, ...props }) => (
			<em className={cn('italic text-white/70', className)} {...props}>
				{children}
			</em>
		),

		// Use server-safe MDX components so pages can export metadata.
		...mdxComponents,

		// Export custom components for direct use in MDX
		Callout,
		Steps,
		Step,
		Card,
		CardGrid,
		CodeBlock,
		ApiTable,
		FeatureList,
		Feature,
		Tabs,
		TabsList,
		TabsTrigger,
		TabsContent,
		Table,
		TableHead,
		TableBody,
		TableRow,
		TableHeader,
		TableCell,

		// Spread any additional components
		...components,
	}
}
