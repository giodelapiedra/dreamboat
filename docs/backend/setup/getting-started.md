# Getting Started

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 10 (enabled via `corepack enable`)
- **PostgreSQL** running locally or via Supabase

## Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd dreamboat

# 2. Enable pnpm
corepack enable
corepack prepare pnpm@10.17.1 --activate

# 3. Install all dependencies
pnpm install

# 4. Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your database URL and secrets
```

## Environment Variables

Create `server/.env` with:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/dreamboat
JWT_ACCESS_SECRET=<random-string-min-32-chars>
JWT_REFRESH_SECRET=<different-random-string-min-32-chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Database Setup

```bash
# Push schema to database (creates tables)
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Seed admin user
pnpm --filter server db:seed
```

Default admin credentials after seeding:

| Field | Value |
|---|---|
| Email | admin@dreamboat.local |
| Password | Dreamboat123! |

## Running the Server

```bash
# Development (with hot reload)
pnpm dev

# Production build
pnpm build
cd server && node dist/server.js
```

The API will be available at `http://localhost:3000/api`.

## Verify It Works

```bash
# Health check
curl http://localhost:3000/api/health

# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"TestPass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123"}'

# Browse listings
curl http://localhost:3000/api/listings
```

## Available Scripts

### Root (from `dreamboat/`)

| Script | Command | Description |
|---|---|---|
| `pnpm dev` | `pnpm --filter server dev` | Start server in dev mode |
| `pnpm build` | Build shared → server | Production build |
| `pnpm type-check` | Check shared → server | TypeScript validation |
| `pnpm lint` | ESLint server | Code linting |
| `pnpm db:generate` | Prisma generate | Regenerate Prisma client |
| `pnpm db:migrate` | Prisma migrate dev | Create/run migrations |
| `pnpm db:push` | Prisma db push | Push schema to DB |

### Server (from `server/`)

| Script | Command | Description |
|---|---|---|
| `pnpm dev` | `tsx watch src/server.ts` | Dev server with hot reload |
| `pnpm build` | `tsc -p tsconfig.json` | Compile TypeScript |
| `pnpm start` | `node dist/server.js` | Start compiled server |
| `pnpm type-check` | `tsc --noEmit` | Type check without emitting |
| `pnpm lint` | `eslint "src/**/*.ts"` | Lint source files |
| `pnpm db:seed` | `tsx prisma/seed.ts` | Seed database |

## Troubleshooting

### `EPERM` error on `prisma generate`

A node process is locking the Prisma engine DLL. Kill all node processes and retry:

```bash
taskkill /F /IM node.exe    # Windows
pkill node                  # macOS/Linux
pnpm db:generate
```

### `EADDRINUSE: address already in use :::3000`

Port 3000 is already in use. Kill the process or change `PORT` in `.env`.

### `Unexpected store location` with pnpm

Set the store directory to match the existing one:

```bash
pnpm config set store-dir "<project-path>/.pnpm-store" --global
pnpm install
```
