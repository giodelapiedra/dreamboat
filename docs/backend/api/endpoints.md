# API Endpoints Reference

**Base URL:** `http://localhost:3000/api`

## Endpoint Summary

| # | Method | Endpoint | Auth | Role | Status |
|---|---|---|---|---|---|
| 1 | GET | `/api/health` | - | - | Implemented |
| 2 | POST | `/api/auth/register` | - | - | Implemented |
| 3 | POST | `/api/auth/login` | - | - | Implemented |
| 4 | POST | `/api/auth/refresh` | - | - | Implemented |
| 5 | POST | `/api/auth/logout` | - | - | Implemented |
| 6 | GET | `/api/auth/me` | Bearer | Any | Implemented |
| 7 | POST | `/api/auth/forgot-password` | - | - | Stub (501) |
| 8 | POST | `/api/auth/reset-password` | - | - | Stub (501) |
| 9 | GET | `/api/listings` | - | - | Implemented |
| 10 | GET | `/api/listings/:id` | - | - | Implemented |
| 11 | GET | `/api/listings/:id/availability` | - | - | Implemented |
| 12 | POST | `/api/listings` | Bearer | HOST, ADMIN | Implemented |
| 13 | PATCH | `/api/listings/:id` | Bearer | HOST, ADMIN | Implemented |
| 14 | DELETE | `/api/listings/:id` | Bearer | HOST, ADMIN | Implemented |
| 15 | GET | `/api/bookings` | Bearer | Any | Implemented |
| 16 | GET | `/api/bookings/:id` | Bearer | Owner | Implemented |
| 17 | POST | `/api/bookings` | Bearer | Any | Implemented |
| 18 | PATCH | `/api/bookings/:id/cancel` | Bearer | Owner | Implemented |
| 19 | GET | `/api/listings/:id/reviews` | - | - | Stub (501) |
| 20 | POST | `/api/listings/:id/reviews` | Bearer | Any | Stub (501) |
| 21 | POST | `/api/payments/checkout` | Bearer | Any | Stub (501) |
| 22 | POST | `/api/payments/webhook` | - | - | Stub (501) |
| 23 | POST | `/api/upload` | Bearer | Any | Stub (501) |
| 24 | GET | `/api/admin/users` | Bearer | ADMIN | Stub (501) |
| 25 | PATCH | `/api/admin/users/:id/role` | Bearer | ADMIN | Stub (501) |
| 26 | GET | `/api/admin/stats` | Bearer | ADMIN | Stub (501) |

---

## Response Shapes

### Success (single resource)

```json
{
  "data": { ... }
}
```

### Success (collection with pagination)

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error

```json
{
  "error": "Validation failed",
  "message": "One or more request fields are invalid",
  "issues": {
    "email": ["Invalid email format"]
  }
}
```

### HTTP Status Codes Used

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (register, create) |
| 204 | No Content | Successful DELETE, logout |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Wrong role for the endpoint |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email, date overlap |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors |
| 501 | Not Implemented | Stub endpoints (reserved for later) |

---

## Detailed Endpoint Documentation

### Health

#### `GET /api/health`

Returns API status.

**Response 200:**

```json
{
  "data": {
    "name": "dreamboat-api",
    "status": "ok",
    "timestamp": "2026-03-12T06:00:00.000Z"
  }
}
```

---

### Auth

#### `POST /api/auth/register`

Create a new user account. Rate limited (20 req/15min).

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPass123",
  "role": "GUEST"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| name | string | Yes | 2-100 chars, trimmed |
| email | string | Yes | Valid email |
| password | string | Yes | 8-128 chars, must have uppercase + lowercase + number |
| role | string | No | `"GUEST"` (default) or `"HOST"` |

**Response 201:**

```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "user": {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@example.com",
      "image": null,
      "phone": null,
      "role": "GUEST",
      "createdAt": "2026-03-12T06:00:00.000Z",
      "updatedAt": "2026-03-12T06:00:00.000Z"
    }
  }
}
```

Refresh token is set as an httpOnly cookie (`dreamboat_refresh_token`).

**Error 409:** Email already in use.

---

#### `POST /api/auth/login`

Authenticate with email/password. Rate limited (20 req/15min).

**Request body:**

```json
{
  "email": "john@example.com",
  "password": "MyPass123"
}
```

**Response 200:** Same shape as register.

**Error 401:** Invalid email or password.

---

#### `POST /api/auth/refresh`

Rotate refresh token and get new access token. Reads refresh token from cookie.

**No request body required.** Cookie `dreamboat_refresh_token` must be present.

**Response 200:**

```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "user": { ... }
  }
}
```

New refresh token is set as cookie. Old one is deleted from DB (rotation).

**Error 401:** Invalid or missing refresh token.

---

#### `POST /api/auth/logout`

Invalidate refresh token and clear cookie.

**No request body required.**

**Response 204:** No content.

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**

```json
{
  "data": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "image": null,
    "phone": null,
    "role": "GUEST",
    "createdAt": "2026-03-12T06:00:00.000Z",
    "updatedAt": "2026-03-12T06:00:00.000Z"
  }
}
```

---

### Listings

#### `GET /api/listings`

Browse all published listings with search, filter, sort, and pagination.

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| page | number | 1 | Page number |
| limit | number | 12 | Items per page (max 50) |
| search | string | - | Search in title, description, location |
| category | string | - | Filter by category |
| location | string | - | Filter by location (partial match) |
| sort | string | `"newest"` | `"newest"`, `"price_asc"`, `"price_desc"` |
| minPrice | number | - | Minimum price per night |
| maxPrice | number | - | Maximum price per night |
| guestCount | number | - | Minimum guest capacity |
| amenities | string | - | Comma-separated list (e.g. `"wifi,pool"`) |
| checkIn | string | - | ISO datetime — exclude booked listings |
| checkOut | string | - | ISO datetime — exclude booked listings |

**Response 200:**

```json
{
  "data": [
    {
      "id": "clx...",
      "title": "Beachfront Villa",
      "description": "...",
      "category": "villa",
      "pricePerNight": "5000.00",
      "currency": "PHP",
      "location": "Boracay",
      "address": "...",
      "latitude": null,
      "longitude": null,
      "maxGuests": 6,
      "bedrooms": 3,
      "bathrooms": 2,
      "amenities": ["wifi", "pool"],
      "isPublished": true,
      "createdAt": "...",
      "updatedAt": "...",
      "hostId": "clx...",
      "host": { "id": "...", "name": "...", "image": null },
      "images": [{ "id": "...", "url": "...", "alt": null, "order": 0 }],
      "averageRating": 4.5,
      "reviewCount": 12
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 50, "totalPages": 5 }
}
```

---

#### `GET /api/listings/:id`

Get a single listing with full details, images, host info, and reviews.

**Response 200:** Single listing object with nested `reviews[]` (includes author info) and computed `averageRating`.

**Error 404:** Listing not found or unpublished.

---

#### `GET /api/listings/:id/availability`

Get booked date ranges for a listing (for calendar display).

**Response 200:**

```json
{
  "data": [
    {
      "id": "clx...",
      "checkIn": "2026-03-15T00:00:00.000Z",
      "checkOut": "2026-03-18T00:00:00.000Z",
      "status": "CONFIRMED"
    }
  ]
}
```

---

#### `POST /api/listings`

Create a new listing. Requires HOST or ADMIN role.

**Headers:** `Authorization: Bearer <accessToken>`

**Request body:**

```json
{
  "title": "Beachfront Villa",
  "description": "A beautiful villa by the beach...",
  "category": "villa",
  "pricePerNight": 5000,
  "currency": "PHP",
  "location": "Boracay",
  "address": "123 Beach Road, Boracay Island",
  "maxGuests": 6,
  "bedrooms": 3,
  "bathrooms": 2,
  "amenities": ["wifi", "pool", "parking"],
  "isPublished": true,
  "images": [
    { "url": "https://...", "alt": "Front view", "order": 0 }
  ]
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| title | string | Yes | 3-120 chars |
| description | string | Yes | 20-3000 chars |
| category | string | Yes | 2-60 chars |
| pricePerNight | number | Yes | Positive |
| currency | string | No | 3 chars, default `"PHP"` |
| location | string | Yes | 2-120 chars |
| address | string | Yes | 5-200 chars |
| latitude | number | No | -90 to 90 |
| longitude | number | No | -180 to 180 |
| maxGuests | number | Yes | Positive integer |
| bedrooms | number | Yes | Non-negative integer |
| bathrooms | number | Yes | Positive integer |
| amenities | string[] | Yes | Max 20 items |
| isPublished | boolean | No | Default `false` |
| images | object[] | No | Max 10, each has `url`, optional `alt`/`order` |

**Response 201:** Created listing object.

---

#### `PATCH /api/listings/:id`

Update a listing. Only the owner HOST or ADMIN can update.

**Headers:** `Authorization: Bearer <accessToken>`

**Request body:** Any subset of the create fields (all optional).

**Response 200:** Updated listing object.

**Error 403:** Not the owner.

---

#### `DELETE /api/listings/:id`

Delete a listing. Only the owner HOST or ADMIN can delete.

**Headers:** `Authorization: Bearer <accessToken>`

**Response 204:** No content.

**Error 403:** Not the owner.

---

### Bookings

All booking endpoints require authentication.

#### `GET /api/bookings`

Get the authenticated user's bookings.

**Response 200:**

```json
{
  "data": [
    {
      "id": "clx...",
      "checkIn": "2026-03-15T00:00:00.000Z",
      "checkOut": "2026-03-18T00:00:00.000Z",
      "totalPrice": "15000.00",
      "guestCount": 2,
      "status": "PENDING",
      "specialNotes": null,
      "createdAt": "...",
      "updatedAt": "...",
      "listing": {
        "id": "...",
        "title": "Beachfront Villa",
        "location": "Boracay",
        "images": [{ ... }]
      }
    }
  ]
}
```

---

#### `GET /api/bookings/:id`

Get a single booking. Only the booking owner can view.

**Response 200:** Full booking with listing details and images.

**Error 403:** Not the booking owner.

---

#### `POST /api/bookings`

Create a new booking. Server validates:
- Check-in is in the future
- Check-out is after check-in
- Guest count does not exceed listing capacity
- No date overlap with existing PENDING/CONFIRMED bookings

**Request body:**

```json
{
  "listingId": "clx...",
  "checkIn": "2026-03-15T00:00:00.000Z",
  "checkOut": "2026-03-18T00:00:00.000Z",
  "guestCount": 2,
  "specialNotes": "Late check-in"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| listingId | string | Yes | Valid CUID |
| checkIn | string | Yes | ISO datetime, must be future |
| checkOut | string | Yes | ISO datetime, must be after checkIn |
| guestCount | number | Yes | Positive integer, <= listing maxGuests |
| specialNotes | string | No | Max 500 chars |

**Response 201:** Created booking with listing info. Total price auto-calculated (nights x pricePerNight).

**Error 409:** Date overlap — selected dates not available.

---

#### `PATCH /api/bookings/:id/cancel`

Cancel a booking. Only the booking owner can cancel.

**Response 200:** Updated booking with `status: "CANCELLED"`.

**Error 400:** Booking already cancelled.

---

### Stub Endpoints (501 Not Implemented)

These endpoints exist in the router but return `501 Not Implemented`. They are reserved for future phases:

| Endpoint | Future Purpose |
|---|---|
| `POST /api/auth/forgot-password` | Send password reset email |
| `POST /api/auth/reset-password` | Reset password with email token |
| `GET /api/listings/:id/reviews` | List reviews for a listing |
| `POST /api/listings/:id/reviews` | Create a review (after completed booking) |
| `POST /api/payments/checkout` | Create Stripe Checkout session |
| `POST /api/payments/webhook` | Handle Stripe webhook events |
| `POST /api/upload` | Upload images (Supabase Storage) |
| `GET /api/admin/users` | List all users |
| `PATCH /api/admin/users/:id/role` | Change user role |
| `GET /api/admin/stats` | Platform-wide statistics |
