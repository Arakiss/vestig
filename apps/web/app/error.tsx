'use client'

import { Container } from '@/components/layout'
import { useEffect } from 'react'

/**
 * Root Error Boundary
 *
 * Catches unhandled errors in the application and provides
 * a graceful fallback UI with recovery options.
 */
export default function ErrorPage({
	error,
	reset,
}: {
	error: globalThis.Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		// Log the error to the console for debugging
		// In production, this could be sent to an error tracking service
		console.error('[Error Boundary]', error)
	}, [error])

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Container size="narrow" className="text-center py-16">
				{/* Error icon */}
				<div className="mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
						<svg
							className="w-8 h-8 text-red-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
				</div>

				{/* Error message */}
				<h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Something went wrong</h1>

				<p className="text-white/50 mb-8 max-w-md mx-auto">
					An unexpected error occurred. Our team has been notified and is working on a fix.
				</p>

				{/* Error digest for debugging */}
				{error.digest && (
					<p className="text-xs text-white/30 mb-6 font-mono">Error ID: {error.digest}</p>
				)}

				{/* Recovery actions */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<button
						type="button"
						onClick={reset}
						className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						Try again
					</button>

					<a
						href="/"
						className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						Go home
					</a>
				</div>
			</Container>
		</div>
	)
}
