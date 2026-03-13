# Dreamboat — Full-Stack Booking Web Application

## 1. Project Overview

**Dreamboat** is a full-stack booking web application that allows users to browse, reserve, and manage bookings for accommodations (hotels, resorts, vacation rentals). The platform serves three user roles: **Guest**, **Host**, and **Admin**.

### Architecture

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

### Core Objectives

- Provide a seamless booking experience from search to checkout
- Real-time availability and calendar management for hosts
- Secure payment processing and automated invoicing
- Responsive design — mobile-first approach
- Scalable architecture ready for production deployment
- Clear separation between frontend SPA and backend REST API

---

## 2. Skills & Expertise Required

> **Proficiency Scale:** `[====]` Advanced — `[=== ]` Intermediate — `[==  ]` Basic — `[=   ]` Awareness

---

### 2.1 Frontend Skills

#### Core Language & Framework

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 1  | TypeScript        | `[====]` Adv  | Generics, utility types, discriminated unions, `satisfies`       |
| 2  | React 19          | `[====]` Adv  | Hooks, Suspense, transitions, context, portals, memo             |
| 3  | Vite 6            | `[=== ]` Mid  | Dev server, HMR, build config, env variables, plugin system      |

#### Routing & Navigation

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 4  | React Router v7   | `[====]` Adv  | Nested layouts, route guards, lazy routes, `useNavigate`         |

#### Styling & UI

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 5  | Tailwind CSS 4    | `[=== ]` Mid  | Utility classes, responsive breakpoints, dark mode, custom theme |
| 6  | shadcn/ui         | `[=== ]` Mid  | Radix primitives, accessible forms, dialog, dropdown, toast      |

#### State Management

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 7  | Zustand           | `[=== ]` Mid  | Global client state (auth, search, UI), selectors, persist       |
| 8  | TanStack Query v5 | `[====]` Adv  | `useQuery`, `useMutation`, cache invalidation, optimistic UI     |

#### Forms, Validation & HTTP

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 9  | React Hook Form   | `[=== ]` Mid  | `useForm`, `Controller`, field arrays, error messages            |
| 10 | Zod               | `[=== ]` Mid  | Schema definition, `safeParse`, `z.infer`, shared with backend   |
| 11 | Axios             | `[=== ]` Mid  | Instances, request/response interceptors, error handling         |

---

### 2.2 Backend Skills

#### Runtime & Framework

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 1  | Node.js           | `[====]` Adv  | Event loop, async/await, streams, `process.env`                  |
| 2  | Express.js        | `[====]` Adv  | Router, middleware chain, error middleware, `req`/`res` lifecycle |
| 3  | TypeScript         | `[====]` Adv  | Shared types with frontend, declaration merging (`express.d.ts`) |

#### Database & ORM

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 4  | Prisma ORM        | `[====]` Adv  | Schema modeling, migrations, relations, transactions, raw SQL    |
| 5  | PostgreSQL        | `[=== ]` Mid  | Indexes, constraints, overlap queries, `Decimal`, enums          |

#### Authentication & Security

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 6  | JWT (jsonwebtoken) | `[=== ]` Mid | Access token (15min), refresh token (7d), token rotation         |
| 7  | bcrypt            | `[==  ]` Bas  | Password hashing (12 salt rounds), `compare`, timing-safe        |
| 8  | Helmet.js         | `[==  ]` Bas  | Security headers, XSS protection, CSP, HSTS                     |
| 9  | express-rate-limit | `[==  ]` Bas | Rate limiting per IP, per route, sliding window                  |

#### Payments & Integrations

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 10 | Stripe API        | `[=== ]` Mid  | Checkout sessions, webhooks, signature verification, refunds     |
| 11 | Multer            | `[=== ]` Mid  | Multipart file parsing, file size limits, mimetype filtering     |
| 12 | Supabase Storage  | `[=== ]` Mid  | Bucket upload, public URLs, RLS policies                         |

#### Email & Validation

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 13 | Resend / Nodemailer | `[==  ]` Bas | Transactional email, HTML templates, delivery tracking          |
| 14 | Zod               | `[=== ]` Mid  | Request body validation middleware, shared with frontend         |

---

### 2.3 DevOps & Tooling Skills

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 1  | Git + GitHub      | `[=== ]` Mid  | Branching strategy, conventional commits, PRs, code review       |
| 2  | GitHub Actions    | `[==  ]` Bas  | CI pipeline: lint → type-check → test → build → deploy          |
| 3  | Vercel / Netlify  | `[=== ]` Mid  | Static SPA deployment, preview URLs, env management              |
| 4  | Railway / Render  | `[=== ]` Mid  | Node.js API hosting, auto-deploy from GitHub, env vars           |
| 5  | Vitest            | `[=== ]` Mid  | Unit tests, mocking, coverage, watch mode                        |
| 6  | Playwright        | `[==  ]` Bas  | E2E browser tests, page objects, CI integration                  |
| 7  | Docker (optional) | `[==  ]` Bas  | `docker-compose` for local PostgreSQL, containerized dev env     |
| 8  | pnpm Workspaces   | `[=== ]` Mid  | Monorepo management, shared dependencies, workspace scripts      |

---

### 2.4 Design & UX Skills

| #  | Skill             | Proficiency   | Key Concepts                                                     |
| -- | ----------------- | ------------- | ---------------------------------------------------------------- |
| 1  | Responsive Design | `[====]` Adv  | Mobile-first, breakpoints (sm/md/lg/xl), fluid layouts           |
| 2  | Accessibility     | `[=== ]` Mid  | ARIA labels, keyboard nav, focus management, screen readers      |
| 3  | UI/UX Principles  | `[=== ]` Mid  | Information hierarchy, booking flow UX, loading/empty states     |
| 4  | Figma (optional)  | `[==  ]` Bas  | Design handoff, inspect mode, component extraction               |

---

### 2.5 Skill Summary Matrix

```
FRONTEND                              BACKEND
─────────────────────────────         ─────────────────────────────
TypeScript        ████████████ Adv    Node.js           ████████████ Adv
React 19          ████████████ Adv    Express.js        ████████████ Adv
Vite 6            █████████░░░ Mid    TypeScript        ████████████ Adv
React Router v7   ████████████ Adv    Prisma ORM        ████████████ Adv
Tailwind CSS 4    █████████░░░ Mid    PostgreSQL        █████████░░░ Mid
shadcn/ui         █████████░░░ Mid    JWT               █████████░░░ Mid
Zustand           █████████░░░ Mid    bcrypt            ██████░░░░░░ Bas
TanStack Query v5 ████████████ Adv    Stripe API        █████████░░░ Mid
React Hook Form   █████████░░░ Mid    Multer + Supabase █████████░░░ Mid
Zod               █████████░░░ Mid    Resend/Nodemailer ██████░░░░░░ Bas
Axios             █████████░░░ Mid    Zod               █████████░░░ Mid

DEVOPS & TOOLING                      DESIGN & UX
─────────────────────────────         ─────────────────────────────
Git + GitHub      █████████░░░ Mid    Responsive Design ████████████ Adv
GitHub Actions    ██████░░░░░░ Bas    Accessibility     █████████░░░ Mid
Vercel / Netlify  █████████░░░ Mid    UI/UX Principles  █████████░░░ Mid
Railway / Render  █████████░░░ Mid    Figma             ██████░░░░░░ Bas
Vitest            █████████░░░ Mid
Playwright        ██████░░░░░░ Bas
Docker            ██████░░░░░░ Bas
pnpm Workspaces   █████████░░░ Mid
```

---

## 3. Coding Standards & Formatting

### 3.1 File & Naming Conventions

```
Components     → PascalCase          → ListingCard.tsx (export: ListingCard)
Pages          → PascalCase          → ListingsPage.tsx, LoginPage.tsx
Hooks          → camelCase, use-     → use-listings.ts (export: useListings)
Utilities      → camelCase           → format-date.ts (export: formatDate)
Schemas        → camelCase.schema    → listing.schema.ts
Types/Interfaces → PascalCase        → Listing, BookingStatus, ApiResponse
Constants      → UPPER_SNAKE_CASE    → MAX_UPLOAD_SIZE, DEFAULT_CURRENCY
DB Enums       → UPPER_SNAKE_CASE    → PENDING, CONFIRMED
CSS Classes    → kebab-case          → .booking-card, .search-bar
Folders        → kebab-case          → date-range-picker/, booking-summary/
Env Vars       → VITE_ prefix (FE)   → VITE_API_URL, VITE_STRIPE_PK
Env Vars       → plain (BE)          → DATABASE_URL, JWT_SECRET
API Routes     → kebab-case          → /api/listings, /api/auth/forgot-password
```

### 3.2 TypeScript Rules

```typescript
// ALWAYS: Explicit return types on exported functions
export function calculateTotal(nights: number, price: number): number {
  return nights * price;
}

// ALWAYS: Use `interface` for object shapes, `type` for unions/intersections
interface Listing {
  id: string;
  title: string;
  pricePerNight: number;
}

type BookingAction = "confirm" | "cancel" | "complete";

// ALWAYS: Zod schema as single source of truth — infer types from it
const listingSchema = z.object({
  title: z.string().min(3).max(100),
  pricePerNight: z.number().positive(),
});
type ListingInput = z.infer<typeof listingSchema>;

// ALWAYS: Use shared types package or shared/ folder for FE ↔ BE types
// NEVER: `any` — use `unknown` and narrow, or define proper types
// NEVER: Non-null assertions (`!`) — handle null/undefined explicitly
// NEVER: @ts-ignore — fix the type error instead
```

### 3.3 React + Vite Patterns

```typescript
// ALL components are client-side (no SSR) — this is a Vite SPA

// ALWAYS: Use TanStack Query for ALL server data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ["listings", filters],
  queryFn: () => listingsApi.getAll(filters),
});

// ALWAYS: Use React Router loaders or TanStack Query for initial data
// NEVER: Fetch in raw useEffect — use useQuery instead
// NEVER: Store server data in useState — TanStack Query IS the cache

// ALWAYS: Protect routes via AuthGuard wrapper component
<Route element={<AuthGuard roles={["HOST"]} />}>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route path="listings" element={<HostListingsPage />} />
  </Route>
</Route>

// ALWAYS: Lazy-load page components for code splitting
const ListingsPage = lazy(() => import("@/pages/ListingsPage"));

// ALWAYS: Use ErrorBoundary component for graceful error handling
// ALWAYS: Show skeleton loaders via Suspense fallback
```

### 3.4 Express API Patterns

```typescript
// src/routes/listings.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { listingSchema } from "@/schemas/listing.schema";
import * as listingsController from "@/controllers/listings.controller";

const router = Router();

router.get("/", listingsController.getAll);
router.get("/:id", listingsController.getById);
router.post("/", authenticate, authorize("HOST"), validate(listingSchema), listingsController.create);
router.patch("/:id", authenticate, authorize("HOST"), validate(listingSchema.partial()), listingsController.update);
router.delete("/:id", authenticate, authorize("HOST", "ADMIN"), listingsController.remove);

export default router;
```

```typescript
// src/controllers/listings.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/prisma";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listing = await prisma.listing.create({
      data: { ...req.body, hostId: req.user!.id },
    });
    res.status(201).json({ data: listing });
  } catch (error) {
    next(error);
  }
}
```

```typescript
// src/middleware/validate.ts
import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        issues: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
```

### 3.5 API Response Shape (Consistent)

```typescript
// Success
{ "data": { ... } }                          // Single resource
{ "data": [...], "meta": { "total": 50, "page": 1, "limit": 12 } }  // Collection

// Error
{
  "error": "Validation failed",
  "message": "Check-in date must be in the future",
  "issues": { "checkIn": ["Must be a future date"] }   // Optional: Zod errors
}

// HTTP status codes:
// 200 — OK
// 201 — Created
// 204 — No Content (delete)
// 400 — Bad Request (validation)
// 401 — Unauthorized (no token / expired)
// 403 — Forbidden (wrong role)
// 404 — Not Found
// 409 — Conflict (double booking, duplicate email)
// 500 — Internal Server Error
```

### 3.6 Component Structure

```typescript
// Standard component file structure:
// 1. Imports (external → internal → types)
// 2. Interface / Props
// 3. Component function
// 4. Sub-components (if small and tightly coupled)

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  onBook?: (id: string) => void;
}

export function ListingCard({ listing, onBook }: ListingCardProps) {
  // hooks first
  const [isLoading, setIsLoading] = useState(false);

  // handlers
  function handleBook(): void {
    setIsLoading(true);
    onBook?.(listing.id);
  }

  // render
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{listing.title}</h3>
      <p className="text-muted-foreground">{listing.location}</p>
      <Button onClick={handleBook} disabled={isLoading}>
        Book Now
      </Button>
    </div>
  );
}
```

### 3.7 Import Order (auto-enforced via ESLint)

```
1. React built-ins                  → import { useState, useEffect } from "react"
2. External packages                → import { z } from "zod"
3. Internal aliases (@/)            → import { api } from "@/lib/api"
4. Relative imports                 → import { formatDate } from "./utils"
5. Type-only imports                → import type { Listing } from "@/types"
6. Styles (if any)                  → import "./styles.css"
```

### 3.8 Git Commit Message Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `perf`, `ci`

**Examples:**
```
feat(booking): add date overlap validation on checkout
fix(auth): resolve token refresh race condition
refactor(listings): extract search filter into custom hook
chore(deps): bump react-router to 7.2.0
```

---

## 4. Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite 6                        |
| Routing        | React Router v7                                     |
| Styling        | Tailwind CSS 4, shadcn/ui                           |
| Client State   | Zustand                                             |
| Server State   | TanStack Query v5                                   |
| HTTP Client    | Axios (with interceptors)                           |
| Forms          | React Hook Form + Zod                               |
| Backend        | Node.js, Express.js, TypeScript                     |
| Database       | PostgreSQL (via Supabase)                            |
| ORM            | Prisma                                              |
| Auth           | JWT (access + refresh tokens), bcrypt                |
| Payments       | Stripe (Checkout + Webhooks)                         |
| File Storage   | Supabase Storage (or Cloudinary)                     |
| Email          | Resend (or Nodemailer + SMTP)                        |
| Validation     | Zod (shared schemas for frontend + backend)          |
| Testing        | Vitest (unit), Playwright (e2e)                      |
| FE Deployment  | Vercel or Netlify (static SPA)                       |
| BE Deployment  | Railway, Render, or Fly.io                           |
| CI/CD          | GitHub Actions                                       |

---

## 5. Project Structure

### Monorepo Layout

```
dreamboat/
├── client/                          # React + Vite frontend
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/                     # API client layer
│   │   │   ├── axios.ts             # Axios instance + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── listings.api.ts
│   │   │   ├── bookings.api.ts
│   │   │   └── payments.api.ts
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui primitives
│   │   │   ├── forms/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── ListingForm.tsx
│   │   │   │   └── BookingForm.tsx
│   │   │   ├── listings/
│   │   │   │   ├── ListingCard.tsx
│   │   │   │   ├── ListingGrid.tsx
│   │   │   │   ├── ListingGallery.tsx
│   │   │   │   └── ListingMap.tsx
│   │   │   ├── bookings/
│   │   │   │   ├── BookingCard.tsx
│   │   │   │   ├── BookingSummary.tsx
│   │   │   │   └── DateRangePicker.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   └── shared/
│   │   │       ├── SearchBar.tsx
│   │   │       ├── RatingStars.tsx
│   │   │       ├── Avatar.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── LoadingSkeleton.tsx
│   │   │       └── ErrorFallback.tsx
│   │   ├── hooks/
│   │   │   ├── use-listings.ts
│   │   │   ├── use-bookings.ts
│   │   │   ├── use-auth.ts
│   │   │   └── use-debounce.ts
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ListingsPage.tsx
│   │   │   ├── ListingDetailPage.tsx
│   │   │   ├── BookingsPage.tsx
│   │   │   ├── BookingDetailPage.tsx
│   │   │   ├── CheckoutSuccessPage.tsx
│   │   │   ├── host/
│   │   │   │   ├── HostListingsPage.tsx
│   │   │   │   ├── HostCalendarPage.tsx
│   │   │   │   ├── HostBookingsPage.tsx
│   │   │   │   └── HostEarningsPage.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminUsersPage.tsx
│   │   │   │   ├── AdminListingsPage.tsx
│   │   │   │   └── AdminReportsPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── routes/
│   │   │   ├── index.tsx             # Route definitions
│   │   │   ├── AuthGuard.tsx         # Protected route wrapper
│   │   │   └── GuestGuard.tsx        # Redirect if logged in
│   │   ├── stores/
│   │   │   ├── auth.store.ts         # Auth state (token, user)
│   │   │   ├── search.store.ts
│   │   │   └── ui.store.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── package.json
│
├── server/                          # Express + Node backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── listings.controller.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── reviews.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── routes/
│   │   │   ├── index.ts              # Route aggregator
│   │   │   ├── auth.routes.ts
│   │   │   ├── listings.routes.ts
│   │   │   ├── bookings.routes.ts
│   │   │   ├── payments.routes.ts
│   │   │   ├── reviews.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verify + attach user
│   │   │   ├── validate.ts           # Zod request validation
│   │   │   ├── error-handler.ts      # Global error handler
│   │   │   ├── rate-limit.ts         # Rate limiting
│   │   │   └── cors.ts               # CORS configuration
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Business logic: register, login, refresh
│   │   │   ├── listings.service.ts
│   │   │   ├── bookings.service.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── upload.service.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts             # Prisma client singleton
│   │   │   ├── stripe.ts             # Stripe client
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   └── jwt.ts                # Token generation/verification
│   │   ├── types/
│   │   │   ├── express.d.ts          # Extend Express Request type
│   │   │   └── index.ts
│   │   └── app.ts                    # Express app setup
│   │   └── server.ts                 # Entry point (listen)
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                          # Shared between FE & BE
│   ├── schemas/
│   │   ├── listing.schema.ts
│   │   ├── booking.schema.ts
│   │   ├── user.schema.ts
│   │   └── review.schema.ts
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces
│   └── constants.ts                  # Shared constants
│
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json                     # Root workspace config
├── pnpm-workspace.yaml
└── README.md
```

---

## 6. Database Schema

### Entity-Relationship Overview

```
User ──< Listing ──< Booking >── User (guest)
                  ──< Review  >── User (author)
                  ──< Image
Booking ──< Payment
```

### Prisma Models

```prisma
enum Role {
  GUEST
  HOST
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  image         String?
  phone         String?
  role          Role      @default(GUEST)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  listings      Listing[]
  bookings      Booking[]
  reviews       Review[]
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model Listing {
  id            String   @id @default(cuid())
  title         String
  description   String
  category      String                          // hotel, resort, villa, apartment
  pricePerNight Decimal  @db.Decimal(10, 2)
  currency      String   @default("PHP")
  location      String
  address       String
  latitude      Float?
  longitude     Float?
  maxGuests     Int
  bedrooms      Int
  bathrooms     Int
  amenities     String[]                        // wifi, pool, parking, etc.
  isPublished   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  hostId        String
  host          User      @relation(fields: [hostId], references: [id], onDelete: Cascade)
  images        Image[]
  bookings      Booking[]
  reviews       Review[]

  @@index([hostId])
  @@index([category])
  @@index([location])
}

model Image {
  id        String  @id @default(cuid())
  url       String
  alt       String?
  order     Int     @default(0)

  listingId String
  listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
}

model Booking {
  id            String        @id @default(cuid())
  checkIn       DateTime
  checkOut      DateTime
  totalPrice    Decimal       @db.Decimal(10, 2)
  guestCount    Int
  status        BookingStatus @default(PENDING)
  specialNotes  String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  guestId       String
  guest         User          @relation(fields: [guestId], references: [id], onDelete: Cascade)
  listingId     String
  listing       Listing       @relation(fields: [listingId], references: [id], onDelete: Cascade)
  payment       Payment?

  @@index([guestId])
  @@index([listingId])
  @@index([checkIn, checkOut])
}

model Payment {
  id                String        @id @default(cuid())
  amount            Decimal       @db.Decimal(10, 2)
  currency          String        @default("PHP")
  status            PaymentStatus @default(PENDING)
  stripePaymentId   String?       @unique
  stripeSessionId   String?       @unique
  createdAt         DateTime      @default(now())

  bookingId         String        @unique
  booking           Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
}

model Review {
  id        String   @id @default(cuid())
  rating    Int                                // 1-5
  comment   String
  createdAt DateTime @default(now())

  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([authorId, listingId])              // one review per user per listing
  @@index([listingId])
}
```

---

## 7. Core Features & User Stories

### 7.1 Authentication

| ID    | Story                                                    | Priority |
| ----- | -------------------------------------------------------- | -------- |
| AU-01 | User can register with email/password                    | P0       |
| AU-02 | User can log in and receive access + refresh tokens      | P0       |
| AU-03 | Tokens auto-refresh via Axios interceptor                | P0       |
| AU-04 | User can log in via Google OAuth                         | P1       |
| AU-05 | User can reset password via email link                   | P1       |
| AU-06 | Protected routes redirect unauthenticated users to login | P0       |
| AU-07 | User can log out (invalidates refresh token)             | P0       |

### 7.2 Listings (Guest View)

| ID    | Story                                                         | Priority |
| ----- | ------------------------------------------------------------- | -------- |
| LG-01 | Guest can browse all published listings                       | P0       |
| LG-02 | Guest can search by location, date range, and guest count     | P0       |
| LG-03 | Guest can filter by category, price range, and amenities      | P1       |
| LG-04 | Guest can sort by price, rating, or newest                    | P1       |
| LG-05 | Guest can view listing detail with gallery, map, and reviews  | P0       |
| LG-06 | Guest can see real-time availability on a calendar            | P0       |

### 7.3 Bookings

| ID    | Story                                                       | Priority |
| ----- | ----------------------------------------------------------- | -------- |
| BK-01 | Guest can select dates and submit a booking request          | P0       |
| BK-02 | System validates no date overlap with existing bookings      | P0       |
| BK-03 | Guest is redirected to Stripe Checkout for payment           | P0       |
| BK-04 | Booking status updates to CONFIRMED on successful payment    | P0       |
| BK-05 | Guest receives confirmation email after booking              | P1       |
| BK-06 | Guest can view and cancel upcoming bookings                  | P0       |
| BK-07 | Cancellation triggers refund based on cancellation policy    | P1       |

### 7.4 Host Dashboard

| ID    | Story                                                    | Priority |
| ----- | -------------------------------------------------------- | -------- |
| HD-01 | Host can create a new listing with images                | P0       |
| HD-02 | Host can edit or unpublish existing listings             | P0       |
| HD-03 | Host can manage availability via calendar                | P0       |
| HD-04 | Host can view incoming bookings and guest details        | P0       |
| HD-05 | Host can see earnings summary and payout history         | P1       |

### 7.5 Reviews

| ID    | Story                                                    | Priority |
| ----- | -------------------------------------------------------- | -------- |
| RV-01 | Guest can leave a rating (1-5) and review after checkout | P1       |
| RV-02 | Reviews are displayed on the listing detail page         | P1       |
| RV-03 | Average rating is computed and shown on listing cards    | P1       |

### 7.6 Admin Panel

| ID    | Story                                                 | Priority |
| ----- | ----------------------------------------------------- | -------- |
| AD-01 | Admin can view all users and change roles             | P2       |
| AD-02 | Admin can moderate (unpublish/delete) listings        | P2       |
| AD-03 | Admin can view platform-wide booking and revenue data | P2       |

---

## 8. API Endpoints

**Base URL:** `http://localhost:3000/api`

### Auth

```
POST   /api/auth/register            → Create account
POST   /api/auth/login               → Login → returns { accessToken, refreshToken }
POST   /api/auth/refresh             → Refresh access token
POST   /api/auth/logout              → Invalidate refresh token
POST   /api/auth/forgot-password     → Send reset email
POST   /api/auth/reset-password      → Reset password with token
GET    /api/auth/me                  → Get current user profile
```

### Listings

```
GET    /api/listings                  → List all (search, filter, paginate)
GET    /api/listings/:id              → Get single listing (with images, host, avg rating)
POST   /api/listings                  → Create listing [HOST]
PATCH  /api/listings/:id              → Update listing [HOST owner]
DELETE /api/listings/:id              → Delete listing [HOST owner | ADMIN]
GET    /api/listings/:id/availability → Get booked dates for calendar
```

### Bookings

```
GET    /api/bookings                  → List user's bookings [AUTH]
GET    /api/bookings/:id              → Get single booking [AUTH owner]
POST   /api/bookings                  → Create booking [AUTH]
PATCH  /api/bookings/:id/cancel       → Cancel booking [AUTH owner]
```

### Reviews

```
GET    /api/listings/:id/reviews      → Get reviews for listing
POST   /api/listings/:id/reviews      → Create review [AUTH, must have completed booking]
```

### Payments

```
POST   /api/payments/checkout         → Create Stripe Checkout session [AUTH]
POST   /api/payments/webhook          → Stripe webhook handler (raw body)
```

### Upload

```
POST   /api/upload                    → Upload image(s) [AUTH] → returns URLs
```

### Admin

```
GET    /api/admin/users               → List all users [ADMIN]
PATCH  /api/admin/users/:id/role      → Change user role [ADMIN]
GET    /api/admin/stats               → Platform-wide stats [ADMIN]
```

---

## 9. Key Implementation Details

### 9.1 Authentication Flow (JWT)

```
Register:
  Client POST /api/auth/register { name, email, password }
  → Server hashes password (bcrypt, 12 rounds)
  → Creates user in DB
  → Returns { accessToken (15min), refreshToken (7d) }
  → Client stores accessToken in memory, refreshToken in httpOnly cookie

Login:
  Client POST /api/auth/login { email, password }
  → Server verifies password
  → Returns { accessToken, refreshToken }

Token Refresh (Axios interceptor):
  On 401 response → POST /api/auth/refresh with refreshToken cookie
  → Server verifies refresh token, issues new pair
  → Retries original request with new accessToken

Logout:
  POST /api/auth/logout
  → Server deletes refresh token from DB
  → Client clears auth store
```

### 9.2 Axios Interceptor Setup

```typescript
// client/src/api/axios.ts
import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // send cookies (refresh token)
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });
        useAuthStore.getState().setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 9.3 Booking & Payment Flow

```
1. Guest selects dates on listing detail page
2. Client validates: min 1 night, no past dates, guest count ≤ maxGuests
3. POST /api/bookings { listingId, checkIn, checkOut, guestCount }
   → Server checks availability (no overlap query)
   → Booking created with status = PENDING
   → Returns booking ID
4. POST /api/payments/checkout { bookingId }
   → Server creates Stripe Checkout Session
   → Returns { sessionUrl }
5. Client redirects to Stripe hosted checkout page
6. On success → Stripe fires webhook → POST /api/payments/webhook
   → Verify signature → Update booking to CONFIRMED → Create Payment record
   → Send confirmation email
7. Client lands on /checkout/success?bookingId=xxx
8. On failure/expiry → CRON or webhook marks PENDING booking as CANCELLED after 30min
```

### 9.4 Availability Check (No Double-Booking)

```sql
-- Overlap detection: reject if any existing non-cancelled booking overlaps
SELECT COUNT(*) FROM "Booking"
WHERE "listingId" = $1
  AND "status" IN ('PENDING', 'CONFIRMED')
  AND "checkIn" < $2   -- requested checkOut
  AND "checkOut" > $3;  -- requested checkIn
-- If count > 0 → return 409 Conflict
```

### 9.5 Search & Filtering

- Full-text search on `title`, `description`, `location` via Prisma `contains` (or pg `tsvector` for scale)
- Filter: `category`, `pricePerNight` range, `amenities` array overlap, `maxGuests >= guestCount`
- Date availability: exclude listings with conflicting bookings in requested range
- Pagination: offset-based with `page` + `limit` params (cursor-based for infinite scroll later)
- Sort: `price_asc`, `price_desc`, `rating`, `newest`

### 9.6 Image Upload

- Frontend: validate file type (JPEG/PNG/WebP) and size (max 2MB) before upload
- Backend: Multer for multipart parsing → upload to Supabase Storage bucket
- Store returned public URL in `Image` table linked to listing
- Max 10 images per listing
- First image = cover (order: 0)

---

## 10. Environment Variables

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_NAME=Dreamboat
```

### Server (`server/.env`)

```env
# App
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@host:5432/dreamboat

# JWT
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@dreamboat.com
```

---

## 11. Non-Functional Requirements

| Requirement          | Target                                                          |
| -------------------- | --------------------------------------------------------------- |
| Performance          | LCP < 2.5s, FID < 100ms, CLS < 0.1 (Core Web Vitals)          |
| Bundle Size          | Initial JS < 200KB gzipped (code-split per route)               |
| API Response Time    | p95 < 300ms for read endpoints, < 500ms for writes              |
| Accessibility        | WCAG 2.1 AA compliance                                         |
| Responsiveness       | Mobile-first; breakpoints at 640, 768, 1024, 1280px            |
| Security             | CORS whitelist, Helmet.js, rate limiting, input sanitization    |
| Auth Security        | httpOnly cookies for refresh token, short-lived access tokens   |
| SEO                  | React Helmet for meta tags (limited SPA SEO — acceptable)       |
| Error Handling       | Global ErrorBoundary (FE), centralized error middleware (BE)    |
| Loading States       | Skeleton loaders for all async content via Suspense             |
| Logging              | Structured JSON logs (pino) in production                       |
| Monitoring           | Sentry for error tracking (both FE and BE)                      |

---

## 12. Development Workflow

### Getting Started

```bash
# 1. Clone and install (pnpm workspaces)
git clone <repo-url> && cd dreamboat
pnpm install

# 2. Set up environment files
cp client/.env.example client/.env
cp server/.env.example server/.env
# Fill in your keys

# 3. Initialize database
cd server
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed

# 4. Run both servers concurrently (from root)
cd ..
pnpm dev
```

### Root package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter client dev\" \"pnpm --filter server dev\"",
    "build": "pnpm --filter client build && pnpm --filter server build",
    "lint": "pnpm --filter client lint && pnpm --filter server lint",
    "type-check": "pnpm --filter client type-check && pnpm --filter server type-check",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### Client Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "type-check": "tsc --noEmit"
}
```

### Server Scripts

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "lint": "eslint .",
  "type-check": "tsc --noEmit",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio"
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "client"
  - "server"
  - "shared"
```

### Git Conventions

- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/`
- Commit format: [Conventional Commits](https://www.conventionalcommits.org/)
- PR required for `main` — no direct pushes
- CI must pass (lint + type-check + tests) before merge

---

## 13. Deployment Checklist

### Frontend (Vercel / Netlify)

- [ ] Build output: `client/dist/` (static SPA)
- [ ] Set `VITE_API_URL` to production backend URL
- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY` to live key
- [ ] Configure SPA fallback: all routes → `index.html`
- [ ] Enable gzip/brotli compression

### Backend (Railway / Render / Fly.io)

- [ ] All environment variables set in hosting dashboard
- [ ] Database migrated: `prisma migrate deploy`
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` set to production frontend URL (CORS)
- [ ] Stripe webhook endpoint configured for production URL
- [ ] Supabase storage bucket policies set (public read for images)
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers active

### General

- [ ] Custom domain configured with SSL
- [ ] Sentry DSN configured for both FE and BE
- [ ] Structured logging enabled (pino)
- [ ] Database backup strategy confirmed (Supabase auto-backups)
- [ ] Load testing completed for booking flow
- [ ] Smoke test: register → login → search → book → pay → confirm

---

## 14. Phase Roadmap

| Phase | Scope                                                     | Status  |
| ----- | --------------------------------------------------------- | ------- |
| 1     | Project setup, monorepo, DB schema, basic Express server  | Pending |
| 2     | Auth (register, login, JWT, refresh, guards)              | Pending |
| 3     | Listings CRUD, image upload, search & filters             | Pending |
| 4     | Booking flow, Stripe payments, webhooks                   | Pending |
| 5     | Host dashboard, calendar, earnings                        | Pending |
| 6     | Reviews, ratings, advanced filters                        | Pending |
| 7     | Admin panel, moderation                                   | Pending |
| 8     | Email notifications (confirmation, cancellation, reset)   | Pending |
| 9     | Performance optimization, code splitting, caching         | Pending |
| 10    | Testing (unit + e2e), CI/CD pipeline, deployment          | Pending |
