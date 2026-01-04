'use client'

import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { type LogContext, type Logger, createLogger } from 'vestig'
import { ClientHTTPTransport } from './transport'

/**
 * Context value provided by VestigProvider
 */
interface VestigContextValue {
	/** Logger instance */
	logger: Logger
	/** Correlation context */
	context: LogContext
	/** Whether client is connected to server */
	isConnected: boolean
	/** Error that occurred during transport initialization */
	initError: Error | null
}

const VestigContext = createContext<VestigContextValue | null>(null)

/**
 * Props for VestigProvider
 */
export interface VestigProviderProps {
	children: ReactNode
	/** Initial correlation context (e.g., from server) */
	initialContext?: LogContext
	/** Override endpoint URL (default: '/api/vestig') */
	endpoint?: string
	/** Logger namespace (default: 'client') */
	namespace?: string
	/** Additional static context */
	context?: Record<string, unknown>
}

/**
 * Generate a client-side request ID
 */
function generateClientRequestId(): string {
	return `client-${crypto.randomUUID()}`
}

/**
 * Provider component for client-side vestig logging
 *
 * Provides:
 * - Automatic log batching and sending to server
 * - Request correlation with server
 * - React context for accessing logger
 *
 * @example
 * ```typescript
 * // app/layout.tsx
 * import { VestigProvider } from '@vestig/next/client'
 * import { getRequestContext } from '@vestig/next'
 *
 * export default async function RootLayout({ children }) {
 *   // Get server context for correlation
 *   const ctx = await getRequestContext()
 *
 *   return (
 *     <html>
 *       <body>
 *         <VestigProvider initialContext={ctx}>
 *           {children}
 *         </VestigProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function VestigProvider({
	children,
	initialContext,
	endpoint = '/api/vestig',
	namespace = 'client',
	context: staticContext,
}: VestigProviderProps) {
	const [isConnected, setIsConnected] = useState(false)
	const [initError, setInitError] = useState<Error | null>(null)
	const transportRef = useRef<ClientHTTPTransport | null>(null)
	const loggerRef = useRef<Logger | null>(null)

	// Create transport once
	const transport = useMemo(() => {
		if (transportRef.current) return transportRef.current

		transportRef.current = new ClientHTTPTransport({
			name: 'vestig-client',
			url: endpoint,
			batchSize: 20,
			flushInterval: 3000,
			onFlushSuccess: () => setIsConnected(true),
			onFlushError: () => setIsConnected(false),
		})

		return transportRef.current
	}, [endpoint])

	// Create correlation context
	const context = useMemo<LogContext>(
		() => ({
			requestId: initialContext?.requestId ?? generateClientRequestId(),
			traceId: initialContext?.traceId,
			spanId: initialContext?.spanId,
			...initialContext,
		}),
		[initialContext],
	)

	// Create logger with transport
	const logger = useMemo(() => {
		if (loggerRef.current) return loggerRef.current

		const log = createLogger({
			level: 'trace', // Allow all levels, filtering happens server-side
			sanitize: 'default',
			structured: false, // Pretty console for browser devtools
			namespace,
			context: {
				...staticContext,
				...context,
			},
		})

		log.addTransport(transport)
		loggerRef.current = log

		return log
	}, [transport, namespace, staticContext, context])

	// Initialize transport on mount
	useEffect(() => {
		transport
			.init()
			.then(() => {
				setIsConnected(true)
				setInitError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setInitError(error)
				setIsConnected(false)
				// Log to console since transport failed
				console.error('[vestig] Transport initialization failed:', error)
			})

		// Flush on page unload
		const handleUnload = () => {
			transport.flush()
		}

		// Flush on visibility change (tab switch)
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				transport.flush()
			}
		}

		window.addEventListener('beforeunload', handleUnload)
		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			window.removeEventListener('beforeunload', handleUnload)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			transport.destroy()
		}
	}, [transport])

	const value = useMemo<VestigContextValue>(
		() => ({
			logger,
			context,
			isConnected,
			initError,
		}),
		[logger, context, isConnected, initError],
	)

	return <VestigContext.Provider value={value}>{children}</VestigContext.Provider>
}

/**
 * Get the full vestig context
 *
 * @throws Error if used outside VestigProvider
 */
export function useVestigContext(): VestigContextValue {
	const context = useContext(VestigContext)
	if (!context) {
		throw new Error('useVestigContext must be used within VestigProvider')
	}
	return context
}
