'use client'

import type { DemoLogEntry } from '@/lib/demo-transport'
import { useLogContext } from '@/lib/log-context'
import { useEffect, useRef, useState } from 'react'
import type { LogLevel, Runtime } from 'vestig'

/**
 * Color mapping for log levels
 */
const levelColors: Record<LogLevel, { bg: string; text: string; border: string }> = {
	trace: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
	debug: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
	info: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
	warn: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
	error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
}

/**
 * Color mapping for runtimes
 */
const runtimeColors: Record<Runtime | 'unknown', string> = {
	node: 'text-green-500',
	bun: 'text-pink-400',
	edge: 'text-orange-400',
	browser: 'text-purple-400',
	worker: 'text-cyan-400',
	unknown: 'text-gray-400',
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
 * Single log entry row
 */
function LogRow({
	log,
	isExpanded,
	onToggle,
}: {
	log: DemoLogEntry
	isExpanded: boolean
	onToggle: () => void
}) {
	const colors = levelColors[log.level]
	const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0
	const hasContext = log.context && Object.keys(log.context).length > 0
	const hasError = !!log.error

	return (
		<div className={`border-b border-white/5 hover:bg-white/5 transition-colors ${colors.bg}`}>
			{/* Main row */}
			<div
				className="flex items-start gap-2 px-3 py-1.5 cursor-pointer font-mono text-xs"
				onClick={onToggle}
				onKeyDown={(e) => e.key === 'Enter' && onToggle()}
				role="button"
				tabIndex={0}
			>
				{/* Timestamp */}
				<span className="text-gray-500 shrink-0 w-24">{formatTime(log.timestamp)}</span>

				{/* Level badge */}
				<span
					className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 w-12 text-center ${colors.text} ${colors.border} border`}
				>
					{log.level}
				</span>

				{/* Runtime badge */}
				<span className={`shrink-0 w-16 text-[10px] ${runtimeColors[log.runtime]}`}>
					[{log.runtime}]
				</span>

				{/* Namespace */}
				{log.namespace && <span className="text-cyan-400 shrink-0">[{log.namespace}]</span>}

				{/* Message */}
				<span className="text-gray-200 flex-1 truncate">{log.message}</span>

				{/* Indicators */}
				<div className="flex gap-1 shrink-0">
					{hasMetadata && (
						<span className="text-gray-500" title="Has metadata">
							📦
						</span>
					)}
					{hasContext && (
						<span className="text-gray-500" title="Has context">
							🔗
						</span>
					)}
					{hasError && (
						<span className="text-red-400" title="Has error">
							⚠️
						</span>
					)}
					{(hasMetadata || hasContext || hasError) && (
						<span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
					)}
				</div>
			</div>

			{/* Expanded details */}
			{isExpanded && (hasMetadata || hasContext || hasError) && (
				<div className="px-3 py-2 bg-black/30 border-t border-white/5">
					{hasContext && (
						<div className="mb-2">
							<div className="text-[10px] text-gray-500 uppercase mb-1">Context</div>
							<pre className="text-xs text-cyan-300 overflow-x-auto">
								{JSON.stringify(log.context, null, 2)}
							</pre>
						</div>
					)}
					{hasMetadata && (
						<div className="mb-2">
							<div className="text-[10px] text-gray-500 uppercase mb-1">Metadata</div>
							<pre className="text-xs text-blue-300 overflow-x-auto">
								{JSON.stringify(log.metadata, null, 2)}
							</pre>
						</div>
					)}
					{hasError && (
						<div>
							<div className="text-[10px] text-gray-500 uppercase mb-1">Error</div>
							<pre className="text-xs text-red-300 overflow-x-auto">
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
 * Filter toolbar
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
		<div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-gray-900 border-b border-white/10">
			{/* Level filters */}
			<div className="flex items-center gap-1">
				<span className="text-[10px] text-gray-500 uppercase mr-1">Levels:</span>
				{levels.map((level) => {
					const isActive = state.filter.levels.has(level)
					const colors = levelColors[level]
					return (
						<button
							type="button"
							key={level}
							onClick={() => toggleLevel(level)}
							className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase transition-all ${
								isActive
									? `${colors.text} ${colors.bg} ${colors.border} border`
									: 'text-gray-600 hover:text-gray-400'
							}`}
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
				<span className="text-[10px] text-gray-500 uppercase mr-1">Runtime:</span>
				{runtimes.map((runtime) => {
					const isActive = state.filter.runtimes.has(runtime)
					return (
						<button
							type="button"
							key={runtime}
							onClick={() => toggleRuntime(runtime)}
							className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
								isActive
									? `${runtimeColors[runtime]} bg-white/10`
									: 'text-gray-600 hover:text-gray-400'
							}`}
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
				placeholder="Search logs..."
				value={state.filter.search}
				onChange={(e) => setSearch(e.target.value)}
				className="px-2 py-1 bg-black/30 border border-white/10 rounded text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-white/30 w-40"
			/>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Log count */}
			<span className="text-[10px] text-gray-500">{filteredLogs.length} logs</span>

			{/* Auto-scroll toggle */}
			<button
				type="button"
				onClick={toggleAutoScroll}
				className={`px-2 py-1 rounded text-[10px] transition-all ${
					state.autoScroll ? 'text-green-400 bg-green-500/10' : 'text-gray-500 hover:text-gray-400'
				}`}
				title={state.autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
			>
				{state.autoScroll ? '⬇️ Auto' : '⏸️ Paused'}
			</button>

			{/* Clear button */}
			<button
				type="button"
				onClick={clearServerLogs}
				className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[10px] hover:bg-red-500/20 transition-colors"
			>
				Clear
			</button>
		</div>
	)
}

/**
 * Connection status indicator
 */
function ConnectionStatus() {
	const { state } = useLogContext()

	return (
		<div className="flex items-center gap-2 px-3 py-1 bg-gray-900/50 border-b border-white/5">
			<span
				className={`w-2 h-2 rounded-full ${
					state.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
				}`}
			/>
			<span className="text-[10px] text-gray-500">
				{state.isConnected ? 'Connected to log stream' : 'Disconnected'}
			</span>
		</div>
	)
}

/**
 * Main log viewer component
 * Displays real-time logs with filtering and auto-scroll
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
		<div className="flex flex-col h-full bg-gray-950 text-gray-100 rounded-lg overflow-hidden border border-white/10">
			<ConnectionStatus />
			<FilterToolbar />
			<div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
				{filteredLogs.length === 0 ? (
					<div className="flex items-center justify-center h-full text-gray-500 text-sm">
						No logs to display
					</div>
				) : (
					filteredLogs.map((log) => (
						<LogRow
							key={log.id}
							log={log}
							isExpanded={expandedIds.has(log.id)}
							onToggle={() => toggleExpanded(log.id)}
						/>
					))
				)}
			</div>
		</div>
	)
}

/**
 * Compact log viewer for panels
 * Shows fewer controls, optimized for smaller spaces
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
		<div className="flex flex-col h-full bg-gray-950">
			{/* Compact header */}
			<div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-white/10">
				<div className="flex items-center gap-2">
					<span
						className={`w-2 h-2 rounded-full ${
							state.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
						}`}
					/>
					<span className="text-xs text-gray-400 font-medium">Live Logs</span>
					<span className="text-[10px] text-gray-600">({filteredLogs.length})</span>
				</div>
				<button
					type="button"
					onClick={clearServerLogs}
					className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
				>
					Clear
				</button>
			</div>

			{/* Log list */}
			<div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
				{filteredLogs.length === 0 ? (
					<div className="flex items-center justify-center h-32 text-gray-600 text-xs">
						Waiting for logs...
					</div>
				) : (
					filteredLogs.map((log) => (
						<LogRow
							key={log.id}
							log={log}
							isExpanded={expandedIds.has(log.id)}
							onToggle={() => toggleExpanded(log.id)}
						/>
					))
				)}
			</div>
		</div>
	)
}
