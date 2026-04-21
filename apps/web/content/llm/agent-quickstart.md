# Agent Quickstart

This page is written for coding agents that need to install, configure, or debug Vestig without reading the whole documentation site first.

## Canonical Packages

- Use `vestig` for the runtime-agnostic logger, transports, sanitization, tracing, sampling, and wide events.
- Use `@vestig/next` only for Next.js App Router integration, React provider/hooks, middleware helpers, route handlers, web vitals, and Next-specific server helpers.
- Use Bun for repository commands. Do not introduce Vitest; this repository uses `bun test`.

## Canonical Imports

```ts
import {
	BatchTransportError,
	ConsoleTransport,
	HTTPTransport,
	createLogger,
} from 'vestig'

import { configureServerLogger } from '@vestig/next'
import { VestigProvider } from '@vestig/next/client'
```

## Minimal Logger Setup

```ts
import { ConsoleTransport, createLogger } from 'vestig'

export const logger = createLogger({
	namespace: 'app',
	level: 'info',
	transports: [new ConsoleTransport({ structured: true })],
	sanitize: 'gdpr',
})
```

## Runtime Constraints

- Node.js packages are ESM. Relative imports in published `dist` files must include explicit `.js` or `/index.js` specifiers.
- Edge and Worker runtimes should call `logger.flush()` before a request, cron, or background task finishes.
- Cloudflare Workers should attach flush work to `ctx.waitUntil(logger.flush())` and handle rejection.
- Browser code should use `@vestig/next/client` and should not import server-only helpers.

## Failure Behavior

`BatchTransport.flush()` rejects with `BatchTransportError` when delivery retries are exhausted. The failed batch is retained for a later flush.

```ts
try {
	await logger.flush()
} catch (error) {
	if (error instanceof BatchTransportError) {
		console.error('Vestig delivery failed', {
			transport: error.transport,
			entries: error.batchSize,
			cause: error.cause,
		})
	}
}
```

Use `throwOnError: false` only when legacy non-throwing flush behavior is intentional, and pair it with `onError` so failures remain observable.

```ts
new HTTPTransport({
	url: 'https://logs.example.com/internal/logs',
	maxBufferSize: 1000,
	throwOnError: false,
	onRetry(event) {
		console.warn('log delivery retrying', {
			transport: event.transport,
			attempt: event.attempt,
			maxAttempts: event.maxAttempts,
			nextRetryDelay: event.nextRetryDelay,
		})
	},
	onError(error, entries) {
		console.error('log delivery failed', { error, entries: entries.length })
	},
})
```

`maxBufferSize` controls how many entries may queue in memory while a flush is slow or in flight. The default is `batchSize * 2`; use a larger value for bursty cron, Worker, or serverless workloads, and monitor `transport.getStats().dropped`.

## Service Binding or Custom Fetch

`HTTPTransport` accepts a custom `fetch` implementation. This is the preferred pattern for Cloudflare service bindings or runtimes that wrap `fetch`.

```ts
new HTTPTransport({
	url: 'https://internal/logs',
	fetch: (input, init) => env.API_SERVICE.fetch(input, init),
	timeout: 5000,
})
```

## Sanitization

Use `sanitize: 'gdpr'` or `VESTIG_SANITIZE=gdpr` when the GDPR preset is intended. Use `VESTIG_SANITIZE_PRESET=gdpr` when environment configuration should be explicit.

Plain string `metadata.error` values stay in metadata. Real `Error` objects are serialized to top-level `entry.error`.

## Next.js Client Provider

Use `endpoint={false}` when an app wants React context and hooks without sending browser logs to an HTTP endpoint.

```tsx
<VestigProvider initialContext={context} endpoint={false}>
	{children}
</VestigProvider>
```

Default behavior remains `endpoint="/api/vestig"`.

## Next.js Server Logger

```ts
import { configureServerLogger } from '@vestig/next'
import type { LogLevel } from 'vestig'

configureServerLogger({
	namespace: 'web',
	level: (process.env.LOG_LEVEL ?? 'info') as LogLevel,
	structured: process.env.NODE_ENV === 'production',
})
```

## Release Checks

Before claiming a Vestig change is ready, run the relevant Bun checks:

```sh
bun run test
bun run typecheck
bun run build
bun run validate:docs
bun run validate:llms
```

For release work, also run:

```sh
bun run validate:release-notes
bun run validate:security
```
