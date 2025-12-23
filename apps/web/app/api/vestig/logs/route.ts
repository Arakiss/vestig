import { createLogStreamHandler } from '@vestig/next/dev/api'

/**
 * SSE endpoint for streaming logs to the Dev Overlay
 */
export const GET = createLogStreamHandler()

// Disable body parsing and enable streaming
export const dynamic = 'force-dynamic'
