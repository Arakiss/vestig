'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogLevel } from 'vestig'
import { type DevLogEntry, type LogFilters, type LogStoreState, logStore } from '../store'

/**
 * Hook to subscribe to log store
 *
 * Uses simple useState + useEffect pattern - React Compiler handles memoization.
 */
export function useLogStore() {
	const [logs, setLogs] = useState<DevLogEntry[]>([])
	const [state, setState] = useState<LogStoreState>(() => logStore.getSnapshot())

	useEffect(() => {
		// Get initial state
		setLogs(logStore.getFilteredLogs())
		setState(logStore.getSnapshot())

		// Subscribe to updates
		const unsubscribe = logStore.subscribe(() => {
			setLogs(logStore.getFilteredLogs())
			setState(logStore.getSnapshot())
		})

		return unsubscribe
	}, [])

	return {
		logs,
		isOpen: state.isOpen,
		filters: state.filters,
		namespaces: logStore.getNamespaces(),
		levelCounts: logStore.getLevelCounts(),
		// Actions - bound methods from the store
		toggleOpen: () => logStore.toggleOpen(),
		setOpen: (isOpen: boolean) => logStore.setOpen(isOpen),
		clearLogs: () => logStore.clearLogs(),
		setLevelFilter: (level: LogLevel, enabled: boolean) => logStore.setLevelFilter(level, enabled),
		toggleAllLevels: (enabled: boolean) => logStore.toggleAllLevels(enabled),
		setNamespaceFilter: (namespace: string, enabled: boolean) =>
			logStore.setNamespaceFilter(namespace, enabled),
		setSearch: (search: string) => logStore.setSearch(search),
		setSourceFilter: (source: 'all' | 'client' | 'server') => logStore.setSourceFilter(source),
	}
}

/**
 * SSE connection state
 */
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Hook to connect to SSE log stream
 */
export function useServerLogs(options: {
	endpoint?: string
	enabled?: boolean
	reconnectDelay?: number
	maxReconnectAttempts?: number
}) {
	const {
		endpoint = '/api/vestig/logs',
		enabled = true,
		reconnectDelay = 2000,
		maxReconnectAttempts = 5,
	} = options

	const eventSourceRef = useRef<EventSource | null>(null)
	const reconnectAttempts = useRef(0)
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const connectionStateRef = useRef<ConnectionState>('disconnected')

	const connect = useCallback(() => {
		if (typeof window === 'undefined') return
		if (!enabled) return

		if (eventSourceRef.current) {
			eventSourceRef.current.close()
		}

		connectionStateRef.current = 'connecting'

		try {
			const eventSource = new EventSource(endpoint)
			eventSourceRef.current = eventSource

			eventSource.onopen = () => {
				connectionStateRef.current = 'connected'
				reconnectAttempts.current = 0
			}

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data)

					if (data.type === 'log') {
						logStore.addLog({
							timestamp: data.timestamp,
							level: data.level,
							message: data.message,
							namespace: data.namespace,
							metadata: data.metadata,
							context: data.context,
							error: data.error,
							source: 'server',
							traceId: data.context?.traceId,
							spanId: data.context?.spanId,
							duration: data.duration,
						})
					} else if (data.type === 'batch') {
						const entries: Array<Omit<DevLogEntry, 'id'>> = data.logs.map(
							(log: Record<string, unknown>) => ({
								timestamp: log.timestamp as string,
								level: log.level as LogLevel,
								message: log.message as string,
								namespace: log.namespace as string | undefined,
								metadata: log.metadata as Record<string, unknown> | undefined,
								context: log.context as Record<string, unknown> | undefined,
								error: log.error as DevLogEntry['error'] | undefined,
								source: 'server' as const,
								traceId: (log.context as Record<string, unknown> | undefined)?.traceId as
									| string
									| undefined,
								spanId: (log.context as Record<string, unknown> | undefined)?.spanId as
									| string
									| undefined,
								duration: log.duration as number | undefined,
							}),
						)
						logStore.addLogs(entries)
					}
				} catch (error) {
					console.error('[vestig-dev] Failed to parse SSE message:', error)
				}
			}

			eventSource.onerror = () => {
				connectionStateRef.current = 'error'
				eventSource.close()
				eventSourceRef.current = null

				if (reconnectAttempts.current < maxReconnectAttempts) {
					reconnectAttempts.current++
					const delay = reconnectDelay * 2 ** (reconnectAttempts.current - 1)

					reconnectTimeoutRef.current = setTimeout(() => {
						connect()
					}, delay)
				} else {
					connectionStateRef.current = 'disconnected'
				}
			}
		} catch (error) {
			console.error('[vestig-dev] Failed to create EventSource:', error)
			connectionStateRef.current = 'error'
		}
	}, [endpoint, enabled, reconnectDelay, maxReconnectAttempts])

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
			reconnectTimeoutRef.current = null
		}

		if (eventSourceRef.current) {
			eventSourceRef.current.close()
			eventSourceRef.current = null
		}

		connectionStateRef.current = 'disconnected'
		reconnectAttempts.current = 0
	}, [])

	useEffect(() => {
		if (enabled) {
			connect()
		} else {
			disconnect()
		}

		return () => {
			disconnect()
		}
	}, [enabled, connect, disconnect])

	return {
		connect,
		disconnect,
		isConnected: connectionStateRef.current === 'connected',
		connectionState: connectionStateRef.current,
	}
}

/**
 * Hook to capture client-side logs
 */
export function useClientLogCapture(options: { enabled?: boolean } = {}) {
	const { enabled = true } = options

	useEffect(() => {
		if (!enabled) return
		if (typeof window === 'undefined') return

		const handleClientLog = (event: CustomEvent<Omit<DevLogEntry, 'id' | 'source'>>) => {
			logStore.addLog({
				...event.detail,
				source: 'client',
			})
		}

		window.addEventListener('vestig:client-log', handleClientLog as EventListener)

		return () => {
			window.removeEventListener('vestig:client-log', handleClientLog as EventListener)
		}
	}, [enabled])
}

/**
 * Hook for keyboard shortcuts
 */
export function useDevOverlayShortcuts(options: { toggleKey?: string; enabled?: boolean } = {}) {
	const { toggleKey = 'l', enabled = true } = options

	useEffect(() => {
		if (!enabled) return
		if (typeof window === 'undefined') return

		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === toggleKey) {
				event.preventDefault()
				logStore.toggleOpen()
			}

			if (event.key === 'Escape' && logStore.getSnapshot().isOpen) {
				logStore.setOpen(false)
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [toggleKey, enabled])
}
