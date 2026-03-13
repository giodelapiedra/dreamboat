---
name: dreamboat-backend-creator
description: Build or restructure the Dreamboat backend from a product specification such as instruction.md. Use when Codex needs to create a backend-first monorepo for Dreamboat, set up Express + TypeScript + Prisma foldering, implement phase-1 and phase-2 APIs, or turn the booking platform requirements into a maintainable server architecture with proper domain modules and deferred placeholders for later integrations.
---

# Dreamboat Backend Creator

## Workflow

Read the Dreamboat spec first. Extract only the backend-critical sections before writing code: data model, API surface, environment variables, and server scripts.

If the workspace is blank, run `scripts/scaffold_backend.ps1` to create the folder structure before editing files.

Keep the implementation backend-first. Do not scaffold the client unless the user asks for it.

## Build Order

Follow this order unless the repo already has a stronger structure:

1. Create the workspace root: `.gitignore`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`.
2. Create `shared/` for cross-package enums and API contracts that both backend and future frontend can consume.
3. Create `server/` with `src/common`, `src/config`, `src/lib`, `src/middleware`, `src/routes`, and `src/modules/<domain>`.
4. Create the Prisma schema before writing service logic so route behavior matches the persisted model.
5. Implement auth, listings, bookings, and health first.
6. Add later-phase modules as explicit `501 Not Implemented` placeholders instead of pretending the feature exists.
7. Add `.env.example`, seed, and workspace scripts last.

## Foldering Rules

Use the target layout in [references/backend-blueprint.md](references/backend-blueprint.md).

Keep code split by responsibility:

- `common/`: response helpers, async wrappers, small cross-domain helpers
- `config/`: environment parsing and logger setup
- `lib/`: Prisma, JWT, password hashing, custom errors
- `middleware/`: auth, validation, error handling, not-found
- `modules/<domain>/`: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`
- `routes/`: top-level route composition and health check
- `types/`: declaration merging for Express request user context

Do not put business logic in route files. Keep route files declarative and move persistence rules into services.

## Implementation Rules

Apply these conventions:

- Use Express + TypeScript + Prisma for the backend.
- Use Zod as the request validation source of truth.
- Use JWT access tokens and refresh-token rotation backed by the database.
- Return consistent JSON envelopes: `{ data }` or `{ data, meta }`.
- Protect admin routes with auth middleware even if the handler is still a placeholder.
- When the spec references future systems like Stripe, upload, reviews, or admin analytics, scaffold the route now and return `501` until that phase is implemented.
- Prefer backend completeness over premature frontend work.

## Scope Selection

For a first pass, implement:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/listings`
- `GET /api/listings/:id`
- `GET /api/listings/:id/availability`
- `POST /api/listings`
- `PATCH /api/listings/:id`
- `DELETE /api/listings/:id`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/cancel`
- `GET /api/health`

Leave these deferred unless the user explicitly asks for the next phase:

- forgot/reset password email flows
- Stripe checkout and webhook completion
- media upload storage
- reviews
- admin analytics and moderation

## Validation

When dependencies are available, run:

```powershell
pnpm install
pnpm --filter server db:generate
pnpm type-check
```

If installation is blocked, still leave the codebase in a coherent state with accurate package manifests, env examples, and Prisma schema.

Read [references/backend-blueprint.md](references/backend-blueprint.md) when you need the exact package and folder layout.
