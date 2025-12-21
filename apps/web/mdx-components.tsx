import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		h1: ({ children }) => (
			<h1
				style={{
					fontSize: '2.5rem',
					fontWeight: 800,
					marginBottom: '1.5rem',
					marginTop: '3rem',
					letterSpacing: '-0.02em',
					background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text',
				}}
			>
				{children}
			</h1>
		),
		h2: ({ children }) => (
			<h2
				style={{
					fontSize: '1.75rem',
					fontWeight: 700,
					marginBottom: '1rem',
					marginTop: '2.5rem',
					color: '#fafafa',
					borderBottom: '1px solid rgba(255,255,255,0.1)',
					paddingBottom: '0.5rem',
				}}
			>
				{children}
			</h2>
		),
		h3: ({ children }) => (
			<h3
				style={{
					fontSize: '1.25rem',
					fontWeight: 600,
					marginBottom: '0.75rem',
					marginTop: '2rem',
					color: '#e5e5e5',
				}}
			>
				{children}
			</h3>
		),
		p: ({ children }) => (
			<p
				style={{
					fontSize: '1rem',
					lineHeight: 1.8,
					color: '#a3a3a3',
					marginBottom: '1.25rem',
				}}
			>
				{children}
			</p>
		),
		ul: ({ children }) => (
			<ul
				style={{
					marginBottom: '1.5rem',
					paddingLeft: '1.5rem',
					color: '#a3a3a3',
				}}
			>
				{children}
			</ul>
		),
		ol: ({ children }) => (
			<ol
				style={{
					marginBottom: '1.5rem',
					paddingLeft: '1.5rem',
					color: '#a3a3a3',
				}}
			>
				{children}
			</ol>
		),
		li: ({ children }) => (
			<li
				style={{
					marginBottom: '0.5rem',
					lineHeight: 1.7,
				}}
			>
				{children}
			</li>
		),
		a: ({ href, children }) => (
			<a
				href={href}
				style={{
					color: '#22d3ee',
					textDecoration: 'none',
					borderBottom: '1px solid rgba(34,211,238,0.3)',
					transition: 'border-color 0.2s',
				}}
			>
				{children}
			</a>
		),
		code: ({ children }) => (
			<code
				style={{
					background: 'rgba(255,255,255,0.06)',
					padding: '0.2em 0.4em',
					borderRadius: '4px',
					fontSize: '0.875em',
					fontFamily: "'SF Mono', Monaco, Consolas, monospace",
					color: '#f472b6',
				}}
			>
				{children}
			</code>
		),
		pre: ({ children }) => (
			<pre
				style={{
					background: 'rgba(0,0,0,0.4)',
					border: '1px solid rgba(255,255,255,0.08)',
					borderRadius: '12px',
					padding: '1.25rem',
					overflow: 'auto',
					marginBottom: '1.5rem',
					fontSize: '0.875rem',
					lineHeight: 1.7,
				}}
			>
				{children}
			</pre>
		),
		blockquote: ({ children }) => (
			<blockquote
				style={{
					borderLeft: '3px solid #a78bfa',
					paddingLeft: '1.25rem',
					margin: '1.5rem 0',
					color: '#a3a3a3',
					fontStyle: 'italic',
				}}
			>
				{children}
			</blockquote>
		),
		table: ({ children }) => (
			<div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
				<table
					style={{
						width: '100%',
						borderCollapse: 'collapse',
						fontSize: '0.9375rem',
					}}
				>
					{children}
				</table>
			</div>
		),
		th: ({ children }) => (
			<th
				style={{
					textAlign: 'left',
					padding: '0.75rem 1rem',
					borderBottom: '1px solid rgba(255,255,255,0.1)',
					color: '#fafafa',
					fontWeight: 600,
				}}
			>
				{children}
			</th>
		),
		td: ({ children }) => (
			<td
				style={{
					padding: '0.75rem 1rem',
					borderBottom: '1px solid rgba(255,255,255,0.06)',
					color: '#a3a3a3',
				}}
			>
				{children}
			</td>
		),
		hr: () => (
			<hr
				style={{
					border: 'none',
					borderTop: '1px solid rgba(255,255,255,0.1)',
					margin: '2.5rem 0',
				}}
			/>
		),
		...components,
	}
}
