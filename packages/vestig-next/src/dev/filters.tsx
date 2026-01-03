'use client'

import { type CSSProperties, memo } from 'react'
import type { LogLevel } from 'vestig'
import type { LogFilters } from './store'

/**
 * Level config for display
 */
const LEVELS: Array<{ level: LogLevel; label: string; color: string; bgColor: string }> = [
	{ level: 'trace', label: 'TRC', color: '#6b7280', bgColor: '#f3f4f6' },
	{ level: 'debug', label: 'DBG', color: '#1e40af', bgColor: '#dbeafe' },
	{ level: 'info', label: 'INF', color: '#166534', bgColor: '#dcfce7' },
	{ level: 'warn', label: 'WRN', color: '#92400e', bgColor: '#fef3c7' },
	{ level: 'error', label: 'ERR', color: '#991b1b', bgColor: '#fee2e2' },
]

interface FiltersProps {
	filters: LogFilters
	levelCounts: Record<LogLevel, number>
	namespaces: string[]
	onSetLevelFilter: (level: LogLevel, enabled: boolean) => void
	onSetSearch: (search: string) => void
	onSetSourceFilter: (source: 'all' | 'client' | 'server') => void
	onClearLogs: () => void
}

/**
 * Filter controls component
 */
export const Filters = memo(function Filters({
	filters,
	levelCounts,
	onSetLevelFilter,
	onSetSearch,
	onSetSourceFilter,
	onClearLogs,
}: FiltersProps) {
	const containerStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		padding: '12px',
		borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
		backgroundColor: '#fafafa',
	}

	const rowStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		flexWrap: 'wrap',
	}

	const searchInputStyle: CSSProperties = {
		flex: 1,
		minWidth: '200px',
		padding: '6px 10px',
		border: '1px solid #e5e7eb',
		borderRadius: '6px',
		fontSize: '13px',
		fontFamily: 'inherit',
		backgroundColor: 'white',
		outline: 'none',
		transition: 'border-color 0.15s ease',
	}

	const buttonGroupStyle: CSSProperties = {
		display: 'flex',
		gap: '4px',
	}

	const sourceButtonStyle = (active: boolean): CSSProperties => ({
		padding: '4px 10px',
		border: '1px solid #e5e7eb',
		borderRadius: '4px',
		fontSize: '12px',
		fontWeight: 500,
		cursor: 'pointer',
		backgroundColor: active ? '#4f46e5' : 'white',
		color: active ? 'white' : '#374151',
		transition: 'all 0.15s ease',
	})

	const levelButtonStyle = (level: LogLevel, active: boolean): CSSProperties => {
		const config = LEVELS.find((l) => l.level === level)!
		return {
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
			padding: '4px 8px',
			border: `1px solid ${active ? config.color : '#e5e7eb'}`,
			borderRadius: '4px',
			fontSize: '11px',
			fontWeight: 600,
			cursor: 'pointer',
			backgroundColor: active ? config.bgColor : 'white',
			color: active ? config.color : '#9ca3af',
			opacity: active ? 1 : 0.6,
			transition: 'all 0.15s ease',
		}
	}

	const countBadgeStyle: CSSProperties = {
		fontSize: '10px',
		fontWeight: 500,
		opacity: 0.8,
	}

	const clearButtonStyle: CSSProperties = {
		marginLeft: 'auto',
		padding: '4px 10px',
		border: '1px solid #fca5a5',
		borderRadius: '4px',
		fontSize: '12px',
		fontWeight: 500,
		cursor: 'pointer',
		backgroundColor: 'white',
		color: '#dc2626',
		transition: 'all 0.15s ease',
	}

	return (
		<div style={containerStyle}>
			{/* Top row: Search and source filter */}
			<div style={rowStyle}>
				<input
					type="text"
					placeholder="Search logs..."
					value={filters.search}
					onChange={(e) => onSetSearch(e.target.value)}
					style={searchInputStyle}
					onFocus={(e) => {
						e.target.style.borderColor = '#4f46e5'
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#e5e7eb'
					}}
				/>

				<div style={buttonGroupStyle}>
					<button
						style={sourceButtonStyle(filters.source === 'all')}
						onClick={() => onSetSourceFilter('all')}
					>
						All
					</button>
					<button
						style={sourceButtonStyle(filters.source === 'client')}
						onClick={() => onSetSourceFilter('client')}
					>
						Client
					</button>
					<button
						style={sourceButtonStyle(filters.source === 'server')}
						onClick={() => onSetSourceFilter('server')}
					>
						Server
					</button>
				</div>

				<button style={clearButtonStyle} onClick={onClearLogs} title="Clear all logs">
					Clear
				</button>
			</div>

			{/* Bottom row: Level filters */}
			<div style={rowStyle}>
				{LEVELS.map(({ level, label }) => (
					<button
						key={level}
						style={levelButtonStyle(level, filters.levels.has(level))}
						onClick={() => onSetLevelFilter(level, !filters.levels.has(level))}
						title={`Toggle ${level} logs`}
					>
						<span>{label}</span>
						<span style={countBadgeStyle}>({levelCounts[level]})</span>
					</button>
				))}
			</div>
		</div>
	)
})
