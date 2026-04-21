# Vestig - Complete API Reference

> This document provides a comprehensive reference for AI assistants working with Vestig.

## Installation

```bash
bun add vestig
# Optional:
bun add @vestig/next    # Next.js integration
```

## Core API

### createLogger(config?)

Creates a new logger instance.

```typescript
import { createLogger } from 'vestig'

const log = createLogger({
  level: 'debug',           // 'trace' | 'debug' | 'info' | 'warn' | 'error'
  structured: true,         // JSON output (default: true in server, false in browser)
  sanitize: true,           // Enable PII sanitization (default: true)
  sanitizeFields: ['password', 'apiKey'], // Additional fields to sanitize
  namespace: 'app',         // Logger namespace
  context: {                // Static context added to all logs
    service: 'api',
    version: '1.0.0'
  },
  sampling: {               // Optional sampling configuration
    type: 'probability',
    rate: 0.1               // Log 10% of messages
  },
  dedupe: {                 // Optional deduplication
    enabled: true,
    window: 5000,           // 5 second window
    maxCount: 10
  },
  tailSampling: {           // For wide events
    enabled: true,
    sampleRate: 0.1,
    alwaysKeepErrors: true,
    slowThresholdMs: 1000
  }
})
```

### createLoggerAsync(config?)

Creates and initializes a logger asynchronously (for transports requiring async setup).

```typescript
const log = await createLoggerAsync({ level: 'info' })
```

### initLogger(logger)

Initialize an existing logger's transports.

```typescript
const log = createLogger()
log.addTransport(new FileTransport({ path: './app.log' }))
await initLogger(log)
```

### log.{level}(message, metadata?)

Log methods for each level:

```typescript
log.trace('Detailed trace info', { data: '...' })
log.debug('Debug information', { requestId: '123' })
log.info('Application event', { userId: 'user-123' })
log.warn('Warning condition', { threshold: 0.9 })
log.error('Error occurred', { error: new Error('Failed') })
```

### log.child(namespace, config?)

Create a namespaced child logger:

```typescript
const dbLog = log.child('database')
dbLog.info('Query executed')  // namespace: 'app:database'

const authLog = log.child('auth', { level: 'warn' })
```

### log.span(name, callback, options?) / log.spanSync(name, callback, options?)

Create traced operations with automatic namespace prefixing:

```typescript
const db = log.child('database')
const result = await db.span('query', async (span) => {
  span.setAttribute('table', 'users')
  return await executeQuery()
})
// Span name: 'database:query'
```

### log.emitWideEvent(event)

Emit a completed wide event through the logger's transports:

```typescript
log.emitWideEvent({
  event_type: 'http.request',
  status: 'success',
  started_at: '2024-01-01T00:00:00Z',
  ended_at: '2024-01-01T00:00:01Z',
  duration_ms: 1000,
  level: 'info',
  fields: { http: { method: 'GET', path: '/api' } }
})
```

### Logger Management

```typescript
log.setLevel('debug')       // Change log level
log.getLevel()              // Get current level
log.enable()                // Enable logging
log.disable()               // Disable logging
log.isEnabled()             // Check if enabled
await log.flush()           // Flush buffered logs
await log.destroy()         // Cleanup and destroy

log.addTransport(transport) // Add transport
log.removeTransport('name') // Remove by name
log.getTransports()         // Get all transports
```

## Runtime Detection

```typescript
import {
  RUNTIME,        // 'node' | 'bun' | 'deno' | 'edge' | 'browser' | 'worker' | 'unknown'
  CAPABILITIES,   // { hasAsyncLocalStorage, hasProcess, hasPerformance, hasConsole, hasCrypto }
  IS_NODE,        // boolean
  IS_BUN,         // boolean
  IS_DENO,        // boolean
  IS_EDGE,        // boolean - Cloudflare Workers, Vercel Edge, etc.
  IS_BROWSER,     // boolean
  IS_WORKER,      // boolean - Web Workers
  IS_SERVER,      // boolean - IS_NODE || IS_BUN || IS_DENO || IS_EDGE
} from 'vestig'
```

## Context API

### withContext(context, callback)

Execute code with request-scoped context:

```typescript
import { withContext, log } from 'vestig'

await withContext({ requestId: 'req-123', userId: 'user-456' }, async () => {
  log.info('Processing')  // Includes requestId and userId automatically
  await doWork()
})
```

### withContextAsync(context, callback)

Same as withContext but explicitly async.

### createCorrelationContext()

Generate correlation IDs for request tracing:

```typescript
import { createCorrelationContext } from 'vestig'

const ctx = createCorrelationContext()
// Returns: { requestId, traceId, spanId }
```

### ID Generation

```typescript
import { generateRequestId, generateTraceId, generateSpanId } from 'vestig'

const requestId = generateRequestId()  // 'req-xxxxxxxx'
const traceId = generateTraceId()      // 32-char hex
const spanId = generateSpanId()        // 16-char hex
```

### W3C Trace Context

```typescript
import {
  parseTraceparent,
  createTraceparent,
  parseTracestate,
  createTracestate,
  getTracestateValue,
  setTracestateValue,
  deleteTracestateKey,
} from 'vestig'

// traceparent header
const parsed = parseTraceparent('00-traceId-spanId-01')
const header = createTraceparent({ traceId, spanId, sampled: true })

// tracestate header
const state = parseTracestate('vendor1=value1,vendor2=value2')
const header = createTracestate([{ key: 'myvendor', value: 'myvalue' }])
const value = getTracestateValue(state, 'vendor1')
const newState = setTracestateValue(state, 'vendor1', 'newvalue')
const cleaned = deleteTracestateKey(state, 'vendor1')
```

### getContext()

Get current async context:

```typescript
import { getContext } from 'vestig'
const ctx = getContext()
```

## Tracing API

### span(name, callback, options?)

Create a traced async operation:

```typescript
import { span } from 'vestig'

const result = await span('fetch-user', async (s) => {
  s.setAttribute('userId', '123')
  s.addEvent('cache-miss')
  return await db.users.findById('123')
})
```

### spanSync(name, callback, options?)

Create a traced synchronous operation:

```typescript
import { spanSync } from 'vestig'

const parsed = spanSync('parse-json', (s) => {
  s.setAttribute('size', data.length)
  return JSON.parse(data)
})
```

### Manual Span Management

```typescript
import {
  startSpan,
  endSpan,
  getActiveSpan,
  withActiveSpan,
  clearActiveSpans,
  getActiveSpanStackDepth,
  withSpanContext,
  withSpanContextAsync,
} from 'vestig'

startSpan('operation')
try {
  const span = getActiveSpan()
  span?.setAttribute('key', 'value')
} finally {
  endSpan()
}

// Advanced: Run code with specific span as active
withActiveSpan(mySpan, () => {
  // mySpan is now the active span
})

// Get current stack depth
const depth = getActiveSpanStackDepth()

// Clear all active spans (cleanup)
clearActiveSpans()
```

### Span Interface

```typescript
interface Span {
  name: string
  traceId: string
  spanId: string
  parentSpanId?: string
  startTime: number
  endTime?: number
  status: 'unset' | 'ok' | 'error'
  attributes: Record<string, unknown>
  events: SpanEvent[]

  setAttribute(key: string, value: unknown): void
  setAttributes(attrs: Record<string, unknown>): void
  addEvent(name: string, attributes?: Record<string, unknown>): void
  setStatus(status: SpanStatus, message?: string): void
  end(): void
}
```

## Wide Events API

Wide events (canonical log lines) capture comprehensive context for entire operations.

### createWideEvent(eventType, config?)

```typescript
import { createWideEvent } from 'vestig'

const event = createWideEvent('http.request', {
  context: { requestId: 'req-123' }
})

event.setField('http', 'method', 'POST')
event.setField('http', 'path', '/api/users')
event.setField('user', 'id', 'user-456')
event.addError(new Error('Validation failed'))

const completed = event.end({ status: 'error' })
// completed is a WideEvent ready to emit
```

### Wide Event Context Management

```typescript
import {
  withWideEvent,
  withWideEventAsync,
  getActiveWideEvent,
} from 'vestig'

await withWideEventAsync('http.request', async (event) => {
  event.setField('http', 'method', 'GET')

  // Nested code can access the event
  const active = getActiveWideEvent()
  active?.setField('db', 'queries', 5)
})
```

### WideEventBuilder Interface

```typescript
interface WideEventBuilder {
  setField(category: string, key: string, value: unknown): void
  setFields(category: string, fields: Record<string, unknown>): void
  addError(error: Error): void
  setContext(context: LogContext): void
  mergeContext(context: LogContext): void
  end(options?: WideEventEndOptions): WideEvent
}
```

## Sampling API

### Built-in Samplers

```typescript
import { createLogger } from 'vestig'

// Probability sampling - log X% of messages
const log1 = createLogger({
  sampling: { type: 'probability', rate: 0.1 }  // 10%
})

// Rate limiting - max N logs per second
const log2 = createLogger({
  sampling: { type: 'rateLimit', maxPerSecond: 100 }
})

// Namespace-based - different rates per namespace
const log3 = createLogger({
  sampling: {
    type: 'namespace',
    rules: [
      { namespace: 'debug:*', rate: 0.01 },  // 1%
      { namespace: 'api:*', rate: 1.0 },     // 100%
      { namespace: '*', rate: 0.5 }          // default 50%
    ]
  }
})

// Composite - combine multiple strategies
const log4 = createLogger({
  sampling: {
    type: 'composite',
    operator: 'and',
    samplers: [
      { type: 'probability', rate: 0.5 },
      { type: 'rateLimit', maxPerSecond: 50 }
    ]
  }
})
```

### Sampler Factory Functions

```typescript
import {
  createSampler,
  createSamplerFromConfig,
  createProbabilitySampler,
  createRateLimitSampler,
  createNamespaceSampler,
  createCompositeSampler,
} from 'vestig'

const sampler = createProbabilitySampler(0.1)
const rateLimiter = createRateLimitSampler(100)
```

## Transport API

### Built-in Transports

```typescript
import {
  ConsoleTransport,
  HTTPTransport,
  FileTransport,
  DatadogTransport,
  SentryTransport,
  BatchTransport
} from 'vestig'

// Console (default)
new ConsoleTransport({
  structured: true,
  colors: true
})

// HTTP batch transport
new HTTPTransport({
  name: 'api',
  url: 'https://logs.example.com/ingest',
  batchSize: 100,
  maxBufferSize: 1000,
  flushInterval: 5000,
  headers: { 'Authorization': 'Bearer ...' },
  maxRetries: 3,
  onRetry(event) {
    console.warn('log delivery retrying', {
      attempt: event.attempt,
      nextRetryDelay: event.nextRetryDelay,
    })
  },
  onError(error, entries) {
    console.error('log delivery failed', { error, entries: entries.length })
  },
  onDrop(entries) {
    console.error('log buffer overflow', { entries: entries.length })
  }
})

// File transport (Node/Bun only)
new FileTransport({
  name: 'file',
  path: '/var/log/app.log',
  maxSize: 10 * 1024 * 1024,
  maxFiles: 5,
  compress: true
})

// Datadog transport
new DatadogTransport({
  name: 'datadog',
  apiKey: process.env.DD_API_KEY,
  service: 'my-app',
  env: 'production',
  source: 'nodejs'
})

// Sentry transport (error monitoring)
new SentryTransport({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  release: '1.0.0',
  minLevel: 'warn'
})

// Extend BatchTransport for custom batched delivery
class CustomTransport extends BatchTransport {
  readonly name = 'custom'

  constructor() {
    super({
      name: 'custom',
      batchSize: 50,
      maxBufferSize: 500,
      flushInterval: 3000
    })
  }

  protected async send(entries: LogEntry[]): Promise<void> {
    await fetch('https://logs.example.com/ingest', {
      method: 'POST',
      body: JSON.stringify(entries)
    })
  }
}
```

### BatchTransport Delivery Semantics

`flush()` rejects with `BatchTransportError` after exhausted attempts unless `throwOnError: false` is set. The failed batch is retained in memory for the next flush.

```typescript
const transport = new HTTPTransport({
  url: 'https://logs.example.com/ingest',
  batchSize: 100,
  maxBufferSize: 1000,
  maxRetries: 3,
  retryDelay: 1000,
  onRetry(event) {
    // Called before sleeping between retry attempts.
  },
  onError(error, entries) {
    // Called after all attempts fail.
  },
  onDrop(entries) {
    // Called when maxBufferSize is exceeded while entries queue in memory.
  }
})

const stats = transport.getStats()
// {
//   buffered: 0,
//   dropped: 0,
//   isFlushing: false,
//   pendingRetry: 0,
//   maxBufferSize: 1000,
//   utilization: 0
// }
```

### Adding/Removing Transports

```typescript
const log = createLogger()
log.addTransport(httpTransport)
log.removeTransport('console')  // Remove by name
```

## Sanitization API

### Built-in Patterns

Automatically detected and sanitized:
- Passwords (password, pwd, secret, etc.)
- API keys (apiKey, api_key, token, etc.)
- Emails (partially masked: j***@example.com)
- Credit cards (masked: 4532********0366)
- SSN/ID numbers
- JWTs
- Bearer tokens

### Custom Sanitization

```typescript
import { createLogger, createSanitizer, sanitize, PRESETS, COMMON_PATTERNS } from 'vestig'

const log = createLogger({
  sanitize: true,
  sanitizeFields: ['customSecret', 'internalId']
})

// Standalone sanitizer
const sanitizer = createSanitizer({
  fields: ['myField'],
  patterns: [/CUSTOM-\d+/g],
  replacement: '[HIDDEN]'
})

// Use presets
const gdprSanitizer = createSanitizer(PRESETS.gdpr)
const hipaaConfig = getPreset('hipaa')

// Direct sanitization
const clean = sanitize(data, ['password', 'ssn'])
```

## Deduplication API

```typescript
import { Deduplicator } from 'vestig'

const dedupe = new Deduplicator({
  enabled: true,
  window: 5000,       // 5 second dedup window
  maxCount: 10,       // After 10 duplicates, emit summary
  hashFields: true    // Include metadata in dedup hash
})

const result = dedupe.shouldSuppress(message, level, namespace)
// { suppressed: boolean, isFlush: boolean, suppressedCount?: number }

dedupe.destroy()  // Cleanup
```

## Metrics API

```typescript
import { MetricsCollector, globalMetrics, createMetricsCollector } from 'vestig'

// Use global metrics
globalMetrics.increment('logs_total', { level: 'info' })
globalMetrics.histogram('request_duration_ms', 150)
const snapshot = globalMetrics.getMetrics()
const prometheus = globalMetrics.toPrometheus()

// Or create isolated collector
const metrics = createMetricsCollector()
```

## Utilities

### Error Handling

```typescript
import { serializeError, isError, getErrorMessage } from 'vestig'

const serialized = serializeError(new Error('fail'))
// { name, message, stack, cause?, code?, ... }

if (isError(value)) { ... }
const msg = getErrorMessage(error)
```

### CircularBuffer

```typescript
import { CircularBuffer } from 'vestig'

const buffer = new CircularBuffer<LogEntry>({ maxSize: 1000 })
buffer.push(entry)
const items = buffer.toArray()
buffer.clear()
```

## @vestig/next Integration

### Server-side Logging

```typescript
// app/api/route.ts
import { withVestigRouteHandler } from '@vestig/next'

export const GET = withVestigRouteHandler(async (request, { log, context }) => {
  log.info('API called', { path: request.url })
  return Response.json({ ok: true })
})
```

### Server Actions

```typescript
// app/actions.ts
'use server'
import { withVestigServerAction } from '@vestig/next'

export const myAction = withVestigServerAction(async (data, { log }) => {
  log.info('Action executed', { data })
  return { success: true }
})
```

### Middleware

```typescript
// middleware.ts
import { createVestigMiddleware } from '@vestig/next'

export const middleware = createVestigMiddleware({
  enableWideEvents: true,
  tailSampling: { sampleRate: 0.1 }
})
```

### Client-side Logging

```typescript
// app/providers.tsx
'use client'
import { VestigProvider } from '@vestig/next/client'

export function Providers({ children }) {
  return (
    <VestigProvider endpoint="/api/vestig" namespace="client">
      {children}
    </VestigProvider>
  )
}

// In components
import { useLogger, useCorrelationContext } from '@vestig/next/client'

function MyComponent() {
  const log = useLogger()
  const ctx = useCorrelationContext()

  log.info('Component rendered', { ...ctx })
}
```

### Wide Events in Next.js

```typescript
import { withVestigWideEvent } from '@vestig/next'

export const GET = withVestigWideEvent(
  'api.users.list',
  async (request, { event, log }) => {
    event.setField('user', 'count', 100)
    return Response.json({ users: [] })
  }
)
```

## Environment Variables

```bash
VESTIG_LEVEL=debug          # Log level
VESTIG_STRUCTURED=true      # JSON output
VESTIG_SANITIZE=true        # PII sanitization
VESTIG_ENABLED=true         # Enable/disable logging
```

## TypeScript Types

```typescript
import type {
  // Core
  Logger,
  LoggerConfig,
  ResolvedLoggerConfig,
  LogLevel,
  LogEntry,
  LogMetadata,
  LogContext,
  Runtime,
  RuntimeCapabilities,

  // Transports
  Transport,
  TransportConfig,
  BatchTransportConfig,
  BatchTransportRetryEvent,
  BatchTransportStats,
  HTTPTransportConfig,
  FileTransportConfig,
  DatadogTransportConfig,
  SentryTransportConfig,
  ConsoleTransportConfig,
  RotationInterval,

  // Tracing
  Span,
  SpanOptions,
  SpanCallback,
  SpanSyncCallback,
  SpanEvent,
  SpanStatus,

  // Sampling
  Sampler,
  SamplerConfig,
  SamplingConfig,
  ProbabilitySamplerConfig,
  RateLimitSamplerConfig,
  NamespaceSamplerConfig,

  // Wide Events
  WideEvent,
  WideEventBuilder,
  WideEventConfig,
  WideEventContext,
  WideEventEndOptions,
  WideEventFields,
  WideEventStatus,
  TailSamplingConfig,

  // Sanitization
  FieldMatcher,
  SanitizePattern,
  SanitizeConfig,
  SanitizePreset,
  SerializedError,

  // Deduplication
  DedupeConfig,
  DedupeResult,

  // Metrics
  LoggerMetrics,

  // Misc
  CircularBufferConfig,
  TracestateEntry,
  // OTLP / SpanProcessor (from main export)
  SpanProcessor,
  registerSpanProcessor,
  unregisterSpanProcessor,
  getSpanProcessors,
  flushSpanProcessors,
  shutdownSpanProcessors,
} from 'vestig'
```

## OTLP Export API

Export spans to OpenTelemetry-compatible backends (Jaeger, Honeycomb, Grafana, Vercel, etc.).

### OTLPExporter

```typescript
import { registerSpanProcessor, span } from 'vestig'
import { OTLPExporter } from 'vestig/otlp'

const exporter = new OTLPExporter({
  endpoint: 'https://otel.example.com/v1/traces',
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
  environment: 'production',
  headers: {
    'Authorization': 'Bearer token'
  },
  resourceAttributes: {
    'host.name': 'server-1',
    'cloud.region': 'us-east-1'
  },
  batchSize: 100,        // Max spans per batch (default: 100)
  flushInterval: 5000,   // Auto-flush interval ms (default: 5000)
  timeout: 30000,        // Request timeout ms (default: 30000)
  maxRetries: 3,         // Retry attempts (default: 3)
  retryDelay: 1000,      // Initial retry delay ms (default: 1000)
})

// Register to automatically capture all spans
registerSpanProcessor(exporter)

// Spans are now exported automatically
await span('db:query', async (s) => {
  s.setAttribute('db.table', 'users')
  return await db.query()
})

// Graceful shutdown
await exporter.shutdown()
```

### SpanProcessor Interface

```typescript
import { registerSpanProcessor, unregisterSpanProcessor } from 'vestig'
import type { SpanProcessor } from 'vestig'

// Custom span processor
const processor: SpanProcessor = {
  onStart(span) {
    // Called when span starts
  },
  onEnd(span) {
    // Called when span ends (required)
    console.log('Span completed:', span.name, span.duration)
  },
  forceFlush() {
    // Force flush buffered data
    return Promise.resolve()
  },
  shutdown() {
    // Cleanup resources
    return Promise.resolve()
  }
}

registerSpanProcessor(processor)
unregisterSpanProcessor(processor)
```

### SpanProcessor Management

```typescript
import {
  registerSpanProcessor,
  unregisterSpanProcessor,
  getSpanProcessors,
  flushSpanProcessors,
  shutdownSpanProcessors,
} from 'vestig'

// Get all registered processors
const processors = getSpanProcessors()

// Flush all processors
await flushSpanProcessors()

// Shutdown all processors (call on app exit)
await shutdownSpanProcessors()
```

### OTLP Types (Advanced)

```typescript
import {
  OTLPExporter,
  OTLPExportError,
  // Conversion utilities
  toOTLPSpan,
  toOTLPAttributes,
  toOTLPStatusCode,
  msToNano,
  isoToNano,
  // Enums
  OTLPStatusCode,
  OTLPSpanKind,
  OTLPSeverityNumber,
} from 'vestig/otlp'

import type {
  OTLPExporterConfig,
  OTLPSpan,
  OTLPResource,
  OTLPKeyValue,
  OTLPExportTraceServiceRequest,
} from 'vestig/otlp'
```

## Auto-Instrumentation API

### instrumentFetch(options?)

Automatically create spans for all `fetch()` calls. Call once in your instrumentation file.

```typescript
import { instrumentFetch } from 'vestig'

// Basic usage
instrumentFetch()

// With options
instrumentFetch({
  spanNamePrefix: 'http.client',        // Span name prefix (default: 'http.client')
  captureHeaders: ['content-type', 'x-request-id'],  // Headers to capture
  ignoreUrls: ['/health', /^\/_next/],  // URLs to skip (strings or RegExp)
  propagateContext: true,               // Add traceparent header (default: true)
  captureRequestBody: false,            // Capture request body (default: false)
  captureResponseBody: false,           // Capture response body (default: false)
  maxRequestBodyLength: 1024,           // Max body length to capture
  maxResponseBodyLength: 1024,
  defaultAttributes: {                  // Attributes added to all spans
    'app.version': '1.0.0'
  },
  spanNameGenerator: (method, url) => `${method} ${url.pathname}`,  // Custom name
})

// All fetch calls now create spans automatically
await fetch('https://api.example.com/users')
// → Span: "http.client GET api.example.com/users"
```

### uninstrumentFetch()

Restore original fetch (for testing):

```typescript
import { instrumentFetch, uninstrumentFetch, isFetchInstrumented } from 'vestig'

instrumentFetch()
console.log(isFetchInstrumented())  // true

uninstrumentFetch()
console.log(isFetchInstrumented())  // false
```

## @vestig/next Instrumentation

### registerVestig(options)

Unified setup for Next.js instrumentation. Combines OTLP export, fetch instrumentation, and more.

```typescript
// instrumentation.ts
import { registerVestig } from '@vestig/next/instrumentation'

export function register() {
  registerVestig({
    serviceName: 'my-app',
  })
}
```

### Full Configuration

```typescript
// instrumentation.ts
import { registerVestig } from '@vestig/next/instrumentation'

export function register() {
  const result = registerVestig({
    serviceName: 'my-app',

    // OTLP configuration (optional)
    otlp: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,  // or auto-read from env
      headers: {
        'Authorization': `Bearer ${process.env.OTEL_AUTH_TOKEN}`,
      },
      serviceVersion: '1.0.0',
      environment: 'production',  // or auto-read from VERCEL_ENV/NODE_ENV
      resourceAttributes: {
        'cloud.region': 'us-east-1',
      },
      batchSize: 100,
      flushInterval: 5000,
    },

    // Auto-instrumentation (optional)
    autoInstrument: {
      fetch: true,  // or detailed options:
      // fetch: {
      //   captureHeaders: ['content-type'],
      //   ignoreUrls: ['/health'],
      // },
      console: true,  // Capture console.error as spans
    },

    // Debug logging (optional)
    debug: process.env.NODE_ENV === 'development',
  })

  // result contains:
  // - otlpEnabled: boolean
  // - fetchInstrumented: boolean
  // - consoleInstrumented: boolean
  // - shutdown: () => Promise<void>
}
```

### Environment Variables

```bash
# OTLP (auto-read if not specified in config)
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.vercel.com/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer token,x-custom=value

# Environment detection
VERCEL_ENV=production    # or NODE_ENV
```

### RegisterVestigOptions

```typescript
interface RegisterVestigOptions {
  serviceName: string              // Required: service name for traces
  otlp?: {
    endpoint?: string              // OTLP endpoint (or from env)
    headers?: Record<string, string>
    serviceVersion?: string
    environment?: string
    resourceAttributes?: Record<string, unknown>
    batchSize?: number             // Default: 100
    flushInterval?: number         // Default: 5000ms
  }
  autoInstrument?: {
    fetch?: boolean | InstrumentFetchOptions
    console?: boolean              // Capture console.error
  }
  debug?: boolean                  // Enable debug logging
}

interface RegisterVestigResult {
  otlpEnabled: boolean
  fetchInstrumented: boolean
  consoleInstrumented: boolean
  shutdown: () => Promise<void>
}
```

## Version

```typescript
import { VERSION } from 'vestig'
console.log(VERSION)  // e.g., '0.17.0'
```
