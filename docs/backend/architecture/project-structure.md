# Project Structure

## Monorepo Layout

```
dreamboat/
├── docs/                               # Documentation
│   └── backend/
│       ├── README.md                   # Docs index
│       ├── architecture/               # System design docs
│       ├── api/                        # API reference docs
│       ├── database/                   # Database schema docs
│       └── setup/                      # Setup & install docs
│
├── server/                             # Express + Node backend
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema definition
│   │   └── seed.ts                    # Admin user seeder
│   ├── src/
│   │   ├── app.ts                     # Express app factory (middleware stack)
│   │   ├── server.ts                  # HTTP server entry point + graceful shutdown
│   │   ├── common/                    # Shared utilities
│   │   │   ├── api-response.ts        # Response shape helpers (successResponse)
│   │   │   ├── async-handler.ts       # Async error wrapper for route handlers
│   │   │   └── request-user.ts        # Extract authenticated user from request
│   │   ├── config/
│   │   │   ├── env.ts                 # Zod-validated environment variables
│   │   │   └── logger.ts             # Pino logger instance
│   │   ├── constants/
│   │   │   └── auth.ts               # Refresh token cookie config
│   │   ├── lib/
│   │   │   ├── http-error.ts         # Custom HttpError class
│   │   │   ├── jwt.ts                # JWT sign/verify (access + refresh)
│   │   │   ├── password.ts           # bcrypt hash/compare
│   │   │   └── prisma.ts             # PrismaClient singleton
│   │   ├── middleware/
│   │   │   ├── auth.ts               # authenticate (Bearer) + authorize (roles)
│   │   │   ├── error-handler.ts      # Global error handler (HttpError, Zod, Prisma)
│   │   │   ├── not-found.ts          # 404 catch-all handler
│   │   │   ├── rate-limit.ts         # Global + auth rate limiters
│   │   │   └── validate.ts           # Zod schema validation (body/params/query)
│   │   ├── modules/
│   │   │   ├── admin/
│   │   │   │   └── admin.routes.ts           # ADMIN-only endpoints (stub)
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts        # Request handlers
│   │   │   │   ├── auth.routes.ts            # Route definitions
│   │   │   │   ├── auth.schema.ts            # Zod validation schemas
│   │   │   │   └── auth.service.ts           # Business logic
│   │   │   ├── bookings/
│   │   │   │   ├── bookings.controller.ts    # Request handlers
│   │   │   │   ├── bookings.routes.ts        # Route definitions
│   │   │   │   ├── bookings.schema.ts        # Zod validation schemas
│   │   │   │   └── bookings.service.ts       # Business logic
│   │   │   ├── listings/
│   │   │   │   ├── listings.controller.ts    # Request handlers
│   │   │   │   ├── listings.routes.ts        # Route definitions
│   │   │   │   ├── listings.schema.ts        # Zod validation schemas
│   │   │   │   └── listings.service.ts       # Business logic
│   │   │   ├── payments/
│   │   │   │   └── payments.routes.ts        # Stripe endpoints (stub)
│   │   │   ├── reviews/
│   │   │   │   └── reviews.routes.ts         # Review endpoints (stub)
│   │   │   └── upload/
│   │   │       └── upload.routes.ts          # File upload endpoint (stub)
│   │   ├── routes/
│   │   │   ├── health.routes.ts      # Health check endpoint
│   │   │   └── index.ts              # Route aggregator (mounts all modules)
│   │   └── types/
│   │       └── express.d.ts          # Express Request type augmentation
│   ├── .env                           # Environment variables (gitignored)
│   ├── .env.example                   # Environment template
│   ├── eslint.config.mjs             # ESLint config
│   ├── package.json                   # Server dependencies & scripts
│   └── tsconfig.json                  # Server TypeScript config
│
├── shared/                             # Shared types between FE & BE
│   ├── src/
│   │   └── index.ts                   # Zod schemas + TS types (Role, AuthUser, etc.)
│   ├── dist/                          # Compiled output
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── package.json                        # Root workspace config
├── pnpm-workspace.yaml                # pnpm workspace definition
└── tsconfig.base.json                 # Shared TypeScript compiler options
```

## Module Pattern

Each feature module in `server/src/modules/` follows a consistent 4-file pattern:

```
modules/<feature>/
├── <feature>.routes.ts        # Express Router — endpoint definitions
├── <feature>.controller.ts    # Request handlers — parse req, call service, send res
├── <feature>.service.ts       # Business logic — DB queries, validation, computation
└── <feature>.schema.ts        # Zod schemas — request body/params/query validation
```

**Data flow per request:**

```
Client Request
  → Express Router (routes.ts)
    → Middleware (validate, authenticate, authorize, rate-limit)
      → Controller (controller.ts)
        → Service (service.ts)
          → Prisma (database)
        ← Return data
      ← Format response (successResponse)
    ← Error handler (if thrown)
  ← JSON Response
```

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Folders | kebab-case | `modules/`, `rate-limit.ts` |
| Files | kebab-case | `auth.service.ts`, `api-response.ts` |
| Exported functions | camelCase | `asyncHandler`, `signAccessToken` |
| Classes | PascalCase | `HttpError` |
| Constants | UPPER_SNAKE_CASE | `REFRESH_TOKEN_COOKIE_NAME` |
| Types/Interfaces | PascalCase | `ListingQuery`, `AccessTokenPayload` |
| DB Enums | UPPER_SNAKE_CASE | `GUEST`, `PENDING`, `CONFIRMED` |
| API routes | kebab-case | `/api/auth/forgot-password` |
