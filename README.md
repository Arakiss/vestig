# Sigil

*Leave your mark.*

A modern, runtime-agnostic structured logging library with automatic PII sanitization and context propagation.

[![npm version](https://img.shields.io/npm/v/sigil.svg)](https://www.npmjs.com/package/sigil)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Zero Config** - Works out of the box with sensible defaults
- **Runtime Agnostic** - Node.js, Bun, Deno, Edge Runtime, Browser
- **TypeScript First** - Full type safety and IntelliSense
- **Auto Sanitization** - PII protection enabled by default
- **Context Propagation** - AsyncLocalStorage support for request tracing
- **W3C Trace Context** - Standard correlation IDs for distributed tracing

## Installation

```bash
# bun
bun add sigil

# npm
npm install sigil

# pnpm
pnpm add sigil
```

## Quick Start

```typescript
import { log } from 'sigil'

// Simple logging
log.info('Hello world')
log.error('Something failed', { userId: 123 })

// With metadata
log.info('User action', {
  action: 'login',
  userId: 123,
  // Sensitive data is automatically redacted
  password: 'secret123' // → [REDACTED]
})
```

## Custom Logger

```typescript
import { createLogger } from 'sigil'

const log = createLogger({
  level: 'debug',
  structured: true, // JSON output
  context: { service: 'api', version: '1.0.0' }
})

log.info('Server started')
// {"timestamp":"...","level":"info","message":"Server started","context":{"service":"api","version":"1.0.0"}}
```

## Child Loggers

```typescript
const log = createLogger({ namespace: 'app' })
const dbLog = log.child('database')
const cacheLog = log.child('cache')

dbLog.info('Query executed')  // [app:database] Query executed
cacheLog.info('Cache hit')    // [app:cache] Cache hit
```

## Context & Correlation IDs

```typescript
import { withContext, createCorrelationContext } from 'sigil'

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
SIGIL_LEVEL=debug        # trace | debug | info | warn | error
SIGIL_ENABLED=true       # Enable/disable logging
SIGIL_STRUCTURED=true    # JSON output (auto-enabled in production)
SIGIL_SANITIZE=true      # PII sanitization (default: true)

# Add to context
SIGIL_CONTEXT_SERVICE=api
SIGIL_CONTEXT_VERSION=1.0.0
```

### Programmatic

```typescript
const log = createLogger({
  level: 'debug',
  enabled: true,
  structured: false,
  sanitize: true,
  sanitizeFields: ['customSecret'],
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

Sigil automatically detects and adapts to:

- **Node.js** - Full features with AsyncLocalStorage
- **Bun** - Full features with AsyncLocalStorage
- **Deno** - Full features with AsyncLocalStorage
- **Edge Runtime** - Vercel Edge, Cloudflare Workers
- **Browser** - Client-side logging with sanitization

```typescript
import { RUNTIME, IS_SERVER, IS_EDGE } from 'sigil'

console.log(RUNTIME) // 'node' | 'bun' | 'deno' | 'edge' | 'browser'
```

## Auto-Production Mode

In production (`NODE_ENV=production`), Sigil automatically:

- Sets log level to `warn`
- Enables structured (JSON) output
- Keeps sanitization enabled

## API Reference

### `createLogger(config?)`

Create a new logger instance.

### `log.trace/debug/info/warn/error(message, metadata?)`

Log at the specified level.

### `log.child(namespace, config?)`

Create a namespaced child logger.

### `withContext(context, fn)`

Run a function with the given context.

### `createCorrelationContext(existing?)`

Generate correlation IDs (requestId, traceId, spanId).

## License

MIT
