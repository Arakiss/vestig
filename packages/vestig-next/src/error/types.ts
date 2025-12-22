/**
 * Error Types for Better Error DX
 *
 * Types for enhanced error handling with source maps,
 * breadcrumbs, and fingerprinting.
 *
 * @packageDocumentation
 */

import type { ErrorInfo } from 'react'

/**
 * Breadcrumb categories for filtering
 */
export type BreadcrumbCategory =
	| 'log' // Log messages
	| 'navigation' // Route changes
	| 'click' // User clicks
	| 'input' // Form inputs
	| 'fetch' // API calls
	| 'error' // Previous errors
	| 'custom' // Custom breadcrumbs

/**
 * Enhanced breadcrumb with more context
 */
export interface Breadcrumb {
	/** Unique ID */
	id: string
	/** ISO timestamp */
	timestamp: string
	/** Breadcrumb category */
	category: BreadcrumbCategory
	/** Log level (for log breadcrumbs) */
	level?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
	/** Human-readable message */
	message: string
	/** Logger namespace */
	namespace?: string
	/** Additional data */
	data?: Record<string, unknown>
}

/**
 * Parsed stack frame from error stack trace
 */
export interface StackFrame {
	/** Function name (if available) */
	functionName?: string
	/** File path */
	fileName?: string
	/** Line number (1-indexed) */
	lineNumber?: number
	/** Column number (1-indexed) */
	columnNumber?: number
	/** Whether this is from node_modules */
	isNodeModule: boolean
	/** Whether this is from the app's source code */
	isAppCode: boolean
	/** Source code context (if available via source maps) */
	sourceContext?: {
		/** Lines before the error line */
		pre: string[]
		/** The error line */
		line: string
		/** Lines after the error line */
		post: string[]
	}
}

/**
 * Enhanced error with parsed stack and fingerprint
 */
export interface EnhancedError {
	/** Original error */
	error: Error
	/** Error fingerprint for grouping */
	fingerprint: string
	/** Parsed stack frames */
	frames: StackFrame[]
	/** React component stack */
	componentStack?: string
	/** Breadcrumbs leading up to the error */
	breadcrumbs: Breadcrumb[]
	/** Timestamp when error occurred */
	timestamp: string
	/** Browser/environment info */
	environment: {
		userAgent: string
		url: string
		pathname: string
	}
}

/**
 * Props for enhanced error boundary
 */
export interface EnhancedErrorBoundaryProps {
	children: React.ReactNode
	/**
	 * Custom fallback UI
	 */
	fallback?: React.ReactNode | ((error: EnhancedError) => React.ReactNode)
	/**
	 * Callback when error is caught
	 */
	onError?: (error: EnhancedError) => void
	/**
	 * Maximum breadcrumbs to keep
	 * @default 50
	 */
	maxBreadcrumbs?: number
	/**
	 * Show source code context in development
	 * @default true in development
	 */
	showSourceContext?: boolean
	/**
	 * Show breadcrumbs in error UI
	 * @default true in development
	 */
	showBreadcrumbs?: boolean
	/**
	 * Categories of breadcrumbs to capture
	 * @default all categories
	 */
	breadcrumbCategories?: BreadcrumbCategory[]
	/**
	 * Report errors to endpoint
	 */
	reportEndpoint?: string
}

/**
 * State for enhanced error boundary
 */
export interface EnhancedErrorBoundaryState {
	hasError: boolean
	enhancedError: EnhancedError | null
}

/**
 * Options for error fingerprinting
 */
export interface FingerprintOptions {
	/** Include file paths in fingerprint */
	includeFilePaths?: boolean
	/** Include line numbers in fingerprint */
	includeLineNumbers?: boolean
	/** Maximum stack frames to consider */
	maxFrames?: number
}

/**
 * Breadcrumb store interface
 */
export interface BreadcrumbStore {
	/** Add a breadcrumb */
	add: (breadcrumb: Omit<Breadcrumb, 'id' | 'timestamp'>) => void
	/** Get all breadcrumbs */
	getAll: () => Breadcrumb[]
	/** Get breadcrumbs by category */
	getByCategory: (category: BreadcrumbCategory) => Breadcrumb[]
	/** Clear all breadcrumbs */
	clear: () => void
	/** Set maximum breadcrumbs */
	setMaxSize: (size: number) => void
}
