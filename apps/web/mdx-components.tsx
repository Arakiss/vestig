import {
	ApiTable,
	Callout,
	Card,
	CardGrid,
	CodeBlock,
	Feature,
	FeatureList,
	Step,
	Steps,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	mdxComponents,
} from '@/components/mdx'
import { cn } from '@/lib/utils'
import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

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

		// Use our custom components from mdx/index.tsx
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
