/**
 * @vestig/next/error - Enhanced Error Handling
 *
 * This module provides enhanced error handling for Next.js applications
 * with rich development experience including:
 *
 * - **Stack trace parsing** with app code highlighting
 * - **Breadcrumb trails** showing events before the error
 * - **Error fingerprinting** for grouping similar errors
 * - **React component tree** visualization
 *
 * @example Basic Usage
 * ```tsx
 * // app/layout.tsx
 * import { EnhancedErrorBoundary } from '@vestig/next/error'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <EnhancedErrorBoundary>
 *           {children}
 *         </EnhancedErrorBoundary>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @example With Breadcrumb Tracking
 * ```tsx
 * import { EnhancedErrorBoundary, setupClickTracking, setupFetchTracking } from '@vestig/next/error'
 *
 * // In a client component
 * useEffect(() => {
 *   const cleanupClick = setupClickTracking()
 *   const cleanupFetch = setupFetchTracking()
 *   return () => {
 *     cleanupClick()
 *     cleanupFetch()
 *   }
 * }, [])
 * ```
 *
 * @packageDocumentation
 */

'use client'

// Main error boundary component
export { EnhancedErrorBoundary } from './boundary'

// Breadcrumb system
export {
	breadcrumbStore,
	addLogBreadcrumb,
	addNavigationBreadcrumb,
	addClickBreadcrumb,
	addInputBreadcrumb,
	addFetchBreadcrumb,
	addErrorBreadcrumb,
	addCustomBreadcrumb,
	setupClickTracking,
	setupFetchTracking,
	formatBreadcrumbs,
	getCategoryIcon,
} from './breadcrumbs'

// Stack trace parsing
export {
	parseStackTrace,
	parseComponentStack,
	getMostRelevantFrame,
	formatStackFrame,
	formatStackTrace,
} from './stack-parser'

// Error fingerprinting
export {
	generateFingerprint,
	isSameError,
	groupErrors,
} from './fingerprint'

// Types
export type {
	BreadcrumbCategory,
	Breadcrumb,
	StackFrame,
	EnhancedError,
	EnhancedErrorBoundaryProps,
	EnhancedErrorBoundaryState,
	FingerprintOptions,
	BreadcrumbStore,
} from './types'
