# Dreamboat Backend Documentation

Complete technical documentation for the Dreamboat REST API server.

## Table of Contents

| Document | Path | Description |
|---|---|---|
| Project Structure | [architecture/project-structure.md](architecture/project-structure.md) | Full file tree and folder conventions |
| Architecture Overview | [architecture/overview.md](architecture/overview.md) | System design, middleware stack, patterns |
| API Reference | [api/endpoints.md](api/endpoints.md) | All endpoints, methods, auth, request/response |
| Authentication | [api/authentication.md](api/authentication.md) | JWT flow, refresh tokens, cookie handling |
| Database Schema | [database/schema.md](database/schema.md) | Prisma models, relations, indexes, enums |
| Setup Guide | [setup/getting-started.md](setup/getting-started.md) | Installation, env config, running the server |
| Dependencies | [setup/dependencies.md](setup/dependencies.md) | All installed packages and their purpose |

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js v5
- **Database**: PostgreSQL (Supabase-hosted)
- **ORM**: Prisma v6
- **Auth**: JWT (access + refresh tokens) + bcrypt
- **Validation**: Zod v4
- **Logging**: Pino + pino-http
- **Security**: Helmet, CORS, express-rate-limit
- **Package Manager**: pnpm (monorepo workspaces)
