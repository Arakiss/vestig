'use client'

import { type CSSProperties, memo, useState } from 'react'
import type { DevLogEntry } from './store'

/**
 * Level colors
 */
const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
	trace: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
	debug: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
	info: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
	warn: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
	error: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
}

/**
 * Source badge colors
 */
const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
	client: { bg: '#e0e7ff', text: '#4338ca' },
	server: { bg: '#fae8ff', text: '#a21caf' },
}

interface LogEntryProps {
	log: DevLogEntry
	isExpanded?: boolean
	onToggleExpand?: () => void
}

/**
 * Single log entry component
 */
export const LogEntry = memo(function LogEntry({ log, isExpanded, onToggleExpand }: LogEntryProps) {
	const [localExpanded, setLocalExpanded] = useState(false)
	const expanded = isExpanded ?? localExpanded
	const toggleExpand = onToggleExpand ?? (() => setLocalExpanded((e) => !e))

	const levelColors = LEVEL_COLORS[log.level] ?? {
		bg: '#dcfce7',
		text: '#166534',
		border: '#86efac',
	}
	const sourceColors = SOURCE_COLORS[log.source] ?? { bg: '#e0e7ff', text: '#4338ca' }

	const hasDetails = Boolean(log.metadata || log.context || log.error)
	const timestamp = new Date(log.timestamp)
	const timeStr = timestamp.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		fractionalSecondDigits: 3,
	})

	const containerStyle: CSSProperties = {
		padding: '8px 12px',
		borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		fontSize: '12px',
		lineHeight: '1.5',
		cursor: hasDetails ? 'pointer' : 'default',
		backgroundColor: expanded ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
		transition: 'background-color 0.15s ease',
	}

	const headerStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		flexWrap: 'nowrap',
	}

	const timestampStyle: CSSProperties = {
		color: '#9ca3af',
		fontSize: '11px',
		flexShrink: 0,
	}

	const levelBadgeStyle: CSSProperties = {
		padding: '1px 6px',
		borderRadius: '4px',
		fontSize: '10px',
		fontWeight: 600,
		textTransform: 'uppercase',
		backgroundColor: levelColors.bg,
		color: levelColors.text,
		border: `1px solid ${levelColors.border}`,
		flexShrink: 0,
	}

	const sourceBadgeStyle: CSSProperties = {
		padding: '1px 6px',
		borderRadius: '4px',
		fontSize: '10px',
		fontWeight: 500,
		backgroundColor: sourceColors.bg,
		color: sourceColors.text,
		flexShrink: 0,
	}

	const namespaceStyle: CSSProperties = {
		color: '#6366f1',
		fontSize: '11px',
		flexShrink: 0,
	}

	const messageStyle: CSSProperties = {
		color: '#1f2937',
		flex: 1,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: expanded ? 'normal' : 'nowrap',
		wordBreak: 'break-word',
	}

	const expandIconStyle: CSSProperties = {
		color: '#9ca3af',
		marginLeft: 'auto',
		flexShrink: 0,
		transition: 'transform 0.15s ease',
		transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
	}

	const detailsStyle: CSSProperties = {
		marginTop: '8px',
		padding: '8px',
		backgroundColor: 'rgba(0, 0, 0, 0.03)',
		borderRadius: '4px',
		fontSize: '11px',
	}

	const detailSectionStyle: CSSProperties = {
		marginBottom: '8px',
	}

	const detailLabelStyle: CSSProperties = {
		color: '#6b7280',
		fontWeight: 600,
		marginBottom: '4px',
		textTransform: 'uppercase',
		fontSize: '10px',
		letterSpacing: '0.05em',
	}

	const detailContentStyle: CSSProperties = {
		padding: '4px 8px',
		backgroundColor: 'rgba(255, 255, 255, 0.8)',
		borderRadius: '2px',
		overflow: 'auto',
		maxHeight: '200px',
	}

	const preStyle: CSSProperties = {
		margin: 0,
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
		fontSize: '11px',
		color: '#374151',
	}

	const errorStackStyle: CSSProperties = {
		...preStyle,
		color: '#dc2626',
		backgroundColor: 'rgba(220, 38, 38, 0.05)',
		padding: '8px',
		borderRadius: '4px',
	}

	return (
		<div
			style={containerStyle}
			onClick={hasDetails ? toggleExpand : undefined}
			role={hasDetails ? 'button' : undefined}
			tabIndex={hasDetails ? 0 : undefined}
			onKeyDown={
				hasDetails
					? (e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								toggleExpand()
							}
						}
					: undefined
			}
		>
			<div style={headerStyle}>
				<span style={timestampStyle}>{timeStr}</span>
				<span style={levelBadgeStyle}>{log.level}</span>
				<span style={sourceBadgeStyle}>{log.source}</span>
				{log.namespace && <span style={namespaceStyle}>[{log.namespace}]</span>}
				<span style={messageStyle}>{log.message}</span>
				{hasDetails && (
					<span style={expandIconStyle}>
						<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
							<path d="M6 8L2 4h8L6 8z" />
						</svg>
					</span>
				)}
			</div>

			{expanded && hasDetails && (
				<div style={detailsStyle}>
					{log.error && (
						<div style={detailSectionStyle}>
							<div style={detailLabelStyle}>Error</div>
							<div style={detailContentStyle}>
								<div style={{ color: '#dc2626', fontWeight: 600, marginBottom: '4px' }}>
									{log.error.name}: {log.error.message}
								</div>
								{log.error.stack && <pre style={errorStackStyle}>{log.error.stack}</pre>}
							</div>
						</div>
					)}

					{log.metadata && Object.keys(log.metadata).length > 0 && (
						<div style={detailSectionStyle}>
							<div style={detailLabelStyle}>Metadata</div>
							<div style={detailContentStyle}>
								<pre style={preStyle}>{JSON.stringify(log.metadata, null, 2)}</pre>
							</div>
						</div>
					)}

					{log.context && Object.keys(log.context).length > 0 && (
						<div style={detailSectionStyle}>
							<div style={detailLabelStyle}>Context</div>
							<div style={detailContentStyle}>
								<pre style={preStyle}>{JSON.stringify(log.context, null, 2)}</pre>
							</div>
						</div>
					)}

					{log.duration !== undefined && (
						<div style={detailSectionStyle}>
							<div style={detailLabelStyle}>Duration</div>
							<div style={detailContentStyle}>
								<span style={{ color: '#059669', fontWeight: 500 }}>
									{log.duration.toFixed(2)}ms
								</span>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
})
