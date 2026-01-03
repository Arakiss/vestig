'use client'

import { useLogPanel } from '@/lib/log-context'
import { cn } from '@/lib/utils'
import { Erase, NavArrowDown, NavArrowUp } from 'iconoir-react'
import { CompactLogViewer } from './log-viewer'

/**
 * Terminal-style header with macOS dots and streaming indicator
 */
function TerminalHeader({
	title = 'vestig — live logs',
	isConnected,
	logCount,
	onClear,
}: {
	title?: string
	isConnected: boolean
	logCount: number
	onClear?: () => void
}) {
	return (
		<div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
			{/* macOS dots */}
			<div className="flex gap-1.5">
				<div className="w-2 h-2 rounded-full bg-white/20" />
				<div className="w-2 h-2 rounded-full bg-white/20" />
				<div className="w-2 h-2 rounded-full bg-white/20" />
			</div>

			{/* Title */}
			<span className="text-[10px] text-white/40 uppercase tracking-wider ml-1">{title}</span>

			{/* Log count badge */}
			{logCount > 0 && (
				<span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/50">
					{logCount > 999 ? '999+' : logCount}
				</span>
			)}

			{/* Spacer */}
			<div className="flex-1" />

			{/* Clear button */}
			{onClear && logCount > 0 && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation()
						onClear()
					}}
					className="p-1 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
					aria-label="Clear logs"
				>
					<Erase className="h-3 w-3" />
				</button>
			)}

			{/* Streaming indicator */}
			<div className="flex items-center gap-1.5">
				<span
					className={cn(
						'w-1.5 h-1.5 rounded-full transition-colors',
						isConnected ? 'bg-white animate-pulse' : 'bg-white/20',
					)}
				/>
				<span className="text-[10px] text-white/40">
					{isConnected ? 'streaming' : 'disconnected'}
				</span>
			</div>
		</div>
	)
}

/**
 * Collapsible toggle bar for the fixed panel
 */
function ToggleBar({
	isOpen,
	isConnected,
	logCount,
	onToggle,
}: {
	isOpen: boolean
	isConnected: boolean
	logCount: number
	onToggle: () => void
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="w-full h-10 flex items-center justify-between px-4 bg-surface hover:bg-surface-elevated transition-colors border-b border-white/[0.06]"
		>
			<div className="flex items-center gap-3">
				{/* macOS dots mini */}
				<div className="flex gap-1">
					<div className="w-1.5 h-1.5 rounded-full bg-white/20" />
					<div className="w-1.5 h-1.5 rounded-full bg-white/20" />
					<div className="w-1.5 h-1.5 rounded-full bg-white/20" />
				</div>

				{/* Title */}
				<span className="text-xs text-white/60 font-medium">Log Panel</span>

				{/* Log count */}
				{logCount > 0 && (
					<span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/50">
						{logCount > 99 ? '99+' : logCount}
					</span>
				)}

				{/* Streaming indicator */}
				<div className="flex items-center gap-1.5">
					<span
						className={cn(
							'w-1.5 h-1.5 rounded-full transition-colors',
							isConnected ? 'bg-white animate-pulse' : 'bg-white/20',
						)}
					/>
					<span className="text-[10px] text-white/40 hidden sm:inline">
						{isConnected ? 'streaming' : 'offline'}
					</span>
				</div>
			</div>

			{/* Expand/Collapse indicator */}
			<span className="flex items-center gap-1.5 text-white/40 text-xs">
				{isOpen ? (
					<>
						<span className="hidden sm:inline">Collapse</span>
						<NavArrowDown className="h-3 w-3" />
					</>
				) : (
					<>
						<span className="hidden sm:inline">Expand</span>
						<NavArrowUp className="h-3 w-3" />
					</>
				)}
			</span>
		</button>
	)
}

/**
 * Collapsible log panel that sits at the bottom of the playground
 * Premium terminal aesthetic with macOS dots and streaming indicator
 */
export function LogPanel() {
	const { isOpen, toggle, logCount, isConnected } = useLogPanel()

	return (
		<div
			className={cn(
				'fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/[0.06] transition-all duration-300 ease-in-out z-50',
				isOpen ? 'h-80' : 'h-10',
			)}
		>
			{/* Toggle bar (collapsed state) or Terminal header (expanded) */}
			{isOpen ? (
				<div className="h-10">
					<ToggleBar
						isOpen={isOpen}
						isConnected={isConnected}
						logCount={logCount}
						onToggle={toggle}
					/>
				</div>
			) : (
				<ToggleBar
					isOpen={isOpen}
					isConnected={isConnected}
					logCount={logCount}
					onToggle={toggle}
				/>
			)}

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
 * Monochromatic design with streaming indicator
 */
export function LogPanelToggle() {
	const { isOpen, toggle, logCount, isConnected } = useLogPanel()

	return (
		<button
			type="button"
			onClick={toggle}
			className={cn(
				'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 shadow-lg transition-all',
				'bg-surface border border-white/10',
				'hover:bg-surface-elevated hover:border-white/20',
			)}
		>
			{/* Streaming indicator */}
			<span
				className={cn(
					'w-1.5 h-1.5 rounded-full transition-colors',
					isConnected ? 'bg-white animate-pulse' : 'bg-white/30',
				)}
			/>

			<span className="text-xs font-medium text-white/70">Logs</span>

			{/* Count badge */}
			{logCount > 0 && (
				<span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/50">
					{logCount > 99 ? '99+' : logCount}
				</span>
			)}
		</button>
	)
}

/**
 * Inline log panel for embedding in page content
 * Terminal aesthetic with header - not fixed positioned
 */
export function InlineLogPanel({
	height = 300,
	title = 'output',
}: { height?: number; title?: string }) {
	const { logCount, isConnected } = useLogPanel()

	return (
		<div className="bg-black/60 border border-white/[0.06] overflow-hidden" style={{ height }}>
			<TerminalHeader title={title} isConnected={isConnected} logCount={logCount} />
			<div className="h-[calc(100%-2.5rem)]">
				<CompactLogViewer />
			</div>
		</div>
	)
}
