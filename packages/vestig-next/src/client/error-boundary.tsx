'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { LogEntry, Logger } from 'vestig'
import { useVestigContext } from './provider'

/**
 * Patterns to filter from stack traces in production
 * These are internal framework frames that add noise without helping debug user code
 */
const FILTERED_STACK_PATTERNS = [
	// React internals
	/at (renderWithHooks|mountIndeterminateComponent|beginWork|performUnitOfWork)/,
	/at ReactDOMRoot\.render/,
	/at scheduleUpdateOnFiber/,
	/at (dispatchAction|dispatchSetState)/,
	/at Object\.invokeGuardedCallbackDev/,
	/at invokeGuardedCallback/,
	/at HTMLUnknownElement\.callCallback/,
	// Next.js internals
	/at (AppRouter|HotReload|DevRoot)/,
	/at __webpack_require__/,
	/at __next_route_loader__/,
	/webpack-internal:\/\/\/\(app-pages-browser\)/,
	// Node.js internals
	/at Module\._compile/,
	/at processTicksAndRejections/,
	/at runMicrotasks/,
	// Build/bundle internals
	/node_modules\/(react|react-dom|next|webpack)/,
]

/**
 * Filter stack trace for production logging
 *
 * Removes noisy framework internals while keeping user code frames.
 * Returns full stack in development for debugging.
 *
 * @param stack - The raw error stack trace
 * @param isDev - Whether we're in development mode
 * @returns Filtered stack trace (or original in development)
 */
export function filterStackTrace(stack: string | undefined, isDev: boolean): string | undefined {
	if (!stack || isDev) {
		return stack
	}

	const lines = stack.split('\n')
	const filteredLines: string[] = []

	// Always keep the first line (error message)
	if (lines.length > 0 && lines[0]) {
		filteredLines.push(lines[0])
	}

	// Filter remaining lines
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]
		if (!line) continue

		// Check if line matches any filter pattern
		const shouldFilter = FILTERED_STACK_PATTERNS.some((pattern) => pattern.test(line))

		if (!shouldFilter) {
			filteredLines.push(line)
		}
	}

	// If we filtered everything except the message, include a note
	if (filteredLines.length === 1) {
		filteredLines.push('    (stack frames filtered in production)')
	}

	return filteredLines.join('\n')
}

/**
 * Filter component stack for production logging
 *
 * In production, limits the component stack to a reasonable size
 * to reduce log volume while preserving debugging context.
 *
 * @param stack - The React component stack
 * @param isDev - Whether we're in development mode
 * @returns Filtered component stack (or original in development)
 */
export function filterComponentStack(
	stack: string | null | undefined,
	isDev: boolean,
): string | undefined {
	if (!stack || isDev) {
		return stack ?? undefined
	}

	const lines = stack.split('\n').filter((line) => line.trim())

	// In production, limit to 10 most relevant frames
	const maxFrames = 10
	if (lines.length > maxFrames) {
		return [...lines.slice(0, maxFrames), `    ... and ${lines.length - maxFrames} more`].join('\n')
	}

	return lines.join('\n')
}

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
			const isDev = process.env.NODE_ENV === 'development'

			this.props.logger.error('React component error', {
				error: {
					name: error.name,
					message: error.message,
					// Filter stack traces in production to reduce noise
					stack: filterStackTrace(error.stack, isDev),
				},
				// Filter component stack in production to limit size
				componentStack: filterComponentStack(errorInfo.componentStack, isDev),
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
