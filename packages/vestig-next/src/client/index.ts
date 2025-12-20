'use client'

// Client-side exports for @vestig/next/client

// Provider
export { VestigProvider, useVestigContext, type VestigProviderProps } from './provider'

// Hooks
export {
	useLogger,
	useCorrelationContext,
	useVestigConnection,
	useComponentLogger,
	useRenderLogger,
} from './hooks'

// Transport (for advanced use cases)
export {
	ClientHTTPTransport,
	createClientTransport,
	type ClientHTTPTransportConfig,
} from './transport'
