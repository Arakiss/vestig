# Vestig

> Zero-dependency TypeScript logging with auto PII sanitization, native tracing, and multi-runtime support.

Vestig is a lightweight structured logging library designed for modern TypeScript applications. It works seamlessly across Bun, Node.js, Deno, Edge runtimes (Vercel Edge, Cloudflare Workers), and browsers.

## Quick Start

```bash
bun add vestig
# or: npm install vestig
```

```typescript
import { log } from 'vestig'

log.info('Application started', { version: '1.0.0' })
log.error('Request failed', { error: new Error('Timeout') })
```

## Key Features

- **Zero Dependencies**: <5KB gzipped, no supply chain risks
- **Multi-Runtime**: Works in Bun, Node, Deno, Edge (Cloudflare Workers, Vercel Edge), and browsers
- **Auto PII Sanitization**: Redacts passwords, emails, credit cards, SSNs automatically
- **Native Tracing**: Built-in distributed tracing with span() and W3C Trace Context
- **Context Propagation**: AsyncLocalStorage-based request correlation
- **Smart Sampling**: Probability, rate-limit, namespace-based, and composite sampling
- **Wide Events**: Canonical log lines for comprehensive request context with tail sampling
- **Transports**: Console, HTTP, File, Datadog, Sentry - all with batching support
- **Metrics**: Built-in Prometheus-format metrics export

## Documentation

- [Getting Started](/docs/getting-started) - Installation and basic usage
- [Features Overview](/docs/features) - All features explained
- [API Reference](/docs/api) - Complete API documentation

### Core Concepts

- [Logging Basics](/docs/core/logging) - Log levels, structured output
- [Child Loggers](/docs/core/child-loggers) - Namespaced loggers
- [Runtime Detection](/docs/runtime) - Multi-runtime support

### Feature Guides

- [PII Sanitization](/docs/security/sanitization) - Automatic data redaction (GDPR, HIPAA, PCI-DSS)
- [Native Tracing](/docs/tracing) - Distributed tracing with spans
- [Context Propagation](/docs/tracing/context) - Request correlation
- [W3C Trace Context](/docs/tracing/w3c) - traceparent and tracestate support
- [Transports](/docs/transports) - Console, HTTP, File, Datadog, Sentry
- [Sampling](/docs/sampling) - Control log volume

### Wide Events

- [Wide Events Overview](/docs/wide-events) - Canonical log lines
- [Tail Sampling](/docs/wide-events/tail-sampling) - Outcome-based sampling

### Integration Guides

- [Next.js](/docs/nextjs) - Server components, route handlers, middleware, wide events
- [Client Components](/docs/nextjs/client) - Browser-side logging with VestigProvider

## Packages

- `vestig` - Core logging library
- `@vestig/next` - Next.js integration (server/client components, middleware, wide events)

## Links

- [GitHub Repository](https://github.com/Arakiss/vestig)
- [npm Package](https://www.npmjs.com/package/vestig)
- [Changelog](/changelog)
