'use client'

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from 'react'
import type { LogLevel, Runtime } from 'vestig'
import { API_LIMITS } from './constants'
import type { DemoLogEntry } from './demo-transport'

/**
 * Filter configuration for log viewer
 */
export interface LogFilter {
	levels: Set<LogLevel>
	runtimes: Set<Runtime | 'unknown'>
	search: string
	namespace?: string
}

/**
 * Connection state for SSE
 */
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Log context state
 */
interface LogState {
	logs: DemoLogEntry[]
	filter: LogFilter
	connectionStatus: ConnectionStatus
	isPanelOpen: boolean
	autoScroll: boolean
	maxLogs: number
	reconnectAttempts: number
	lastError: string | null
}

/**
 * Available actions for log state
 */
type LogAction =
	| { type: 'ADD_LOG'; payload: DemoLogEntry }
	| { type: 'ADD_LOGS'; payload: DemoLogEntry[] }
	| { type: 'CLEAR_LOGS' }
	| { type: 'SET_FILTER'; payload: Partial<LogFilter> }
	| { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
	| { type: 'SET_ERROR'; payload: string }
	| { type: 'INCREMENT_RECONNECT' }
	| { type: 'RESET_RECONNECT' }
	| { type: 'TOGGLE_PANEL' }
	| { type: 'SET_PANEL_OPEN'; payload: boolean }
	| { type: 'TOGGLE_AUTO_SCROLL' }

const ALL_LEVELS: Set<LogLevel> = new Set(['trace', 'debug', 'info', 'warn', 'error'])
const ALL_RUNTIMES: Set<Runtime | 'unknown'> = new Set([
	'node',
	'bun',
	'edge',
	'browser',
	'worker',
	'unknown',
])

const initialFilter: LogFilter = {
	levels: ALL_LEVELS,
	runtimes: ALL_RUNTIMES,
	search: '',
}

const initialState: LogState = {
	logs: [],
	filter: initialFilter,
	connectionStatus: 'disconnected',
	isPanelOpen: false,
	autoScroll: true,
	maxLogs: API_LIMITS.MAX_LOGS,
	reconnectAttempts: 0,
	lastError: null,
}

/**
 * Reducer for log state management
 */
function logReducer(state: LogState, action: LogAction): LogState {
	switch (action.type) {
		case 'ADD_LOG': {
			const newLogs = [...state.logs, action.payload]
			// Keep memory bounded - use slice for O(1) instead of shift O(n)
			return {
				...state,
				logs: newLogs.length > state.maxLogs ? newLogs.slice(-state.maxLogs) : newLogs,
			}
		}
		case 'ADD_LOGS': {
			const newLogs = [...state.logs, ...action.payload]
			// Keep memory bounded - use slice for efficiency
			return {
				...state,
				logs: newLogs.length > state.maxLogs ? newLogs.slice(-state.maxLogs) : newLogs,
			}
		}
		case 'CLEAR_LOGS':
			return { ...state, logs: [], lastError: null }
		case 'SET_FILTER':
			return { ...state, filter: { ...state.filter, ...action.payload } }
		case 'SET_CONNECTION_STATUS':
			return {
				...state,
				connectionStatus: action.payload,
				// Clear error on successful connection
				lastError: action.payload === 'connected' ? null : state.lastError,
			}
		case 'SET_ERROR':
			return { ...state, lastError: action.payload, connectionStatus: 'error' }
		case 'INCREMENT_RECONNECT':
			return { ...state, reconnectAttempts: state.reconnectAttempts + 1 }
		case 'RESET_RECONNECT':
			return { ...state, reconnectAttempts: 0, lastError: null }
		case 'TOGGLE_PANEL':
			return { ...state, isPanelOpen: !state.isPanelOpen }
		case 'SET_PANEL_OPEN':
			return { ...state, isPanelOpen: action.payload }
		case 'TOGGLE_AUTO_SCROLL':
			return { ...state, autoScroll: !state.autoScroll }
		default:
			return state
	}
}

// ============================================================================
// SPLIT CONTEXTS FOR PERFORMANCE
// ============================================================================

/**
 * Context for log data (changes frequently)
 */
interface LogDataContextValue {
	logs: DemoLogEntry[]
	filteredLogs: DemoLogEntry[]
	filter: LogFilter
	autoScroll: boolean
}

/**
 * Context for stable action callbacks (rarely changes)
 */
interface LogActionsContextValue {
	addLog: (log: DemoLogEntry) => void
	clearLogs: () => void
	setFilter: (filter: Partial<LogFilter>) => void
	toggleLevel: (level: LogLevel) => void
	toggleRuntime: (runtime: Runtime | 'unknown') => void
	setSearch: (search: string) => void
	toggleAutoScroll: () => void
	clearServerLogs: () => Promise<void>
}

/**
 * Context for panel state (changes less frequently than logs)
 */
interface LogPanelContextValue {
	isPanelOpen: boolean
	connectionStatus: ConnectionStatus
	lastError: string | null
	reconnectAttempts: number
	togglePanel: () => void
	setPanelOpen: (open: boolean) => void
}

/**
 * Legacy context value interface (for backwards compatibility)
 */
interface LogContextValue {
	state: LogState
	filteredLogs: DemoLogEntry[]
	addLog: (log: DemoLogEntry) => void
	clearLogs: () => void
	setFilter: (filter: Partial<LogFilter>) => void
	toggleLevel: (level: LogLevel) => void
	toggleRuntime: (runtime: Runtime | 'unknown') => void
	setSearch: (search: string) => void
	togglePanel: () => void
	setPanelOpen: (open: boolean) => void
	toggleAutoScroll: () => void
	clearServerLogs: () => Promise<void>
}

// Create separate contexts
const LogDataContext = createContext<LogDataContextValue | null>(null)
const LogActionsContext = createContext<LogActionsContextValue | null>(null)
const LogPanelContext = createContext<LogPanelContextValue | null>(null)

// Legacy context for backwards compatibility
const LogContext = createContext<LogContextValue | null>(null)

/**
 * Log provider component
 * Wraps the app and provides log state + SSE connection
 *
 * Uses split contexts for performance:
 * - LogDataContext: frequently changing log data
 * - LogActionsContext: stable action callbacks
 * - LogPanelContext: panel and connection state
 */
export function LogProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(logReducer, initialState)

	// Memoized filter function - avoids expensive JSON.stringify on every render
	const filteredLogs = useMemo(() => {
		return state.logs.filter((log) => {
			// Level filter
			if (!state.filter.levels.has(log.level)) return false
			// Runtime filter
			if (!state.filter.runtimes.has(log.runtime)) return false
			// Namespace filter
			if (
				state.filter.namespace &&
				log.namespace &&
				!log.namespace.includes(state.filter.namespace)
			) {
				return false
			}
			// Search filter
			if (state.filter.search) {
				const searchLower = state.filter.search.toLowerCase()
				const messageMatch = log.message.toLowerCase().includes(searchLower)
				const metadataMatch =
					log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
				if (!messageMatch && !metadataMatch) return false
			}
			return true
		})
	}, [state.logs, state.filter])

	// Track reconnect attempts with ref to avoid stale closure issues
	const reconnectAttemptsRef = useRef(state.reconnectAttempts)
	reconnectAttemptsRef.current = state.reconnectAttempts

	// Connect to SSE stream with exponential backoff reconnection
	useEffect(() => {
		let eventSource: EventSource | null = null
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
		const abortController = new AbortController()

		const connect = () => {
			if (abortController.signal.aborted) return

			dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' })
			eventSource = new EventSource('/api/logs')

			eventSource.onopen = () => {
				if (abortController.signal.aborted) return
				dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
				dispatch({ type: 'RESET_RECONNECT' })
			}

			eventSource.onmessage = (event) => {
				if (abortController.signal.aborted) return
				try {
					const log = JSON.parse(event.data) as DemoLogEntry
					dispatch({ type: 'ADD_LOG', payload: log })
				} catch (error) {
					console.error(
						'[LogProvider] Failed to parse log entry:',
						error instanceof Error ? error.message : 'Unknown error',
					)
				}
			}

			eventSource.onerror = () => {
				if (abortController.signal.aborted) return

				// Close current connection
				eventSource?.close()
				eventSource = null

				dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' })
				dispatch({ type: 'INCREMENT_RECONNECT' })

				// Use ref to get current reconnect attempts (avoids stale closure)
				const currentAttempts = reconnectAttemptsRef.current

				// Check if we should retry
				if (currentAttempts < API_LIMITS.MAX_RECONNECT_ATTEMPTS) {
					// Calculate delay with exponential backoff
					const delay = Math.min(
						API_LIMITS.BASE_RECONNECT_DELAY * 2 ** currentAttempts,
						API_LIMITS.MAX_RECONNECT_DELAY,
					)
					console.warn(
						`[LogProvider] Connection lost. Reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/${API_LIMITS.MAX_RECONNECT_ATTEMPTS})`,
					)
					reconnectTimeout = setTimeout(connect, delay)
				} else {
					dispatch({
						type: 'SET_ERROR',
						payload: 'Maximum reconnection attempts reached. Please refresh the page.',
					})
					console.error('[LogProvider] Max reconnection attempts reached')
				}
			}
		}

		connect()

		return () => {
			abortController.abort()
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout)
			}
			if (eventSource) {
				eventSource.close()
			}
			dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' })
		}
	}, []) // Empty deps - effect runs once, uses ref for current values

	// Stable refs for callbacks that need current filter state
	const filterRef = useRef(state.filter)
	filterRef.current = state.filter

	// ============================================================================
	// ACTION CREATORS (stable references via useCallback)
	// ============================================================================

	const addLog = useCallback((log: DemoLogEntry) => {
		dispatch({ type: 'ADD_LOG', payload: log })
	}, [])

	const clearLogs = useCallback(() => {
		dispatch({ type: 'CLEAR_LOGS' })
	}, [])

	const setFilter = useCallback((filter: Partial<LogFilter>) => {
		dispatch({ type: 'SET_FILTER', payload: filter })
	}, [])

	const toggleLevel = useCallback((level: LogLevel) => {
		const newLevels = new Set(filterRef.current.levels)
		if (newLevels.has(level)) {
			newLevels.delete(level)
		} else {
			newLevels.add(level)
		}
		dispatch({ type: 'SET_FILTER', payload: { levels: newLevels } })
	}, [])

	const toggleRuntime = useCallback((runtime: Runtime | 'unknown') => {
		const newRuntimes = new Set(filterRef.current.runtimes)
		if (newRuntimes.has(runtime)) {
			newRuntimes.delete(runtime)
		} else {
			newRuntimes.add(runtime)
		}
		dispatch({ type: 'SET_FILTER', payload: { runtimes: newRuntimes } })
	}, [])

	const setSearch = useCallback((search: string) => {
		dispatch({ type: 'SET_FILTER', payload: { search } })
	}, [])

	const togglePanel = useCallback(() => {
		dispatch({ type: 'TOGGLE_PANEL' })
	}, [])

	const setPanelOpen = useCallback((open: boolean) => {
		dispatch({ type: 'SET_PANEL_OPEN', payload: open })
	}, [])

	const toggleAutoScroll = useCallback(() => {
		dispatch({ type: 'TOGGLE_AUTO_SCROLL' })
	}, [])

	const clearServerLogs = useCallback(async () => {
		try {
			const response = await fetch('/api/logs', { method: 'DELETE' })
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || `HTTP ${response.status}`)
			}
			dispatch({ type: 'CLEAR_LOGS' })
		} catch (error) {
			console.error(
				'[LogProvider] Failed to clear server logs:',
				error instanceof Error ? error.message : 'Unknown error',
			)
			// Still clear local logs even if server clear fails
			dispatch({ type: 'CLEAR_LOGS' })
			throw error // Re-throw so caller can handle
		}
	}, [])

	// ============================================================================
	// MEMOIZED CONTEXT VALUES (split for performance)
	// ============================================================================

	// Log data context - changes when logs or filter change
	const logDataValue = useMemo<LogDataContextValue>(
		() => ({
			logs: state.logs,
			filteredLogs,
			filter: state.filter,
			autoScroll: state.autoScroll,
		}),
		[state.logs, filteredLogs, state.filter, state.autoScroll],
	)

	// Actions context - stable references, rarely changes
	const logActionsValue = useMemo<LogActionsContextValue>(
		() => ({
			addLog,
			clearLogs,
			setFilter,
			toggleLevel,
			toggleRuntime,
			setSearch,
			toggleAutoScroll,
			clearServerLogs,
		}),
		[
			addLog,
			clearLogs,
			setFilter,
			toggleLevel,
			toggleRuntime,
			setSearch,
			toggleAutoScroll,
			clearServerLogs,
		],
	)

	// Panel context - changes less frequently than logs
	const logPanelValue = useMemo<LogPanelContextValue>(
		() => ({
			isPanelOpen: state.isPanelOpen,
			connectionStatus: state.connectionStatus,
			lastError: state.lastError,
			reconnectAttempts: state.reconnectAttempts,
			togglePanel,
			setPanelOpen,
		}),
		[
			state.isPanelOpen,
			state.connectionStatus,
			state.lastError,
			state.reconnectAttempts,
			togglePanel,
			setPanelOpen,
		],
	)

	// Legacy combined context for backwards compatibility
	const legacyValue = useMemo<LogContextValue>(
		() => ({
			state,
			filteredLogs,
			addLog,
			clearLogs,
			setFilter,
			toggleLevel,
			toggleRuntime,
			setSearch,
			togglePanel,
			setPanelOpen,
			toggleAutoScroll,
			clearServerLogs,
		}),
		[
			state,
			filteredLogs,
			addLog,
			clearLogs,
			setFilter,
			toggleLevel,
			toggleRuntime,
			setSearch,
			togglePanel,
			setPanelOpen,
			toggleAutoScroll,
			clearServerLogs,
		],
	)

	return (
		<LogContext.Provider value={legacyValue}>
			<LogDataContext.Provider value={logDataValue}>
				<LogActionsContext.Provider value={logActionsValue}>
					<LogPanelContext.Provider value={logPanelValue}>{children}</LogPanelContext.Provider>
				</LogActionsContext.Provider>
			</LogDataContext.Provider>
		</LogContext.Provider>
	)
}

// ============================================================================
// HOOKS - SPLIT FOR PERFORMANCE
// ============================================================================

/**
 * Hook to access log data (logs, filtered logs, filter state)
 * Use this when you need to display logs
 */
export function useLogData() {
	const context = useContext(LogDataContext)
	if (!context) {
		throw new Error('useLogData must be used within a LogProvider')
	}
	return context
}

/**
 * Hook to access log actions (addLog, clearLogs, setFilter, etc.)
 * Use this when you need to modify log state
 * This won't re-render when logs change
 */
export function useLogActions() {
	const context = useContext(LogActionsContext)
	if (!context) {
		throw new Error('useLogActions must be used within a LogProvider')
	}
	return context
}

/**
 * Hook to access panel state (isOpen, connection status)
 * Use this for panel UI components
 * This won't re-render when logs change
 */
export function useLogPanelState() {
	const context = useContext(LogPanelContext)
	if (!context) {
		throw new Error('useLogPanelState must be used within a LogProvider')
	}
	return context
}

// ============================================================================
// LEGACY HOOKS (backwards compatibility)
// ============================================================================

/**
 * Hook to access full log context (legacy - for backwards compatibility)
 * Consider using useLogData, useLogActions, or useLogPanelState for better performance
 */
export function useLogContext() {
	const context = useContext(LogContext)
	if (!context) {
		throw new Error('useLogContext must be used within a LogProvider')
	}
	return context
}

/**
 * Hook for just the filtered logs (common use case)
 */
export function useLogs() {
	const { filteredLogs } = useLogData()
	return filteredLogs
}

/**
 * Hook for log panel state
 */
export function useLogPanel() {
	const panelState = useLogPanelState()
	const { filteredLogs } = useLogData()

	return {
		isOpen: panelState.isPanelOpen,
		toggle: panelState.togglePanel,
		setOpen: panelState.setPanelOpen,
		logCount: filteredLogs.length,
		isConnected: panelState.connectionStatus === 'connected',
		connectionStatus: panelState.connectionStatus,
		lastError: panelState.lastError,
		reconnectAttempts: panelState.reconnectAttempts,
	}
}
