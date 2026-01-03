// MDX Components Export
// These components provide high-quality visual elements for documentation

export { CodeBlock, InlineCode } from './code-block'
export { Callout } from './callout'
export { Steps, Step } from './steps'
export { Card, CardGrid } from './card'
export { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './table'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export { ApiTable } from './api-table'
export { FeatureList, Feature } from './feature-list'

import { Callout } from './callout'
import { Card, CardGrid } from './card'
// MDX Component mappings for automatic use
import { CodeBlock, InlineCode } from './code-block'
import { PreWrapper } from './pre-wrapper'
import { Step, Steps } from './steps'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

interface CodeProps {
	children?: React.ReactNode
	className?: string
}

export const mdxComponents = {
	// Override default elements - shiki handles syntax highlighting
	code: ({ children, className, ...props }: CodeProps & React.HTMLAttributes<HTMLElement>) => {
		// If it's inside a pre (code block), let it pass through styled
		if (className?.includes('language-')) {
			return (
				<code className={className} {...props}>
					{children}
				</code>
			)
		}
		// Otherwise it's inline code
		return <InlineCode>{children}</InlineCode>
	},
	pre: PreWrapper,
	table: Table,
	thead: TableHead,
	tbody: TableBody,
	tr: TableRow,
	th: TableHeader,
	td: TableCell,

	// Custom components available in MDX
	Callout,
	Steps,
	Step,
	Card,
	CardGrid,
	CodeBlock,
}
