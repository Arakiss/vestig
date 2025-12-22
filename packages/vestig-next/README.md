# @vestig/next

First-class structured logging for Next.js 15+ applications. Built on top of [vestig](https://github.com/Arakiss/vestig), this package provides automatic request correlation, middleware integration, and seamless client/server logging.

## Features

- **Automatic Request Correlation** - requestId, traceId, and spanId propagated across all logs
- **Middleware Integration** - Automatic request/response logging with timing
- **Server Components** - `getLogger()` with React `cache()` for per-request loggers
- **Route Handlers** - `withVestig()` wrapper with full context
- **Server Actions** - `vestigAction()` for action logging
- **Client Components** - `useLogger()` hook with automatic server sync
- **PII Sanitization** - All vestig sanitization presets work seamlessly
- **Edge Runtime Compatible** - Works in Edge middleware and Vercel Edge Functions

## Installation

```bash
npm install @vestig/next vestig
# or
bun add @vestig/next vestig
```

## Quick Start

### 1. Add Middleware

```typescript
// middleware.ts
import { createVestigMiddleware } from '@vestig/next/middleware'

export const middleware = createVestigMiddleware({
  level: 'info',
  skipPaths: ['/_next', '/favicon.ico'],
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 2. Wrap Your Layout

```typescript
// app/layout.tsx
import { VestigProvider } from '@vestig/next/client'
import { getRequestContext } from '@vestig/next'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getRequestContext()

  return (
    <html>
      <body>
        <VestigProvider initialContext={ctx} endpoint="/api/vestig" namespace="client">
          {children}
        </VestigProvider>
      </body>
    </html>
  )
}
```

### 3. Add the Vestig API Route (Optional)

```typescript
// app/api/vestig/route.ts
import { createVestigHandler } from '@vestig/next/route'

export const { GET, POST, DELETE } = createVestigHandler({
  maxLogs: 500,
  enableSSE: true,
})
```

## Usage

### Server Components

```typescript
// app/users/page.tsx
import { getLogger, getRequestContext } from '@vestig/next'

export default async function UsersPage() {
  const log = await getLogger('users-page')
  const ctx = await getRequestContext()

  log.info('Rendering users page', { requestId: ctx.requestId })

  const users = await fetchUsers()
  log.debug('Users fetched', { count: users.length })

  return <UserList users={users} />
}
```

### Route Handlers

```typescript
// app/api/users/route.ts
import { withVestig } from '@vestig/next'

export const GET = withVestig(
  async (request, { log, ctx, timing }) => {
    log.debug('Fetching users from database')

    const users = await db.users.findMany()

    log.info('Users fetched', {
      count: users.length,
      duration: `${timing.elapsed().toFixed(2)}ms`,
    })

    return Response.json({
      users,
      meta: { requestId: ctx.requestId },
    })
  },
  { namespace: 'api:users', level: 'debug' }
)
```

### Client Components

```typescript
'use client'
import { useLogger, useCorrelationContext } from '@vestig/next/client'

export default function UserProfile() {
  const log = useLogger('user-profile')
  const ctx = useCorrelationContext()

  useEffect(() => {
    log.info('Profile loaded', { requestId: ctx.requestId })
  }, [log, ctx.requestId])

  const handleClick = () => {
    log.info('Button clicked', {
      email: 'user@example.com', // Auto-sanitized!
    })
  }

  return <button onClick={handleClick}>Click me</button>
}
```

### Server Actions

```typescript
// app/actions/user-actions.ts
'use server'
import { vestigAction } from '@vestig/next'

export const createUser = vestigAction(
  async (data: { name: string; email: string }, { log, ctx }) => {
    log.debug('Validating user data')

    const user = await db.users.create({ data })
    log.info('User created', { userId: user.id })

    return user
  },
  { namespace: 'actions:createUser' }
)
```

## API Reference

### Middleware

#### `createVestigMiddleware(options)`

Create a middleware with custom configuration.

```typescript
createVestigMiddleware({
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error',
  enabled?: boolean,
  sanitize?: 'none' | 'minimal' | 'default' | 'gdpr' | 'hipaa' | 'pci-dss',
  namespace?: string,
  skipPaths?: string[],
  timing?: boolean,
  requestLogLevel?: LogLevel,
  responseLogLevel?: LogLevel,
})
```

### Server Components

#### `getLogger(namespace?)`

Get a request-scoped logger in Server Components.

```typescript
const log = await getLogger('my-component')
log.info('Hello world')
```

#### `getRequestContext()`

Get the correlation context from the current request.

```typescript
const ctx = await getRequestContext()
// { requestId, traceId, spanId, ... }
```

### Route Handlers

#### `withVestig(handler, options)`

Wrap a route handler with automatic logging.

```typescript
export const GET = withVestig(
  async (request, { log, ctx, timing, params }) => {
    // Your handler logic
    return Response.json({ data })
  },
  {
    namespace?: string,
    level?: LogLevel,
    sanitize?: SanitizePreset,
    logRequest?: boolean,
    logResponse?: boolean,
  }
)
```

### Client Components

#### `useLogger(namespace?)`

Get a logger instance in Client Components. No `useMemo` needed - the hook returns a stable reference.

```typescript
const log = useLogger('my-component')
```

#### `useCorrelationContext()`

Get the correlation context passed from the server.

```typescript
const ctx = useCorrelationContext()
// { requestId, traceId, spanId }
```

### VestigProvider Props

```typescript
<VestigProvider
  initialContext={ctx}    // From getRequestContext()
  endpoint="/api/vestig"  // Where to send client logs
  namespace="client"      // Base namespace for client logs
  level="info"            // Minimum log level
  sanitize="default"      // PII sanitization preset
  batchSize={10}          // Batch size for HTTP transport
  flushInterval={2000}    // Flush interval in ms
>
```

## Log Levels

All vestig log levels are supported:

- `trace` - Most verbose, for detailed debugging
- `debug` - Debug information
- `info` - General information
- `warn` - Warning messages
- `error` - Error messages

## PII Sanitization

All vestig sanitization presets work automatically:

- `none` - No sanitization
- `minimal` - Passwords only
- `default` - Passwords, credit cards, SSNs
- `gdpr` - EU GDPR compliance
- `hipaa` - Healthcare compliance
- `pci-dss` - Payment card compliance

## License

MIT
