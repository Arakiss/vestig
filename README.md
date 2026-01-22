<div align="center">

<img src="assets/banner.svg" alt="Vestig - Leave a trace" width="100%" />

A modern, runtime-agnostic structured logging library with automatic PII sanitization and context propagation.

[![CI](https://github.com/Arakiss/vestig/actions/workflows/ci.yml/badge.svg)](https://github.com/Arakiss/vestig/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/vestig.svg)](https://www.npmjs.com/package/vestig)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/tests-1273%20passing-brightgreen.svg)](https://github.com/Arakiss/vestig)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**v0.22.0** · Beta · Active Development

</div>

---

## Project Status

Vestig is in **active beta** with continuous development. The API is stable and production-ready for most use cases.

| Metric | Status |
|--------|--------|
| **Version** | v0.22.0 |
| **Stage** | Beta - API stable |
| **Tests** | 1273 passing |
| **Core Coverage** | 81%+ |
| **Releases** | 34 versions published |
| **Packages** | 2 (`vestig`, `@vestig/next`) |

### Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`vestig`](https://www.npmjs.com/package/vestig) | [![npm](https://img.shields.io/npm/v/vestig.svg)](https://www.npmjs.com/package/vestig) | Core logging library |
| [`@vestig/next`](https://www.npmjs.com/package/@vestig/next) | [![npm](https://img.shields.io/npm/v/@vestig/next.svg)](https://www.npmjs.com/package/@vestig/next) | Next.js 15+ integration (App Router, RSC, middleware) |

---

## Why Vestig?

*Vestig* — from Latin *vestigium* (trace, footprint). Leave a trace of what happened.

| Feature | Vestig | Pino | Winston | Bunyan |
|---------|:-----:|:----:|:-------:|:------:|
| Runtime Agnostic | ✅ | ❌ | ❌ | ❌ |
| Auto PII Sanitization | ✅ | ❌ | ❌ | ❌ |
| GDPR/HIPAA/PCI-DSS Presets | ✅ | ❌ | ❌ | ❌ |
| Wide Events / Tail Sampling | ✅ | ❌ | ❌ | ❌ |
| OTLP Export (Jaeger, Honeycomb) | ✅ | ❌ | ❌ | ❌ |
| Auto Fetch Instrumentation | ✅ | ❌ | ❌ | ❌ |
| Auto Database Instrumentation | ✅ | ❌ | ❌ | ❌ |
| Zero Config | ✅ | ✅ | ❌ | ❌ |
| TypeScript First | ✅ | ✅ | ⚠️ | ❌ |
| Edge Runtime Support | ✅ | ❌ | ❌ | ❌ |
| Browser Support | ✅ | ❌ | ⚠️ | ❌ |
| Context Propagation | ✅ | ❌ | ❌ | ❌ |
| Multiple Transports | ✅ | ✅ | ✅ | ✅ |
| Zero Dependencies | ✅ | ❌ | ❌ | ❌ |

**Vestig is the only logging library that:**
- Works everywhere (Node.js, Bun, Deno, Edge, Browser)
- Automatically sanitizes PII with compliance presets
- Propagates context through async operations
- Exports spans to OTLP backends (Jaeger, Honeycomb, Vercel, Grafana)
- Auto-instruments fetch() and database queries with zero code changes
- Has zero runtime dependencies

## Installation

```bash
# bun
bun add vestig

# npm
npm install vestig

# pnpm
pnpm add vestig
```

### Framework Integrations

```bash
# Next.js 15+ (App Router, Server Components, Middleware)
bun add @vestig/next
```

## Quick Start

```typescript
import { log } from 'vestig'

// Simple logging
log.info('Hello world')
log.error('Something failed', { userId: 123 })

// Sensitive data is automatically redacted
log.info('User login', {
  email: 'user@example.com',     // → us***@example.com
  password: 'secret123',          // → [REDACTED]
  creditCard: '4111111111111111', // → ****1111
})
```

### Next.js Integration

```typescript
// app/page.tsx
import { getLogger } from '@vestig/next'

export default async function Page() {
  const log = await getLogger('home')

  log.info('Rendering home page')

  return <h1>Welcome</h1>
}
```

### Database Instrumentation

Automatic OTLP span creation for PostgreSQL queries with precise timing:

```typescript
// lib/db.ts
import postgres from 'postgres'
import { instrumentPostgres } from '@vestig/next/db'
import { drizzle } from 'drizzle-orm/postgres-js'

// Wrap postgres-js client for automatic instrumentation
const client = instrumentPostgres(postgres(process.env.DATABASE_URL!), {
  slowQueryThreshold: 100,  // Flag queries over 100ms
  onQuery: (entry) => {
    // Custom metrics callback (e.g., for noisy neighbor detection)
    if (entry.isSlow) {
      metrics.record('slow_query', { table: entry.table, duration: entry.duration })
    }
  }
})

export const db = drizzle(client)
```

## Features

### Multi-Transport Support

Send logs to multiple destinations simultaneously:

```typescript
import { createLogger, HTTPTransport, DatadogTransport, SentryTransport } from 'vestig'

const log = createLogger()

// Add HTTP transport for centralized logging
log.addTransport(new HTTPTransport({
  name: 'api-logs',
  url: 'https://logs.example.com/ingest',
  headers: { 'Authorization': 'Bearer token' },
}))

// Add Datadog for observability
log.addTransport(new DatadogTransport({
  name: 'datadog',
  apiKey: process.env.DD_API_KEY,
  service: 'my-app',
  tags: ['env:production'],
}))

// Add Sentry for error tracking
log.addTransport(new SentryTransport({
  name: 'sentry',
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  minLevel: 'warn', // Only send warn/error to Sentry
}))

// Initialize transports (starts flush timers)
await log.init()

// All logs go to console, HTTP endpoint, Datadog, and Sentry
log.info('Server started', { port: 3000 })
```

### Available Transports

| Transport | Description | Use Case |
|-----------|-------------|----------|
| `ConsoleTransport` | Console output with colors | Development, debugging |
| `HTTPTransport` | Send to any HTTP endpoint | Custom log aggregation |
| `FileTransport` | Write to files with rotation | Server-side logging |
| `DatadogTransport` | Datadog Log Management | Production observability |
| `SentryTransport` | Sentry error tracking | Error monitoring, alerting |

### PII Sanitization with Presets

Choose from compliance-focused presets:

```typescript
import { Sanitizer } from 'vestig'

// GDPR compliance (EU data protection)
const gdprSanitizer = Sanitizer.fromPreset('gdpr')

// HIPAA compliance (healthcare)
const hipaaSanitizer = Sanitizer.fromPreset('hipaa')

// PCI-DSS compliance (payment cards)
const pciSanitizer = Sanitizer.fromPreset('pci-dss')

// Apply to logger
const log = createLogger({
  sanitize: 'gdpr', // Use preset name directly
})
```

| Preset | Fields Protected | Patterns Applied |
|--------|-----------------|------------------|
| `none` | None | None |
| `minimal` | password, secret, token, key | None |
| `default` | 26 common fields | Email, Credit Card, JWT |
| `gdpr` | + name, address, phone, IP | + IP addresses, phone |
| `hipaa` | + patient, medical, SSN | + SSN pattern |
| `pci-dss` | + card, CVV, PIN | Full card detection |

### Native Tracing with Spans

```typescript
import { span } from 'vestig'

// Trace async operations
await span('api:request', async (s) => {
  s.setAttribute('method', 'GET')
  s.setAttribute('path', '/users')

  await span('db:query', async () => {
    return await db.query('SELECT * FROM users')
  })

  s.setStatus('ok')
})
```

### Auto-Instrumentation (New in v0.18)

Automatically trace all `fetch()` calls with zero code changes:

```typescript
import { instrumentFetch } from 'vestig'

// One line - all fetch() calls now create spans
instrumentFetch({
  ignoreUrls: ['/health', /^\/_next/],
  captureHeaders: ['content-type', 'x-request-id'],
})

// Now every fetch is traced automatically
await fetch('https://api.example.com/users')
// → Span: "http.client GET api.example.com/users"
```

### OTLP Export (New in v0.16)

Export spans to any OpenTelemetry-compatible backend:

```typescript
import { registerSpanProcessor, span } from 'vestig'
import { OTLPExporter } from 'vestig/otlp'

// Connect to Jaeger, Honeycomb, Vercel, Grafana, etc.
const exporter = new OTLPExporter({
  endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  serviceName: 'my-app',
  headers: { 'Authorization': `Bearer ${process.env.OTEL_TOKEN}` },
})

registerSpanProcessor(exporter)

// All spans automatically exported
await span('checkout', async (s) => {
  s.setAttribute('orderId', order.id)
  await processPayment()
})
```

### Next.js Unified Setup (New in v0.18)

One-liner setup for Next.js with OTLP and fetch instrumentation:

```typescript
// instrumentation.ts
import { registerVestig } from '@vestig/next/instrumentation'

export function register() {
  registerVestig({
    serviceName: 'my-nextjs-app',
    otlp: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    autoInstrument: {
      fetch: true,  // Auto-trace all fetch() calls
    },
  })
}
```

### Sampling

Control log volume in high-throughput applications:

```typescript
import { createLogger, createProbabilitySampler, createRateLimitSampler } from 'vestig'

// Probability sampling - keep 10% of logs
const logger = createLogger({
  sampling: {
    sampler: createProbabilitySampler({ rate: 0.1 }),
    alwaysSample: ['error', 'warn']  // Always keep errors and warnings
  }
})

// Rate limit sampling - max 100 logs per second
const rateLimitedLogger = createLogger({
  sampling: {
    sampler: createRateLimitSampler({ maxPerSecond: 100 })
  }
})
```

**Available Samplers:**

| Sampler | Description | Use Case |
|---------|-------------|----------|
| `createProbabilitySampler` | Random sampling by percentage | General log reduction |
| `createRateLimitSampler` | Max logs per time window | Protect against log storms |
| `createNamespaceSampler` | Different rates per namespace | Fine-grained control |
| `createCompositeSampler` | Combine multiple samplers | Complex sampling logic |

For more details, see the [Sampling documentation](https://vestig.dev/docs/sampling).

### Wide Events (Canonical Log Lines)

Wide Events capture **all context about a complete operation in ONE structured event**. Instead of scattered logs, you get a single comprehensive record per request.

```typescript
import { createLogger, createWideEvent } from 'vestig'

const log = createLogger({
  tailSampling: {
    enabled: true,
    alwaysKeepStatuses: ['error'],  // 100% of errors
    slowThresholdMs: 2000,          // 100% of slow requests
    successSampleRate: 0.1,         // 10% of successful requests
  }
})

// Create and enrich the wide event throughout the request
const event = createWideEvent({ type: 'http.request' })

// Add context as you go
event.merge('http', { method: 'POST', path: '/api/checkout', status_code: 200 })
event.merge('user', { id: 'user-456', subscription: 'premium' })
event.merge('performance', { db_query_ms: 45, external_api_ms: 230 })

// End and emit the event
const completedEvent = event.end({ status: 'success' })
log.emitWideEvent(completedEvent)

// Output: ONE event with 50+ fields, easily queryable
```

**Why Wide Events?**
- **Debug faster**: All context in one place, no log correlation needed
- **Reduce costs**: Tail sampling keeps 100% of errors, samples success
- **Better queries**: "Show me slow requests from premium users with payment errors"

For more details, see the [Wide Events documentation](https://vestig.dev/docs/wide-events).

### Custom Sanitization

```typescript
import { Sanitizer } from 'vestig'

const sanitizer = new Sanitizer({
  fields: [
    'customSecret',
    { type: 'prefix', value: 'private_' },
    { type: 'contains', value: 'token' },
  ],
  patterns: [{
    name: 'internal-id',
    pattern: /ID-[A-Z0-9]+/g,
    replacement: '[ID_REDACTED]',
  }],
})

const safe = sanitizer.sanitize({
  private_key: 'abc123',     // → [REDACTED]
  auth_token: 'xyz789',      // → [REDACTED]
  internalId: 'ID-ABC123',   // → [ID_REDACTED]
})
```

### Child Loggers

```typescript
const log = createLogger({ namespace: 'app' })
const dbLog = log.child('database')
const cacheLog = log.child('cache')

dbLog.info('Query executed')  // [app:database] Query executed
cacheLog.info('Cache hit')    // [app:cache] Cache hit
```

### Context & Correlation IDs

```typescript
import { withContext, createCorrelationContext } from 'vestig'

// Next.js API Route
export async function GET(req: Request) {
  const context = createCorrelationContext({
    requestId: req.headers.get('x-request-id') ?? undefined
  })

  return withContext(context, async () => {
    log.info('Request started')
    // All logs include: requestId, traceId, spanId

    const result = await fetchData()
    log.info('Request completed')

    return Response.json(result)
  })
}
```

## Configuration

### Environment Variables

```bash
VESTIG_LEVEL=debug        # trace | debug | info | warn | error
VESTIG_ENABLED=true       # Enable/disable logging
VESTIG_STRUCTURED=true    # JSON output (auto-enabled in production)
VESTIG_SANITIZE=true      # PII sanitization (default: true)

# Add to context
VESTIG_CONTEXT_SERVICE=api
VESTIG_CONTEXT_VERSION=1.0.0
```

### Programmatic

```typescript
const log = createLogger({
  level: 'debug',
  enabled: true,
  structured: false,
  sanitize: 'gdpr',  // or true, false, or SanitizeConfig
  context: { environment: 'development' }
})
```

## Log Levels

| Level | Description |
|-------|-------------|
| `trace` | Very detailed debugging information |
| `debug` | Development debugging |
| `info` | General information |
| `warn` | Warning messages |
| `error` | Error messages (includes stack traces) |

## Runtime Detection

Vestig automatically detects and adapts to:

- **Node.js** - Full features with AsyncLocalStorage
- **Bun** - Full features with AsyncLocalStorage
- **Deno** - Full features with AsyncLocalStorage (via `node:async_hooks`)
- **Edge Runtime** - Vercel Edge, Cloudflare Workers
- **Browser** - Client-side logging (use with `@vestig/next` or custom HTTPTransport)

```typescript
import { RUNTIME, IS_SERVER, IS_DENO } from 'vestig'

console.log(RUNTIME) // 'node' | 'bun' | 'deno' | 'edge' | 'browser' | 'worker' | 'unknown'
```

> **Browser Usage:** For client-side logging, we recommend using `@vestig/next` which provides `VestigProvider` and `useLogger()` hook with automatic server sync. For other frameworks, configure `HTTPTransport` to send logs to your backend.

## Auto-Production Mode

In production (`NODE_ENV=production`), Vestig automatically:

- Sets log level to `warn`
- Enables structured (JSON) output
- Keeps sanitization enabled

## Transports in Detail

### HTTPTransport

```typescript
import { HTTPTransport } from 'vestig'

const transport = new HTTPTransport({
  name: 'my-http',
  url: 'https://logs.example.com/ingest',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer my-token',
    'X-Custom-Header': 'value',
  },
  batchSize: 100,        // Send when 100 logs accumulated
  flushInterval: 5000,   // Or every 5 seconds
  maxRetries: 3,         // Retry failed requests
  timeout: 30000,        // Request timeout
  transform: (entries) => ({
    logs: entries,
    timestamp: Date.now(),
  }),
})
```

### FileTransport

```typescript
import { FileTransport } from 'vestig'

const transport = new FileTransport({
  name: 'file',
  path: '/var/log/app/app.log',
  maxSize: 10 * 1024 * 1024,  // 10MB before rotation
  maxFiles: 5,                 // Keep 5 rotated files
  compress: true,              // Gzip rotated files
})
```

### DatadogTransport

```typescript
import { DatadogTransport } from 'vestig'

const transport = new DatadogTransport({
  name: 'datadog',
  apiKey: process.env.DD_API_KEY!,
  site: 'datadoghq.com',  // or datadoghq.eu, us3, us5
  service: 'my-service',
  source: 'vestig',
  tags: ['env:production', 'team:backend'],
})
```

## API Reference

### `createLogger(config?)`

Create a new logger instance.

### `log.trace/debug/info/warn/error(message, metadata?)`

Log at the specified level.

### `log.child(namespace, config?)`

Create a namespaced child logger.

### `log.addTransport(transport)`

Add a transport to the logger.

### `log.removeTransport(name)`

Remove a transport by name.

### `log.flush()`

Flush all buffered logs.

### `log.destroy()`

Cleanup all transports (call on shutdown).

### `withContext(context, fn)`

Run a function with the given context.

### `createCorrelationContext(existing?)`

Generate correlation IDs (requestId, traceId, spanId).

### `Sanitizer.fromPreset(preset)`

Create a sanitizer from a preset name.

## Migration from Other Loggers

### From Pino

```typescript
// Before (Pino)
import pino from 'pino'
const logger = pino({ level: 'info' })
logger.info({ userId: 123 }, 'User logged in')

// After (Vestig)
import { createLogger } from 'vestig'
const logger = createLogger({ level: 'info' })
logger.info('User logged in', { userId: 123 })
```

### From Winston

```typescript
// Before (Winston)
import winston from 'winston'
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
})
logger.info('Hello', { meta: 'data' })

// After (Vestig)
import { createLogger } from 'vestig'
const logger = createLogger({ level: 'info' })
logger.info('Hello', { meta: 'data' })
```

## Documentation

For comprehensive documentation, visit our [documentation site](https://vestig.dev/docs):

- [Getting Started](https://vestig.dev/docs/getting-started)
- [Core Concepts](https://vestig.dev/docs/core/logging)
- [PII Sanitization](https://vestig.dev/docs/security/sanitization)
- [Next.js Integration](https://vestig.dev/docs/nextjs)
- [API Reference](https://vestig.dev/docs/api)

## Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

- 🐛 [Report bugs](https://github.com/Arakiss/vestig/issues/new?template=bug_report.md)
- 💡 [Request features](https://github.com/Arakiss/vestig/issues/new?template=feature_request.md)
- 📖 [Improve documentation](https://github.com/Arakiss/vestig/pulls)

## License

MIT © [Arakiss](https://github.com/Arakiss)

See [LICENSE](LICENSE) for more details.
