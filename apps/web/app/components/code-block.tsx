'use client'

import { useState } from 'react'

interface CodeBlockProps {
	code: string
	language?: string
	filename?: string
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="code-block">
			<style>{`
				.code-block {
					background: rgba(0,0,0,0.5);
					border: 1px solid rgba(255,255,255,0.08);
					border-radius: 12px;
					overflow: hidden;
					margin: 1.5rem 0;
				}

				.code-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem 1rem;
					background: rgba(255,255,255,0.03);
					border-bottom: 1px solid rgba(255,255,255,0.06);
				}

				.code-filename {
					font-size: 0.8125rem;
					color: #737373;
					font-family: 'SF Mono', Monaco, monospace;
				}

				.code-lang {
					font-size: 0.75rem;
					color: #525252;
					text-transform: uppercase;
					letter-spacing: 0.05em;
				}

				.copy-btn {
					background: rgba(255,255,255,0.05);
					border: 1px solid rgba(255,255,255,0.1);
					border-radius: 6px;
					padding: 0.375rem 0.75rem;
					font-size: 0.75rem;
					color: #a3a3a3;
					cursor: pointer;
					transition: all 0.15s ease;
				}

				.copy-btn:hover {
					background: rgba(255,255,255,0.1);
					color: #fafafa;
				}

				.copy-btn.copied {
					background: rgba(34,197,94,0.15);
					border-color: rgba(34,197,94,0.3);
					color: #22c55e;
				}

				.code-content {
					padding: 1rem;
					overflow-x: auto;
				}

				.code-content pre {
					margin: 0;
					font-family: 'SF Mono', Monaco, Consolas, monospace;
					font-size: 0.875rem;
					line-height: 1.7;
					color: #e5e5e5;
					white-space: pre-wrap;
					word-break: break-word;
				}
			`}</style>

			<div className="code-header">
				<div>
					{filename ? (
						<span className="code-filename">{filename}</span>
					) : (
						<span className="code-lang">{language}</span>
					)}
				</div>
				<button type="button" className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
					{copied ? '✓ Copied' : 'Copy'}
				</button>
			</div>
			<div className="code-content">
				<pre>{code.trim()}</pre>
			</div>
		</div>
	)
}
