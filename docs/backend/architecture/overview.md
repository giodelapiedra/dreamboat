# Architecture Overview

## System Design

```
┌─────────────────────┐         ┌─────────────────────┐
│   FRONTEND (SPA)    │  HTTP   │    BACKEND (API)     │
│   React + Vite      │ ◄─────► │    Express + Node    │
│   TypeScript         │  JSON   │    TypeScript        │
│   Port 5173         │         │    Port 3000         │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │   PostgreSQL (DB)    │
                                │   Supabase hosted    │
                                └─────────────────────┘
```

## Middleware Stack (Order Matters)

Middleware is applied in `app.ts` in this exact order:

```
1. CORS            → Restrict origins to CLIENT_URL, allow credentials
2. Helmet          → Set security headers (CSP, HSTS, X-Frame, etc.)
3. Pino HTTP       → Log every request/response with timing
4. express.json()  → Parse JSON request bodies
5. urlencoded      → Parse form-encoded bodies
6. cookie-parser   → Parse cookies (needed for refresh token)
7. globalLimiter   → Rate limit: 100 requests / 15 min per IP
8. /api routes     → All API route handlers
9. notFoundHandler → Catch unmatched routes → 404
10. errorHandler   → Catch all thrown errors → proper JSON response
```

## Error Handling Strategy

All errors flow through a centralized `errorHandler` middleware:

| Error Type | HTTP Status | When |
|---|---|---|
| `HttpError` | Custom (400-500) | Explicitly thrown in services |
| `ZodError` | 400 | Validation middleware or manual parse |
| `PrismaClientKnownRequestError` | 400 | DB constraint violations |
| Unhandled | 500 | Unexpected errors (logged to Pino) |

**Error response shape:**

```json
{
  "error": "Request failed",
  "message": "Human-readable description",
  "issues": {}
}
```

## Async Error Handling

Every route handler is wrapped with `asyncHandler()`:

```typescript
// Without wrapper — unhandled rejection crashes the server
router.get("/", async (req, res) => { ... });

// With wrapper — errors forwarded to errorHandler middleware
router.get("/", asyncHandler(async (req, res) => { ... }));
```

This eliminates the need for try/catch blocks in every controller function.

## Validation Flow

Zod schemas validate `body`, `params`, and `query` at the route level:

```typescript
// Schema defines what each part of the request should look like
const createBookingSchema = z.object({
  body: z.object({
    listingId: z.string().cuid(),
    checkIn: z.iso.datetime(),
    checkOut: z.iso.datetime(),
    guestCount: z.number().int().positive(),
  }),
});

// validate() middleware parses and replaces req.body/params/query
router.post("/", validate(createBookingSchema), asyncHandler(controller.create));
```

If validation fails, a `ZodError` is thrown and caught by the error handler, returning a 400 with field-level error details.

## Rate Limiting

Two rate limiters are configured:

| Limiter | Scope | Limit | Window | Applied To |
|---|---|---|---|---|
| `globalLimiter` | All routes | 100 req | 15 min | `app.ts` (global) |
| `authLimiter` | Auth routes | 20 req | 15 min | `register`, `login` |

Rate limit info is sent via standard `RateLimit` headers (draft-7):

```
ratelimit-policy: 100;w=900
ratelimit: limit=100, remaining=99, reset=900
```

## Security Layers

| Layer | Implementation | Purpose |
|---|---|---|
| CORS | `cors({ origin: CLIENT_URL, credentials: true })` | Restrict cross-origin requests |
| Helmet | `helmet()` | CSP, HSTS, X-Frame-Options, etc. |
| Rate Limiting | `express-rate-limit` | Prevent brute force / DDoS |
| Password Hashing | `bcrypt` (12 salt rounds) | Secure password storage |
| JWT Tokens | Access (15m) + Refresh (7d) | Stateless authentication |
| httpOnly Cookies | Refresh token in cookie | Prevent XSS token theft |
| Role Authorization | `authorize("HOST", "ADMIN")` | Restrict endpoints by role |
| Input Validation | Zod schemas | Prevent injection / malformed data |
| Env Validation | Zod at startup | Fail fast on missing config |

## Graceful Shutdown

`server.ts` handles `SIGINT` and `SIGTERM` signals:

1. Log the shutdown signal
2. Disconnect Prisma (close DB connection pool)
3. Close the HTTP server (stop accepting new connections)
4. Exit process cleanly

## Logging

Pino is used for structured JSON logging:

- **Development**: `debug` level (verbose)
- **Production**: `info` level (performance-friendly)

`pino-http` automatically logs every HTTP request with:
- Method, URL, status code
- Response time (ms)
- Request/response headers
- Remote address
