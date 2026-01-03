'use client'

import { type CSSProperties, memo, useEffect, useRef } from 'react'
import { LogEntry } from './log-entry'
import type { DevLogEntry } from './store'

interface LogViewerProps {
	logs: DevLogEntry[]
	autoScroll?: boolean
}

/**
 * Log viewer component with auto-scroll
 */
export const LogViewer = memo(function LogViewer({ logs, autoScroll = true }: LogViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const isAtBottomRef = useRef(true)

	// Track if user is at bottom
	const handleScroll = () => {
		if (!containerRef.current) return

		const { scrollTop, scrollHeight, clientHeight } = containerRef.current
		// Consider "at bottom" if within 50px
		isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50
	}

	// Auto-scroll when new logs arrive
	useEffect(() => {
		if (!autoScroll || !isAtBottomRef.current || !containerRef.current) return

		containerRef.current.scrollTop = containerRef.current.scrollHeight
	}, [logs.length, autoScroll])

	const containerStyle: CSSProperties = {
		flex: 1,
		overflow: 'auto',
		backgroundColor: 'white',
	}

	const emptyStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%',
		color: '#9ca3af',
		fontSize: '14px',
		gap: '8px',
	}

	const emptyIconStyle: CSSProperties = {
		fontSize: '32px',
		opacity: 0.5,
	}

	if (logs.length === 0) {
		return (
			<div style={containerStyle}>
				<div style={emptyStyle}>
					<span style={emptyIconStyle}>📋</span>
					<span>No logs yet</span>
					<span style={{ fontSize: '12px', opacity: 0.7 }}>Logs will appear here in real-time</span>
				</div>
			</div>
		)
	}

	return (
		<div ref={containerRef} style={containerStyle} onScroll={handleScroll}>
			{logs.map((log) => (
				<LogEntry key={log.id} log={log} />
			))}
		</div>
	)
})
