'use client'

import { Home, RefreshDouble } from 'iconoir-react'
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
		console.error('[Error Boundary]', error)
	}, [error])

	return (
		<div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
			{/* Background effects */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{/* Gradient orbs */}
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

				{/* Grid pattern */}
				<div
					className="absolute inset-0 opacity-[0.02]"
					style={{
						backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
							linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
						backgroundSize: '64px 64px',
					}}
				/>
			</div>

			{/* Content */}
			<div className="relative z-10 text-center px-6 max-w-lg mx-auto">
				{/* Glitchy error code */}
				<div className="mb-6">
					<span className="inline-block font-mono text-[10rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-red-500/20 to-transparent select-none">
						!
					</span>
				</div>

				{/* Icon with glow */}
				<div className="mb-8 relative">
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-24 h-24 bg-red-500/20 rounded-full blur-xl" />
					</div>
					<div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 backdrop-blur-sm">
						<svg
							className="w-10 h-10 text-red-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
				</div>

				{/* Error message */}
				<h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Oops!</h1>
				<p className="text-lg text-white/40 mb-2">Something unexpected happened</p>
				<p className="text-sm text-white/30 mb-8 max-w-sm mx-auto">
					Don&apos;t worry, these things happen. Try refreshing or head back home.
				</p>

				{/* Error digest */}
				{error.digest && (
					<div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
						<span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
						<code className="text-xs text-white/40 font-mono">{error.digest}</code>
					</div>
				)}

				{/* Actions */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						<RefreshDouble className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
						Try again
					</button>

					<a
						href="/"
						className="flex items-center gap-2 px-6 py-3 text-white/70 font-medium rounded-xl border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						<Home className="w-4 h-4" />
						Go home
					</a>
				</div>

				{/* Footer hint */}
				<p className="mt-12 text-xs text-white/20">
					If this keeps happening, please{' '}
					<a
						href="https://github.com/Arakiss/vestig/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="text-white/30 hover:text-white/50 underline underline-offset-2 transition-colors"
					>
						report an issue
					</a>
				</p>
			</div>
		</div>
	)
}
