# Frontend Architecture

## Product Scope

This frontend is now aligned to a Shopify-assisted guest confirmation workflow rather than a booking marketplace.

Primary flow:
1. Shopify sends a webhook to the backend after payment or booking creation.
2. The backend records the submission and creates a secure confirmation token.
3. The guest opens a confirmation link and fills only the missing fields.
4. The internal team reviews submissions in a dashboard.

## Main Routes

- `/` - product landing and demo entry points
- `/login` - internal team login
- `/register` - optional internal account creation using existing auth
- `/forms/:slug` - generic public Typeform-style form
- `/confirm/:token` - guest confirmation flow with prefilled answers
- `/dashboard` - internal submissions workspace
- `/dashboard/submissions/:submissionId` - submission detail view

## Frontend Stack

- React 19 + TypeScript + Vite
- React Router for route structure and access control
- TanStack Query for async data and caching
- Zustand for auth session state only
- Axios for API access and refresh-token recovery
- CSS tokens plus custom components for the UI system

## Current Backend Reality

The existing backend still only exposes auth, listings, and bookings. The frontend now assumes future endpoints for:

- `GET /api/forms/:slug`
- `POST /api/forms/:slug/submissions`
- `GET /api/confirm/:token`
- `POST /api/confirm/:token`
- `GET /api/submissions`
- `GET /api/submissions/:id`
- `POST /api/webhooks/shopify`

Because those routes do not exist yet, the frontend uses fallback preview data when `VITE_ENABLE_FORM_FALLBACK=true`.

## Important Assumptions

- Auth remains handled by the current JWT + refresh-cookie backend.
- Form and submission endpoints will eventually return consistent `{ data }` response envelopes.
- Shopify order information maps to a submission record and secure confirmation token on the backend.

## Recommended Next Backend Work

- Add Shopify webhook ingestion and token generation.
- Add submission storage models and detail endpoints.
- Add public confirmation read/write endpoints.
- Add admin filtering, search, and pagination for submission records.
