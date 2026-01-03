'use client'

import { GlassButton, GlassCard, GlassCardBadge, GlassGrid } from '@/app/components/glass-card'
import { Container } from '@/components/layout'
import {
	addClickBreadcrumb,
	addCustomBreadcrumb,
	addFetchBreadcrumb,
	addInputBreadcrumb,
	addNavigationBreadcrumb,
	breadcrumbStore,
} from '@vestig/next/error'
import {
	Fingerprint,
	Globe,
	InputField,
	List,
	MouseButtonLeft,
	NavArrowRight,
	WarningTriangle,
	Xmark,
} from 'iconoir-react'
import { useCallback, useEffect, useState } from 'react'

/**
 * Breadcrumb category icons and colors
 */
const categoryStyles = {
	navigation: { icon: '🧭', color: 'text-blue-400', bg: 'bg-blue-500/10' },
	click: { icon: '👆', color: 'text-violet-400', bg: 'bg-violet-500/10' },
	fetch: { icon: '🌐', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
	input: { icon: '⌨️', color: 'text-amber-400', bg: 'bg-amber-500/10' },
	error: { icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10' },
	custom: { icon: '📌', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
	log: { icon: '📝', color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

/**
 * Simulated API endpoints for fetch breadcrumbs
 */
const apiEndpoints = [
	{ method: 'GET', path: '/api/users', status: 200, duration: 145 },
	{ method: 'POST', path: '/api/orders', status: 201, duration: 320 },
	{ method: 'GET', path: '/api/products', status: 200, duration: 89 },
	{ method: 'DELETE', path: '/api/sessions', status: 204, duration: 45 },
]

interface Breadcrumb {
	id: string
	category: string
	message: string
	data?: Record<string, unknown>
	timestamp: string
}

export function ErrorBoundaryClient() {
	const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
	const [shouldError, setShouldError] = useState(false)

	// Initialize with a navigation breadcrumb
	useEffect(() => {
		addNavigationBreadcrumb('/playground', '/playground/error-boundary')
		refreshBreadcrumbs()
	}, [])

	const refreshBreadcrumbs = useCallback(() => {
		const crumbs = breadcrumbStore.getAll()
		setBreadcrumbs(crumbs as Breadcrumb[])
	}, [])

	const handleClick = useCallback(
		(buttonName: string) => {
			addClickBreadcrumb(buttonName, `button.${buttonName.toLowerCase().replace(/\s/g, '-')}`)
			refreshBreadcrumbs()
		},
		[refreshBreadcrumbs],
	)

	const simulateFetch = useCallback(() => {
		const endpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)]
		addFetchBreadcrumb(endpoint.method, endpoint.path, endpoint.status, endpoint.duration)
		refreshBreadcrumbs()
	}, [refreshBreadcrumbs])

	const simulateInput = useCallback(() => {
		const fields = ['search', 'email', 'name', 'password']
		const field = fields[Math.floor(Math.random() * fields.length)]
		const value = field === 'password' ? '[REDACTED]' : `sample_${field}_value`
		addInputBreadcrumb(field, value, `input#${field}`)
		refreshBreadcrumbs()
	}, [refreshBreadcrumbs])

	const addCustom = useCallback(() => {
		const events = [
			{ message: 'Feature flag checked', data: { flag: 'dark-mode', enabled: true } },
			{ message: 'Analytics event sent', data: { event: 'page_view', page: '/playground' } },
			{ message: 'Theme changed', data: { from: 'light', to: 'dark' } },
		]
		const event = events[Math.floor(Math.random() * events.length)]
		addCustomBreadcrumb(event.message, event.data)
		refreshBreadcrumbs()
	}, [refreshBreadcrumbs])

	const triggerError = useCallback(() => {
		handleClick('Trigger Error')
		setShouldError(true)
	}, [handleClick])

	// This will cause React to throw during render
	if (shouldError) {
		throw new Error('This is a demo error triggered by the user!')
	}

	return (
		<Container size="wide">
			{/* Header */}
			<div className="relative mb-12">
				<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
							<WarningTriangle className="h-6 w-6 text-amber-400" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-bold text-white">Error Boundary</h1>
								<GlassCardBadge variant="new">New</GlassCardBadge>
							</div>
							<p className="text-white/50 text-sm">
								Enhanced error handling with breadcrumbs and fingerprinting
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<MouseButtonLeft className="h-5 w-5 text-amber-400" />
					Generate Breadcrumbs
				</h2>

				<GlassCard variant="default" padding="lg">
					<div className="flex flex-wrap gap-3">
						<GlassButton
							variant="secondary"
							icon={<Globe className="h-4 w-4" />}
							onClick={() => {
								handleClick('API Call')
								simulateFetch()
							}}
						>
							Make API Call
						</GlassButton>

						<GlassButton
							variant="secondary"
							icon={<InputField className="h-4 w-4" />}
							onClick={() => {
								handleClick('Form Input')
								simulateInput()
							}}
						>
							Simulate Input
						</GlassButton>

						<GlassButton
							variant="secondary"
							icon={<List className="h-4 w-4" />}
							onClick={() => {
								handleClick('Custom Event')
								addCustom()
							}}
						>
							Custom Event
						</GlassButton>

						<GlassButton
							variant="primary"
							icon={<Xmark className="h-4 w-4" />}
							onClick={triggerError}
							className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400"
						>
							Trigger Error
						</GlassButton>
					</div>

					<p className="text-xs text-white/40 mt-4">
						Click buttons to add breadcrumbs, then trigger an error to see them in the Error
						Boundary UI.
					</p>
				</GlassCard>
			</div>

			{/* Live Breadcrumb Trail */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<Fingerprint className="h-5 w-5 text-amber-400" />
						Breadcrumb Trail
					</h2>
					<span className="text-xs text-white/40">{breadcrumbs.length} items</span>
				</div>

				<GlassCard variant="glow" padding="lg" className="border-amber-500/20">
					<div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
						{breadcrumbs.length === 0 ? (
							<p className="text-sm text-white/40 text-center py-8">
								No breadcrumbs yet. Click buttons above to generate actions.
							</p>
						) : (
							breadcrumbs.map((crumb, index) => {
								const style =
									categoryStyles[crumb.category as keyof typeof categoryStyles] ||
									categoryStyles.custom
								return (
									<div
										key={crumb.id || index}
										className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
									>
										<div className={`flex items-center justify-center w-7 h-7 rounded ${style.bg}`}>
											<span className="text-sm">{style.icon}</span>
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-white truncate">{crumb.message}</p>
											<div className="flex items-center gap-2 text-xs text-white/40">
												<span className={style.color}>{crumb.category}</span>
												<span>•</span>
												<span>{new Date(crumb.timestamp).toLocaleTimeString()}</span>
											</div>
										</div>
									</div>
								)
							})
						)}
					</div>
				</GlassCard>
			</div>

			{/* Feature Explanation */}
			<div>
				<h2 className="text-lg font-semibold text-white mb-4">Features</h2>
				<GlassGrid cols={2}>
					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
								<List className="h-5 w-5 text-amber-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Breadcrumb Trail</h3>
								<p className="text-xs text-white/50">
									Captures user actions (clicks, navigation, API calls) leading up to errors.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
								<Fingerprint className="h-5 w-5 text-orange-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Error Fingerprinting</h3>
								<p className="text-xs text-white/50">
									Groups similar errors together for easier debugging and tracking.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
								<WarningTriangle className="h-5 w-5 text-red-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">Stack Trace Parsing</h3>
								<p className="text-xs text-white/50">
									Parses and highlights the most relevant frames from any browser.
								</p>
							</div>
						</div>
					</GlassCard>

					<GlassCard variant="subtle" padding="md">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
								<NavArrowRight className="h-5 w-5 text-violet-400" />
							</div>
							<div>
								<h3 className="text-sm font-medium text-white mb-1">React Component Tree</h3>
								<p className="text-xs text-white/50">
									Shows the component hierarchy that led to the error for context.
								</p>
							</div>
						</div>
					</GlassCard>
				</GlassGrid>
			</div>
		</Container>
	)
}
