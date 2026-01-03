'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { LogEntry, Logger } from 'vestig'
import { useVestigContext } from './provider'

/**
 * Breadcrumb entry for error context
 */
export interface Breadcrumb {
	timestamp: string
	level: string
	message: string
	namespace?: string
}

/**
 * Props for VestigErrorBoundary
 */
export interface VestigErrorBoundaryProps {
	children: ReactNode
	/** Custom fallback UI (string, ReactNode, or function) */
	fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)
	/** Callback when error is caught */
	onError?: (error: Error, errorInfo: ErrorInfo) => void
	/** Maximum breadcrumbs to keep (default: 20) */
	maxBreadcrumbs?: number
	/** Whether to reset error state on navigation (default: true) */
	resetOnNavigation?: boolean
}

/**
 * State for VestigErrorBoundary
 */
interface VestigErrorBoundaryState {
	hasError: boolean
	error: Error | null
	errorInfo: ErrorInfo | null
}

/**
 * Breadcrumb storage (module-level for simplicity)
 */
const breadcrumbs: Breadcrumb[] = []
let maxBreadcrumbSize = 20

/**
 * Add a breadcrumb (called from logging hooks)
 */
export function addBreadcrumb(entry: Partial<LogEntry>): void {
	breadcrumbs.push({
		timestamp: entry.timestamp ?? new Date().toISOString(),
		level: entry.level ?? 'info',
		message: entry.message ?? '',
		namespace: entry.namespace,
	})

	// Trim to max size
	while (breadcrumbs.length > maxBreadcrumbSize) {
		breadcrumbs.shift()
	}
}

/**
 * Get recent breadcrumbs
 */
export function getBreadcrumbs(): readonly Breadcrumb[] {
	return breadcrumbs
}

/**
 * Clear all breadcrumbs
 */
export function clearBreadcrumbs(): void {
	breadcrumbs.length = 0
}

/**
 * Inner error boundary class component
 */
class VestigErrorBoundaryInner extends Component<
	VestigErrorBoundaryProps & { logger: Logger | null },
	VestigErrorBoundaryState
> {
	constructor(props: VestigErrorBoundaryProps & { logger: Logger | null }) {
		super(props)
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		}

		// Update max breadcrumb size
		if (props.maxBreadcrumbs !== undefined) {
			maxBreadcrumbSize = props.maxBreadcrumbs
		}
	}

	static getDerivedStateFromError(error: Error): Partial<VestigErrorBoundaryState> {
		return { hasError: true, error }
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.setState({ errorInfo })

		// Log the error with vestig
		if (this.props.logger) {
			this.props.logger.error('React component error', {
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
				componentStack: errorInfo.componentStack,
				breadcrumbs: getBreadcrumbs(),
			})
		}

		// Call custom error handler
		this.props.onError?.(error, errorInfo)
	}

	/**
	 * Reset error state
	 */
	resetError = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		})
		clearBreadcrumbs()
	}

	override render(): ReactNode {
		const { hasError, error, errorInfo } = this.state
		const { children, fallback } = this.props

		if (hasError && error) {
			// Render fallback UI
			if (typeof fallback === 'function') {
				return fallback(error, errorInfo!)
			}

			if (fallback !== undefined) {
				return fallback
			}

			// Default fallback
			return (
				<div
					role="alert"
					style={{
						padding: '20px',
						margin: '20px',
						backgroundColor: '#fee2e2',
						border: '1px solid #ef4444',
						borderRadius: '8px',
						fontFamily: 'system-ui, sans-serif',
					}}
				>
					<h2 style={{ color: '#dc2626', marginTop: 0 }}>Something went wrong</h2>
					<p style={{ color: '#7f1d1d' }}>{error.message}</p>
					<button
						onClick={this.resetError}
						style={{
							padding: '8px 16px',
							backgroundColor: '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Try again
					</button>
					{process.env.NODE_ENV === 'development' && error.stack && (
						<pre
							style={{
								marginTop: '16px',
								padding: '12px',
								backgroundColor: '#fecaca',
								borderRadius: '4px',
								fontSize: '12px',
								overflow: 'auto',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
							}}
						>
							{error.stack}
						</pre>
					)}
				</div>
			)
		}

		return children
	}
}

/**
 * Wrapper to inject logger from context
 */
function VestigErrorBoundaryWrapper(props: VestigErrorBoundaryProps): ReactNode {
	let logger: Logger | null = null

	try {
		const context = useVestigContext()
		logger = context.logger
	} catch {
		// VestigProvider not available, log will be skipped
	}

	return <VestigErrorBoundaryInner {...props} logger={logger} />
}

/**
 * Error boundary component that automatically logs errors to Vestig
 *
 * Features:
 * - Automatic error logging with full stack trace
 * - Breadcrumb trail of recent logs before error
 * - Component stack for debugging
 * - Customizable fallback UI
 *
 * @example
 * ```tsx
 * import { VestigErrorBoundary } from '@vestig/next/client'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <VestigProvider>
 *       <VestigErrorBoundary
 *         fallback={<ErrorPage />}
 *         onError={(error) => console.error('Caught:', error)}
 *       >
 *         {children}
 *       </VestigErrorBoundary>
 *     </VestigProvider>
 *   )
 * }
 * ```
 *
 * @example Custom fallback function
 * ```tsx
 * <VestigErrorBoundary
 *   fallback={(error, errorInfo) => (
 *     <div>
 *       <h1>Error: {error.message}</h1>
 *       <pre>{errorInfo.componentStack}</pre>
 *     </div>
 *   )}
 * >
 *   {children}
 * </VestigErrorBoundary>
 * ```
 */
export function VestigErrorBoundary(props: VestigErrorBoundaryProps): ReactNode {
	return <VestigErrorBoundaryWrapper {...props} />
}
