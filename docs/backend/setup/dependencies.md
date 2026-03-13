# Dependencies

## Server Dependencies (Production)

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.1.0 | Web framework — routing, middleware, request/response handling |
| `@prisma/client` | ^6.5.0 | Database ORM — type-safe queries, relations, transactions |
| `@dreamboat/shared` | workspace:* | Shared types and Zod schemas between frontend and backend |
| `bcrypt` | ^6.0.0 | Password hashing — 12 salt rounds, timing-safe comparison |
| `jsonwebtoken` | ^9.0.2 | JWT signing and verification for access and refresh tokens |
| `cookie-parser` | ^1.4.7 | Parse cookies from incoming requests (refresh token) |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing — restrict to CLIENT_URL |
| `helmet` | ^8.1.0 | Security headers — CSP, HSTS, X-Frame-Options, etc. |
| `express-rate-limit` | ^8.3.1 | Rate limiting — global (100/15min) + auth (20/15min) |
| `pino` | ^9.9.0 | Structured JSON logger — fast, low-overhead |
| `pino-http` | ^10.5.0 | HTTP request/response logging middleware for Express |
| `zod` | ^4.1.5 | Schema validation — request bodies, params, query, env vars |
| `dotenv` | ^16.4.7 | Load environment variables from `.env` file |
| `http-status-codes` | ^2.3.0 | Named HTTP status code constants (readable code) |

## Server Dependencies (Development)

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.8.2 | TypeScript compiler |
| `tsx` | ^4.19.3 | TypeScript execution — dev server (`tsx watch`) and seed scripts |
| `prisma` | ^6.5.0 | Prisma CLI — schema management, migrations, generate |
| `eslint` | ^9.24.0 | Code linter |
| `@eslint/js` | ^9.24.0 | ESLint core JS rules |
| `typescript-eslint` | ^8.29.1 | ESLint TypeScript plugin |
| `@types/node` | ^22.14.1 | Node.js type definitions |
| `@types/express` | ^5.0.3 | Express type definitions |
| `@types/bcrypt` | ^6.0.0 | bcrypt type definitions |
| `@types/jsonwebtoken` | ^9.0.10 | jsonwebtoken type definitions |
| `@types/cookie-parser` | ^1.4.8 | cookie-parser type definitions |
| `@types/cors` | ^2.8.18 | cors type definitions |

## Shared Package Dependencies

| Package | Version | Purpose |
|---|---|---|
| `zod` | ^4.1.5 | Shared schema definitions (Role, BookingStatus, AuthUser, etc.) |

## Dependency Map

```
app.ts (Express app factory)
├── cors           → CORS middleware
├── helmet         → Security headers
├── pino-http      → Request logging
├── cookie-parser  → Cookie parsing
├── express-rate-limit → Rate limiting
└── routes/index.ts
    ├── modules/auth/
    │   ├── bcrypt         → Password hashing
    │   ├── jsonwebtoken   → JWT sign/verify
    │   └── zod            → Schema validation
    ├── modules/listings/
    │   ├── @prisma/client → Database queries
    │   └── zod            → Schema validation
    ├── modules/bookings/
    │   ├── @prisma/client → Database queries
    │   └── zod            → Schema validation
    └── middleware/
        ├── error-handler  → HttpError, ZodError, PrismaError
        └── validate       → Zod request parsing

config/env.ts
├── dotenv         → Load .env file
└── zod            → Validate env vars at startup

config/logger.ts
└── pino           → Structured JSON logger
```
