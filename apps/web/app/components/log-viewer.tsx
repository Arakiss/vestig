'use client'

import type { DemoLogEntry } from '@/lib/demo-transport'
import { useLogContext } from '@/lib/log-context'
import { cn } from '@/lib/utils'
import { InfoCircle, NavArrowDown, NavArrowRight, WarningTriangle } from 'iconoir-react'
import { useEffect, useRef, useState } from 'react'
import type { LogLevel, Runtime } from 'vestig'

/**
 * Monochromatic level styling
 * Keep subtle color hints only for warn/error for accessibility
 */
const levelStyles: Record<LogLevel, { badge: string; row: string }> = {
	trace: {
		badge: 'bg-white/5 text-white/40 border-white/10',
		row: 'hover:bg-white/[0.02]',
	},
	debug: {
		badge: 'bg-white/5 text-white/50 border-white/10',
		row: 'hover:bg-white/[0.02]',
	},
	info: {
		badge: 'bg-white/5 text-white/60 border-white/10',
		row: 'hover:bg-white/[0.03]',
	},
	warn: {
		badge: 'bg-amber-500/10 text-amber-400/80 border-amber-500/20',
		row: 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]',
	},
	error: {
		badge: 'bg-red-500/10 text-red-400/80 border-red-500/20',
		row: 'bg-red-500/[0.02] hover:bg-red-500/[0.04]',
	},
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
	const date = new Date(timestamp)
	return date.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		fractionalSecondDigits: 3,
	})
}

/**
 * Single log entry row with monochromatic design
 */
function LogRow({
	log,
	isExpanded,
	onToggle,
	isNew = false,
}: {
	log: DemoLogEntry
	isExpanded: boolean
	onToggle: () => void
	isNew?: boolean
}) {
	const styles = levelStyles[log.level]
	const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0
	const hasContext = log.context && Object.keys(log.context).length > 0
	const hasError = !!log.error
	const hasDetails = hasMetadata || hasContext || hasError

	return (
		<div
			className={cn(
				'border-b border-white/[0.04] transition-all duration-200',
				styles.row,
				isNew && 'animate-in fade-in slide-in-from-bottom-1 duration-300',
			)}
		>
			{/* Main row */}
			<div
				className="flex items-start gap-2 px-3 py-1.5 cursor-pointer font-mono text-xs"
				onClick={onToggle}
				onKeyDown={(e) => e.key === 'Enter' && onToggle()}
				role="button"
				tabIndex={0}
			>
				{/* Timestamp */}
				<span className="text-white/30 shrink-0 w-24 tabular-nums">
					{formatTime(log.timestamp)}
				</span>

				{/* Level badge */}
				<span
					className={cn(
						'px-1.5 py-0.5 text-[10px] font-medium uppercase shrink-0 w-12 text-center border',
						styles.badge,
					)}
				>
					{log.level}
				</span>

				{/* Runtime */}
				<span className="shrink-0 w-16 text-[10px] text-white/40">[{log.runtime}]</span>

				{/* Namespace */}
				{log.namespace && <span className="text-white/50 shrink-0">[{log.namespace}]</span>}

				{/* Message */}
				<span className="text-white/70 flex-1 truncate">{log.message}</span>

				{/* Detail indicators */}
				{hasDetails && (
					<div className="flex items-center gap-1.5 shrink-0 text-white/30">
						{hasMetadata && <span className="text-[10px]">meta</span>}
						{hasContext && <span className="text-[10px]">ctx</span>}
						{hasError && <WarningTriangle className="h-3 w-3 text-red-400/60" />}
						{isExpanded ? (
							<NavArrowDown className="h-3 w-3" />
						) : (
							<NavArrowRight className="h-3 w-3" />
						)}
					</div>
				)}
			</div>

			{/* Expanded details */}
			{isExpanded && hasDetails && (
				<div className="px-3 py-2 bg-black/40 border-t border-white/[0.04] space-y-2">
					{hasContext && (
						<div>
							<div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Context</div>
							<pre className="text-xs text-white/50 overflow-x-auto font-mono">
								{JSON.stringify(log.context, null, 2)}
							</pre>
						</div>
					)}
					{hasMetadata && (
						<div>
							<div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
								Metadata
							</div>
							<pre className="text-xs text-white/50 overflow-x-auto font-mono">
								{JSON.stringify(log.metadata, null, 2)}
							</pre>
						</div>
					)}
					{hasError && (
						<div>
							<div className="text-[10px] text-red-400/50 uppercase tracking-wider mb-1">Error</div>
							<pre className="text-xs text-red-400/70 overflow-x-auto font-mono">
								{log.error?.stack ?? JSON.stringify(log.error, null, 2)}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

/**
 * Monochromatic filter toolbar
 */
function FilterToolbar() {
	const {
		state,
		toggleLevel,
		toggleRuntime,
		setSearch,
		clearServerLogs,
		toggleAutoScroll,
		filteredLogs,
	} = useLogContext()

	const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error']
	const runtimes: (Runtime | 'unknown')[] = ['node', 'bun', 'edge', 'browser']

	return (
		<div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-white/[0.02] border-b border-white/[0.06]">
			{/* Level filters */}
			<div className="flex items-center gap-1">
				<span className="text-[10px] text-white/30 uppercase tracking-wider mr-1">Level</span>
				{levels.map((level) => {
					const isActive = state.filter.levels.has(level)
					return (
						<button
							type="button"
							key={level}
							onClick={() => toggleLevel(level)}
							className={cn(
								'px-1.5 py-0.5 text-[10px] font-medium uppercase transition-all border',
								isActive
									? levelStyles[level].badge
									: 'text-white/20 border-transparent hover:text-white/40',
							)}
						>
							{level}
						</button>
					)
				})}
			</div>

			{/* Divider */}
			<div className="w-px h-4 bg-white/10" />

			{/* Runtime filters */}
			<div className="flex items-center gap-1">
				<span className="text-[10px] text-white/30 uppercase tracking-wider mr-1">Runtime</span>
				{runtimes.map((runtime) => {
					const isActive = state.filter.runtimes.has(runtime)
					return (
						<button
							type="button"
							key={runtime}
							onClick={() => toggleRuntime(runtime)}
							className={cn(
								'px-1.5 py-0.5 text-[10px] font-medium transition-all border',
								isActive
									? 'text-white/60 bg-white/5 border-white/10'
									: 'text-white/20 border-transparent hover:text-white/40',
							)}
						>
							{runtime}
						</button>
					)
				})}
			</div>

			{/* Divider */}
			<div className="w-px h-4 bg-white/10" />

			{/* Search */}
			<input
				type="text"
				placeholder="Search..."
				value={state.filter.search}
				onChange={(e) => setSearch(e.target.value)}
				className="px-2 py-1 bg-black/30 border border-white/10 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 w-32"
			/>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Log count */}
			<span className="text-[10px] text-white/30">{filteredLogs.length}</span>

			{/* Auto-scroll toggle */}
			<button
				type="button"
				onClick={toggleAutoScroll}
				className={cn(
					'px-2 py-1 text-[10px] transition-all border',
					state.autoScroll
						? 'text-white/60 bg-white/5 border-white/10'
						: 'text-white/30 border-transparent hover:text-white/50',
				)}
				title={state.autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
			>
				{state.autoScroll ? 'Auto ↓' : 'Paused'}
			</button>

			{/* Clear button */}
			<button
				type="button"
				onClick={clearServerLogs}
				className="px-2 py-1 text-[10px] text-white/30 hover:text-white/60 border border-transparent hover:border-white/10 transition-all"
			>
				Clear
			</button>
		</div>
	)
}

/**
 * Main log viewer component
 * Premium monochromatic design with filtering and auto-scroll
 */
export function LogViewer() {
	const { filteredLogs, state } = useLogContext()
	const containerRef = useRef<HTMLDivElement>(null)
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

	// Auto-scroll to bottom when new logs arrive
	useEffect(() => {
		if (state.autoScroll && containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight
		}
	}, [filteredLogs, state.autoScroll])

	const toggleExpanded = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	return (
		<div className="flex flex-col h-full bg-surface border border-white/[0.06] overflow-hidden">
			{/* Connection status bar */}
			<div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06]">
				<span
					className={cn(
						'w-1.5 h-1.5 rounded-full transition-colors',
						state.connectionStatus === 'connected' ? 'bg-white animate-pulse' : 'bg-white/20',
					)}
				/>
				<span className="text-[10px] text-white/40">
					{state.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
				</span>
			</div>

			<FilterToolbar />

			<div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
				{filteredLogs.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
						<InfoCircle className="h-6 w-6 text-white/20" />
						<span className="text-xs">No logs to display</span>
					</div>
				) : (
					filteredLogs.map((log, index) => (
						<LogRow
							key={log.id}
							log={log}
							isExpanded={expandedIds.has(log.id)}
							onToggle={() => toggleExpanded(log.id)}
							isNew={index >= filteredLogs.length - 3}
						/>
					))
				)}
			</div>
		</div>
	)
}

/**
 * Compact log viewer for panels
 * Minimal design, optimized for smaller spaces
 */
export function CompactLogViewer() {
	const { filteredLogs, state, clearServerLogs } = useLogContext()
	const containerRef = useRef<HTMLDivElement>(null)
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

	// Auto-scroll to bottom when new logs arrive
	useEffect(() => {
		if (state.autoScroll && containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight
		}
	}, [filteredLogs, state.autoScroll])

	const toggleExpanded = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	return (
		<div className="flex flex-col h-full bg-surface">
			{/* Compact header */}
			<div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06]">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							'w-1.5 h-1.5 rounded-full transition-colors',
							state.connectionStatus === 'connected' ? 'bg-white animate-pulse' : 'bg-white/20',
						)}
					/>
					<span className="text-xs text-white/50 font-medium">Live Logs</span>
					<span className="text-[10px] text-white/30">({filteredLogs.length})</span>
				</div>
				<button
					type="button"
					onClick={clearServerLogs}
					className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
				>
					Clear
				</button>
			</div>

			{/* Log list */}
			<div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
				{filteredLogs.length === 0 ? (
					<div className="flex items-center justify-center h-32 text-white/30 text-xs">
						Waiting for logs...
					</div>
				) : (
					filteredLogs.map((log, index) => (
						<LogRow
							key={log.id}
							log={log}
							isExpanded={expandedIds.has(log.id)}
							onToggle={() => toggleExpanded(log.id)}
							isNew={index >= filteredLogs.length - 3}
						/>
					))
				)}
			</div>
		</div>
	)
}
