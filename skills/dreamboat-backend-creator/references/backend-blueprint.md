# Dreamboat Backend Blueprint

## Target Structure

```text
.
|- package.json
|- pnpm-workspace.yaml
|- tsconfig.base.json
|- shared/
|  |- package.json
|  |- tsconfig.json
|  `- src/index.ts
`- server/
   |- .env.example
   |- package.json
   |- tsconfig.json
   |- prisma/
   |  |- schema.prisma
   |  `- seed.ts
   `- src/
      |- app.ts
      |- server.ts
      |- common/
      |- config/
      |- constants/
      |- lib/
      |- middleware/
      |- modules/
      |  |- admin/
      |  |- auth/
      |  |- bookings/
      |  |- listings/
      |  |- payments/
      |  |- reviews/
      |  `- upload/
      |- routes/
      `- types/
```

## Domain Boundaries

- `auth`: session issuance, rotation, profile lookup
- `listings`: search, retrieval, host CRUD, availability
- `bookings`: guest CRUD, overlap validation, booking totals
- `payments`: reserved for Stripe phase
- `upload`: reserved for storage phase
- `reviews`: reserved for post-stay review phase
- `admin`: reserved for moderation and reporting phase

## First-Pass Non-Goals

- No frontend scaffold
- No Stripe implementation
- No file upload implementation
- No email delivery implementation
- No admin dashboards

## Behavioral Rules

- Keep refresh tokens persisted and rotatable.
- Store business logic in services, not controllers.
- Prefer `409 Conflict` for booking overlap and duplicate email collisions.
- Return `404` for hidden unpublished listings when the caller lacks access.
- Keep public listing queries readable and owner checks explicit.
