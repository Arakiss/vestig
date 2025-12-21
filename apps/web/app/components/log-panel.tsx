'use client'

import { useLogPanel } from '@/lib/log-context'
import { CompactLogViewer } from './log-viewer'

/**
 * Collapsible log panel that sits at the bottom of the playground
 * Shows log count badge and connection status when collapsed
 */
export function LogPanel() {
	const { isOpen, toggle, logCount, isConnected } = useLogPanel()

	return (
		<div
			className={`fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-white/10 transition-all duration-300 ease-in-out z-50 ${
				isOpen ? 'h-80' : 'h-10'
			}`}
		>
			{/* Toggle bar */}
			<button
				type="button"
				onClick={toggle}
				className="w-full h-10 flex items-center justify-between px-4 bg-gray-900 hover:bg-gray-800 transition-colors"
			>
				<div className="flex items-center gap-3">
					{/* Connection indicator */}
					<span
						className={`w-2 h-2 rounded-full ${
							isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
						}`}
					/>
					<span className="text-sm font-medium text-gray-300">📋 Log Panel</span>
					{/* Log count badge */}
					{logCount > 0 && (
						<span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
							{logCount}
						</span>
					)}
				</div>
				<span className="text-gray-500">{isOpen ? '▼ Collapse' : '▲ Expand'}</span>
			</button>

			{/* Log viewer content */}
			{isOpen && (
				<div className="h-[calc(100%-2.5rem)]">
					<CompactLogViewer />
				</div>
			)}
		</div>
	)
}

/**
 * Floating log toggle button for mobile/compact views
 */
export function LogPanelToggle() {
	const { isOpen, toggle, logCount, isConnected } = useLogPanel()

	return (
		<button
			type="button"
			onClick={toggle}
			className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
				isOpen ? 'bg-gray-800 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-500'
			}`}
		>
			<span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
			<span className="text-sm font-medium">Logs</span>
			{logCount > 0 && (
				<span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
					{logCount > 99 ? '99+' : logCount}
				</span>
			)}
		</button>
	)
}

/**
 * Inline log panel for embedding in page content
 * Not fixed positioned, flows with the content
 */
export function InlineLogPanel({ height = 300 }: { height?: number }) {
	return (
		<div
			className="bg-gray-950 rounded-lg border border-white/10 overflow-hidden"
			style={{ height }}
		>
			<CompactLogViewer />
		</div>
	)
}
