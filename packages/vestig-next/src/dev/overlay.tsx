'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filters } from './filters'
import { LogViewer } from './log-viewer'
import { MetricsPanel } from './metrics-panel'

type TabType = 'logs' | 'metrics'

/**
 * Props for VestigDevOverlay
 */
export interface VestigDevOverlayProps {
	/**
	 * Position of the overlay button
	 * @default 'bottom-right'
	 */
	position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

	/**
	 * SSE endpoint for server logs
	 * @default '/api/vestig/logs'
	 */
	endpoint?: string

	/**
	 * Keyboard shortcut key (used with Cmd/Ctrl)
	 * @default 'l'
	 */
	toggleKey?: string

	/**
	 * Initial panel size
	 * @default { width: 500, height: 400 }
	 */
	defaultSize?: { width: number; height: number }

	/**
	 * Whether to start with the panel open
	 * @default false
	 */
	defaultOpen?: boolean
}

/**
 * Development overlay for real-time log viewing
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { VestigDevOverlay } from '@vestig/next/dev'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         {process.env.NODE_ENV === 'development' && <VestigDevOverlay />}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function VestigDevOverlay(props: VestigDevOverlayProps) {
	const [mounted, setMounted] = useState(false)

	// Only mount on client - prevents SSR issues
	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return null
	}

	// Render the actual overlay only on client
	return <VestigDevOverlayClient {...props} />
}

/**
 * Client-only component that uses the hooks
 */
function VestigDevOverlayClient({
	position = 'bottom-right',
	endpoint = '/api/vestig/logs',
	toggleKey = 'l',
	defaultSize = { width: 500, height: 400 },
	defaultOpen = false,
}: VestigDevOverlayProps) {
	// Import hooks lazily to ensure they're only used on client
	const {
		useLogStore,
		useServerLogs,
		useClientLogCapture,
		useDevOverlayShortcuts,
	} = require('./hooks/use-logs')

	const [size, setSize] = useState(defaultSize)
	const [activeTab, setActiveTab] = useState<TabType>('logs')

	const {
		logs,
		isOpen,
		filters,
		namespaces,
		levelCounts,
		toggleOpen,
		setOpen,
		clearLogs,
		setLevelFilter,
		setSearch,
		setSourceFilter,
	} = useLogStore()

	// Connect to server logs via SSE
	useServerLogs({ endpoint, enabled: true })

	// Capture client-side logs
	useClientLogCapture({ enabled: true })

	// Setup keyboard shortcuts
	useDevOverlayShortcuts({ toggleKey, enabled: true })

	// Set default open state
	useEffect(() => {
		if (defaultOpen) {
			setOpen(true)
		}
	}, [defaultOpen, setOpen])

	const positionStyles: Record<string, CSSProperties> = {
		'bottom-right': { bottom: '16px', right: '16px' },
		'bottom-left': { bottom: '16px', left: '16px' },
		'top-right': { top: '16px', right: '16px' },
		'top-left': { top: '16px', left: '16px' },
	}

	const panelPositionStyles: Record<string, CSSProperties> = {
		'bottom-right': { bottom: '60px', right: '16px' },
		'bottom-left': { bottom: '60px', left: '16px' },
		'top-right': { top: '60px', right: '16px' },
		'top-left': { top: '60px', left: '16px' },
	}

	const buttonStyle: CSSProperties = {
		position: 'fixed',
		...positionStyles[position],
		width: '44px',
		height: '44px',
		borderRadius: '50%',
		border: 'none',
		backgroundColor: isOpen ? '#4f46e5' : '#1f2937',
		color: 'white',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
		zIndex: 99999,
		transition: 'all 0.2s ease',
		fontSize: '18px',
	}

	const errorCount = levelCounts.error
	const badgeStyle: CSSProperties = {
		position: 'absolute',
		top: '-4px',
		right: '-4px',
		width: '20px',
		height: '20px',
		borderRadius: '50%',
		backgroundColor: '#dc2626',
		color: 'white',
		fontSize: '11px',
		fontWeight: 700,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}

	const panelStyle: CSSProperties = {
		position: 'fixed',
		...panelPositionStyles[position],
		width: `${size.width}px`,
		height: `${size.height}px`,
		backgroundColor: 'white',
		borderRadius: '12px',
		boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)',
		zIndex: 99998,
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		border: '1px solid rgba(0, 0, 0, 0.08)',
	}

	const headerStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '10px 12px',
		borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
		backgroundColor: '#1f2937',
		color: 'white',
		borderRadius: '12px 12px 0 0',
	}

	const titleStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		fontSize: '13px',
		fontWeight: 600,
	}

	const logoStyle: CSSProperties = {
		width: '20px',
		height: '20px',
		borderRadius: '4px',
		backgroundColor: '#4f46e5',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '12px',
	}

	const headerActionsStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	}

	const closeButtonStyle: CSSProperties = {
		background: 'none',
		border: 'none',
		color: 'rgba(255, 255, 255, 0.7)',
		cursor: 'pointer',
		padding: '4px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '4px',
		transition: 'color 0.15s ease',
	}

	const shortcutBadgeStyle: CSSProperties = {
		fontSize: '10px',
		color: 'rgba(255, 255, 255, 0.5)',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		padding: '2px 6px',
		borderRadius: '4px',
	}

	const statusStyle: CSSProperties = {
		padding: '6px 12px',
		borderTop: '1px solid rgba(0, 0, 0, 0.08)',
		backgroundColor: '#f9fafb',
		fontSize: '11px',
		color: '#6b7280',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	}

	const tabsContainerStyle: CSSProperties = {
		display: 'flex',
		borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
		backgroundColor: '#f9fafb',
	}

	const tabStyle = (isActive: boolean): CSSProperties => ({
		flex: 1,
		padding: '8px 12px',
		fontSize: '12px',
		fontWeight: 500,
		color: isActive ? '#4f46e5' : '#6b7280',
		backgroundColor: isActive ? 'white' : 'transparent',
		border: 'none',
		borderBottom: isActive ? '2px solid #4f46e5' : '2px solid transparent',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '6px',
		transition: 'all 0.15s ease',
	})

	return createPortal(
		<>
			{/* Toggle Button */}
			<button
				style={buttonStyle}
				onClick={toggleOpen}
				title={`Toggle Vestig DevTools (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+${toggleKey.toUpperCase()})`}
			>
				<span>📋</span>
				{errorCount > 0 && <span style={badgeStyle}>{errorCount > 99 ? '99+' : errorCount}</span>}
			</button>

			{/* Panel */}
			{isOpen && (
				<div style={panelStyle}>
					{/* Header */}
					<div style={headerStyle}>
						<div style={titleStyle}>
							<div style={logoStyle}>V</div>
							<span>Vestig DevTools</span>
						</div>
						<div style={headerActionsStyle}>
							<span style={shortcutBadgeStyle}>
								{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+{toggleKey.toUpperCase()}
							</span>
							<button
								style={closeButtonStyle}
								onClick={() => setOpen(false)}
								title="Close (Esc)"
								onMouseEnter={(e) => {
									e.currentTarget.style.color = 'white'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
								}}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
									<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
								</svg>
							</button>
						</div>
					</div>

					{/* Tabs */}
					<div style={tabsContainerStyle}>
						<button style={tabStyle(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
							<span>📋</span>
							<span>Logs</span>
							{logs.length > 0 && (
								<span
									style={{
										backgroundColor: activeTab === 'logs' ? '#e0e7ff' : '#e5e7eb',
										color: activeTab === 'logs' ? '#4338ca' : '#6b7280',
										padding: '1px 6px',
										borderRadius: '10px',
										fontSize: '10px',
									}}
								>
									{logs.length}
								</span>
							)}
						</button>
						<button
							style={tabStyle(activeTab === 'metrics')}
							onClick={() => setActiveTab('metrics')}
						>
							<span>📊</span>
							<span>Metrics</span>
						</button>
					</div>

					{/* Tab Content */}
					{activeTab === 'logs' && (
						<>
							<Filters
								filters={filters}
								levelCounts={levelCounts}
								namespaces={namespaces}
								onSetLevelFilter={setLevelFilter}
								onSetSearch={setSearch}
								onSetSourceFilter={setSourceFilter}
								onClearLogs={clearLogs}
							/>
							<LogViewer logs={logs} />
						</>
					)}

					{activeTab === 'metrics' && <MetricsPanel />}

					{/* Status Bar */}
					<div style={statusStyle}>
						<span>
							{logs.length} log{logs.length !== 1 ? 's' : ''}
							{filters.search && ` matching "${filters.search}"`}
						</span>
						<span>
							<span style={{ color: '#16a34a' }}>●</span> Connected
						</span>
					</div>
				</div>
			)}
		</>,
		document.body,
	)
}
