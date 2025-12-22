'use client'

import { Component, type ErrorInfo, type ReactNode, type CSSProperties } from 'react'
import type {
	EnhancedError,
	EnhancedErrorBoundaryProps,
	EnhancedErrorBoundaryState,
	StackFrame,
} from './types'
import { parseStackTrace, parseComponentStack, getMostRelevantFrame } from './stack-parser'
import { generateFingerprint } from './fingerprint'
import { breadcrumbStore, getCategoryIcon } from './breadcrumbs'

/**
 * Create an enhanced error object with all context
 */
function createEnhancedError(error: Error, errorInfo: ErrorInfo): EnhancedError {
	const frames = parseStackTrace(error.stack)
	const fingerprint = generateFingerprint(error, frames)
	const breadcrumbs = breadcrumbStore.getAll()

	return {
		error,
		fingerprint,
		frames,
		componentStack: errorInfo.componentStack ?? undefined,
		breadcrumbs,
		timestamp: new Date().toISOString(),
		environment: {
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
			url: typeof window !== 'undefined' ? window.location.href : 'unknown',
			pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
		},
	}
}

/**
 * Development Error UI Component
 */
function DevErrorUI({
	enhancedError,
	onReset,
	showBreadcrumbs = true,
}: {
	enhancedError: EnhancedError
	onReset: () => void
	showBreadcrumbs?: boolean
}): ReactNode {
	const { error, frames, componentStack, breadcrumbs, fingerprint } = enhancedError
	const relevantFrame = getMostRelevantFrame(frames)
	const componentNames = parseComponentStack(componentStack)

	const containerStyle: CSSProperties = {
		position: 'fixed',
		inset: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
		zIndex: 99999,
		overflow: 'auto',
		fontFamily: 'system-ui, -apple-system, sans-serif',
	}

	const contentStyle: CSSProperties = {
		maxWidth: '900px',
		margin: '40px auto',
		padding: '24px',
		backgroundColor: '#1a1a2e',
		borderRadius: '12px',
		color: '#e4e4e7',
	}

	const headerStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '16px',
		marginBottom: '24px',
		paddingBottom: '16px',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
	}

	const errorIconStyle: CSSProperties = {
		width: '48px',
		height: '48px',
		borderRadius: '50%',
		backgroundColor: '#dc2626',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '24px',
		flexShrink: 0,
	}

	const errorTitleStyle: CSSProperties = {
		fontSize: '20px',
		fontWeight: 700,
		color: '#fca5a5',
		margin: 0,
	}

	const errorMessageStyle: CSSProperties = {
		fontSize: '16px',
		color: '#e4e4e7',
		margin: '8px 0 0',
		lineHeight: 1.5,
	}

	const sectionStyle: CSSProperties = {
		marginBottom: '20px',
	}

	const sectionTitleStyle: CSSProperties = {
		fontSize: '12px',
		fontWeight: 600,
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		color: '#a1a1aa',
		marginBottom: '8px',
	}

	const codeBlockStyle: CSSProperties = {
		backgroundColor: '#0f0f1a',
		borderRadius: '8px',
		padding: '12px',
		fontSize: '13px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		overflow: 'auto',
		maxHeight: '200px',
	}

	const frameStyle = (isAppCode: boolean): CSSProperties => ({
		padding: '4px 0',
		color: isAppCode ? '#93c5fd' : '#71717a',
		borderLeft: isAppCode ? '2px solid #3b82f6' : '2px solid transparent',
		paddingLeft: '8px',
	})

	const componentStyle: CSSProperties = {
		display: 'inline-block',
		padding: '2px 8px',
		margin: '2px',
		backgroundColor: 'rgba(139, 92, 246, 0.2)',
		borderRadius: '4px',
		fontSize: '12px',
		color: '#c4b5fd',
	}

	const breadcrumbStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '8px',
		padding: '6px 0',
		borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
		fontSize: '12px',
	}

	const buttonStyle: CSSProperties = {
		padding: '10px 20px',
		backgroundColor: '#3b82f6',
		color: 'white',
		border: 'none',
		borderRadius: '6px',
		fontSize: '14px',
		fontWeight: 500,
		cursor: 'pointer',
	}

	const fingerprintStyle: CSSProperties = {
		fontSize: '11px',
		color: '#71717a',
		fontFamily: 'monospace',
	}

	return (
		<div style={containerStyle}>
			<div style={contentStyle}>
				{/* Header */}
				<div style={headerStyle}>
					<div style={errorIconStyle}>💥</div>
					<div style={{ flex: 1 }}>
						<h1 style={errorTitleStyle}>{error.name}</h1>
						<p style={errorMessageStyle}>{error.message}</p>
						{relevantFrame && (
							<p style={{ ...fingerprintStyle, marginTop: '8px' }}>
								{relevantFrame.fileName}:{relevantFrame.lineNumber}
							</p>
						)}
					</div>
					<button style={buttonStyle} onClick={onReset}>
						Try Again
					</button>
				</div>

				{/* Component Tree */}
				{componentNames.length > 0 && (
					<div style={sectionStyle}>
						<div style={sectionTitleStyle}>Component Tree</div>
						<div>
							{componentNames.map((name, i) => (
								<span key={i} style={componentStyle}>
									{name}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Stack Trace */}
				<div style={sectionStyle}>
					<div style={sectionTitleStyle}>Stack Trace</div>
					<div style={codeBlockStyle}>
						{frames.slice(0, 10).map((frame, i) => (
							<div key={i} style={frameStyle(frame.isAppCode)}>
								{frame.functionName || '<anonymous>'}{' '}
								<span style={{ color: '#52525b' }}>
									({frame.fileName}:{frame.lineNumber})
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Breadcrumbs */}
				{showBreadcrumbs && breadcrumbs.length > 0 && (
					<div style={sectionStyle}>
						<div style={sectionTitleStyle}>
							Breadcrumbs ({breadcrumbs.length} events before crash)
						</div>
						<div style={{ ...codeBlockStyle, maxHeight: '250px' }}>
							{breadcrumbs.slice(-15).map((bc) => (
								<div key={bc.id} style={breadcrumbStyle}>
									<span style={{ flexShrink: 0 }}>{getCategoryIcon(bc.category)}</span>
									<span style={{ color: '#a1a1aa', flexShrink: 0, width: '70px' }}>
										{new Date(bc.timestamp).toLocaleTimeString()}
									</span>
									<span style={{ flex: 1 }}>{bc.message}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Fingerprint */}
				<div style={{ ...sectionStyle, marginBottom: 0 }}>
					<div style={fingerprintStyle}>Error fingerprint: {fingerprint}</div>
				</div>
			</div>
		</div>
	)
}

/**
 * Production Error UI Component
 */
function ProdErrorUI({
	error,
	onReset,
}: {
	error: Error
	onReset: () => void
}): ReactNode {
	return (
		<div
			role="alert"
			style={{
				padding: '40px 20px',
				textAlign: 'center',
				fontFamily: 'system-ui, sans-serif',
			}}
		>
			<div style={{ fontSize: '48px', marginBottom: '16px' }}>😵</div>
			<h1 style={{ fontSize: '24px', margin: '0 0 8px', color: '#1f2937' }}>
				Something went wrong
			</h1>
			<p style={{ color: '#6b7280', marginBottom: '24px' }}>
				We've been notified and are working on a fix.
			</p>
			<button
				onClick={onReset}
				style={{
					padding: '12px 24px',
					backgroundColor: '#3b82f6',
					color: 'white',
					border: 'none',
					borderRadius: '8px',
					fontSize: '16px',
					cursor: 'pointer',
				}}
			>
				Try Again
			</button>
		</div>
	)
}

/**
 * Enhanced Error Boundary Component
 *
 * Provides rich error context including:
 * - Parsed stack traces with app code highlighted
 * - Breadcrumb trail of events before the error
 * - React component tree
 * - Error fingerprinting for grouping
 *
 * @example
 * ```tsx
 * import { EnhancedErrorBoundary } from '@vestig/next/error'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <EnhancedErrorBoundary
 *       showBreadcrumbs
 *       onError={(err) => sendToErrorService(err)}
 *     >
 *       {children}
 *     </EnhancedErrorBoundary>
 *   )
 * }
 * ```
 */
export class EnhancedErrorBoundary extends Component<
	EnhancedErrorBoundaryProps,
	EnhancedErrorBoundaryState
> {
	constructor(props: EnhancedErrorBoundaryProps) {
		super(props)
		this.state = {
			hasError: false,
			enhancedError: null,
		}

		// Set max breadcrumbs
		if (props.maxBreadcrumbs) {
			breadcrumbStore.setMaxSize(props.maxBreadcrumbs)
		}
	}

	static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
		return { hasError: true }
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		const enhancedError = createEnhancedError(error, errorInfo)

		this.setState({ enhancedError })

		// Call onError callback
		this.props.onError?.(enhancedError)

		// Report to endpoint if configured
		if (this.props.reportEndpoint) {
			this.reportError(enhancedError)
		}
	}

	private async reportError(enhancedError: EnhancedError): Promise<void> {
		if (!this.props.reportEndpoint) return

		try {
			await fetch(this.props.reportEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fingerprint: enhancedError.fingerprint,
					error: {
						name: enhancedError.error.name,
						message: enhancedError.error.message,
						stack: enhancedError.error.stack,
					},
					frames: enhancedError.frames,
					breadcrumbs: enhancedError.breadcrumbs,
					environment: enhancedError.environment,
					timestamp: enhancedError.timestamp,
				}),
			})
		} catch {
			// Silently fail - don't want to cause more errors
		}
	}

	private handleReset = (): void => {
		this.setState({
			hasError: false,
			enhancedError: null,
		})
		breadcrumbStore.clear()
	}

	override render(): ReactNode {
		const { hasError, enhancedError } = this.state
		const { children, fallback, showBreadcrumbs = true } = this.props

		if (hasError && enhancedError) {
			// Custom fallback
			if (typeof fallback === 'function') {
				return fallback(enhancedError)
			}
			if (fallback !== undefined) {
				return fallback
			}

			// Development UI
			if (process.env.NODE_ENV === 'development') {
				return (
					<DevErrorUI
						enhancedError={enhancedError}
						onReset={this.handleReset}
						showBreadcrumbs={showBreadcrumbs}
					/>
				)
			}

			// Production UI
			return <ProdErrorUI error={enhancedError.error} onReset={this.handleReset} />
		}

		return children
	}
}
