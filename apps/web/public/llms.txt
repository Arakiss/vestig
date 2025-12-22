# Vestig

> Zero-dependency TypeScript logging with auto PII sanitization, native tracing, and multi-runtime support.

Vestig is a lightweight structured logging library designed for modern TypeScript applications. It works seamlessly across Bun, Node.js, Deno, Edge runtimes (Vercel, Cloudflare Workers), and browsers.

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
- **Multi-Runtime**: Works in Bun, Node, Deno, Edge, and browsers
- **Auto PII Sanitization**: Redacts passwords, emails, credit cards automatically
- **Native Tracing**: Built-in distributed tracing with span()
- **Context Propagation**: AsyncLocalStorage-based request correlation
- **Smart Sampling**: Probability, rate-limit, and namespace-based sampling

## Documentation

- [Getting Started](/docs/getting-started) - Installation and basic usage
- [Features Overview](/docs/features) - All features explained
- [API Reference](/docs/api) - Complete API documentation

### Feature Guides

- [PII Sanitization](/docs/features/sanitization) - Automatic data redaction
- [Native Tracing](/docs/features/tracing) - Distributed tracing with spans
- [Context Propagation](/docs/features/context) - Request correlation
- [Transports](/docs/features/transports) - Console, HTTP, File, Datadog
- [Sampling](/docs/features/sampling) - Control log volume

### Integration Guides

- [Next.js](/docs/integrations/nextjs) - Server components, route handlers, middleware
- [Express](/docs/integrations/express) - Middleware and request logging
- [Hono](/docs/integrations/hono) - Lightweight edge framework

## Optional Packages

- `@vestig/next` - Next.js integration with server/client components
- `@vestig/express` - Express.js middleware

## Links

- [GitHub Repository](https://github.com/Arakiss/vestig)
- [npm Package](https://www.npmjs.com/package/vestig)
- [Changelog](/changelog)
