# Database Schema

## Entity-Relationship Diagram

```
User ──< Listing ──< Booking >── User (guest)
                  ──< Review  >── User (author)
                  ──< Image
Booking ──< Payment
User ──< RefreshToken
```

**Legend:** `──<` means one-to-many. A User has many Listings. A Listing has many Bookings, Reviews, and Images.

## Enums

### Role

| Value | Description |
|---|---|
| `GUEST` | Default role. Can browse, book, and review. |
| `HOST` | Can create and manage listings. |
| `ADMIN` | Full platform access. |

### BookingStatus

| Value | Description |
|---|---|
| `PENDING` | Booking created, awaiting payment. |
| `CONFIRMED` | Payment successful. |
| `CANCELLED` | Cancelled by guest or system. |
| `COMPLETED` | Stay finished (check-out passed). |

### PaymentStatus

| Value | Description |
|---|---|
| `PENDING` | Payment initiated. |
| `SUCCEEDED` | Payment confirmed by Stripe. |
| `FAILED` | Payment failed. |
| `REFUNDED` | Payment refunded. |

## Models

### User

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Unique identifier |
| name | String | required | Display name |
| email | String | unique, required | Login email |
| password | String | required | bcrypt hash |
| image | String? | nullable | Profile image URL |
| phone | String? | nullable | Phone number |
| role | Role | default: GUEST | User role |
| createdAt | DateTime | auto | Account creation time |
| updatedAt | DateTime | auto | Last update time |

**Relations:**
- `listings[]` — Listings created by this user (as HOST)
- `bookings[]` — Bookings made by this user (as GUEST)
- `reviews[]` — Reviews written by this user
- `refreshTokens[]` — Active sessions

---

### RefreshToken

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Token record ID |
| token | String | unique | JWT refresh token string |
| expiresAt | DateTime | required | Expiration timestamp |
| createdAt | DateTime | auto | Creation time |
| userId | String | FK → User | Owner user |

**Indexes:** `@@index([userId])`, `@@index([token])`

**Cascade:** Deleting a User deletes all their RefreshTokens.

---

### Listing

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Unique identifier |
| title | String | required | Listing name |
| description | String | required | Full description |
| category | String | required | hotel, resort, villa, apartment, etc. |
| pricePerNight | Decimal(10,2) | required | Nightly rate |
| currency | String | default: "PHP" | 3-letter currency code |
| location | String | required | City/area |
| address | String | required | Full address |
| latitude | Float? | nullable | GPS latitude |
| longitude | Float? | nullable | GPS longitude |
| maxGuests | Int | required | Maximum guest capacity |
| bedrooms | Int | required | Number of bedrooms |
| bathrooms | Int | required | Number of bathrooms |
| amenities | String[] | required | Array of amenity tags |
| isPublished | Boolean | default: false | Visibility flag |
| createdAt | DateTime | auto | Creation time |
| updatedAt | DateTime | auto | Last update time |
| hostId | String | FK → User | Owner host |

**Indexes:** `@@index([hostId])`, `@@index([category])`, `@@index([location])`

**Relations:**
- `host` — User who owns the listing
- `images[]` — Listing photos
- `bookings[]` — Reservations for this listing
- `reviews[]` — Reviews of this listing

**Cascade:** Deleting a User deletes all their Listings (and cascading Images, Bookings, Reviews).

---

### Image

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Unique identifier |
| url | String | required | Image URL |
| alt | String? | nullable | Alt text for accessibility |
| order | Int | default: 0 | Display order |
| listingId | String | FK → Listing | Parent listing |

**Indexes:** `@@index([listingId])`

---

### Booking

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Unique identifier |
| checkIn | DateTime | required | Check-in date |
| checkOut | DateTime | required | Check-out date |
| totalPrice | Decimal(10,2) | required | Calculated: nights x pricePerNight |
| guestCount | Int | required | Number of guests |
| status | BookingStatus | default: PENDING | Booking state |
| specialNotes | String? | nullable | Guest notes |
| createdAt | DateTime | auto | Creation time |
| updatedAt | DateTime | auto | Last update time |
| guestId | String | FK → User | Guest who booked |
| listingId | String | FK → Listing | Booked listing |

**Indexes:** `@@index([guestId])`, `@@index([listingId])`, `@@index([checkIn, checkOut])`

**Relations:**
- `guest` — User who made the booking
- `listing` — The booked listing
- `payment?` — Optional linked payment

**Date overlap prevention:** The service layer queries for conflicting PENDING/CONFIRMED bookings before creating a new one:

```sql
WHERE listingId = ?
  AND status IN ('PENDING', 'CONFIRMED')
  AND checkIn < ? (requested checkOut)
  AND checkOut > ? (requested checkIn)
```

---

### Payment

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Unique identifier |
| amount | Decimal(10,2) | required | Payment amount |
| currency | String | default: "PHP" | Currency code |
| status | PaymentStatus | default: PENDING | Payment state |
| stripePaymentId | String? | unique, nullable | Stripe payment intent ID |
| stripeSessionId | String? | unique, nullable | Stripe checkout session ID |
| createdAt | DateTime | auto | Creation time |
| bookingId | String | unique, FK → Booking | One payment per booking |

---

### Review

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String | PK, cuid() | Unique identifier |
| rating | Int | required | 1-5 star rating |
| comment | String | required | Review text |
| createdAt | DateTime | auto | Creation time |
| authorId | String | FK → User | Review author |
| listingId | String | FK → Listing | Reviewed listing |

**Constraints:** `@@unique([authorId, listingId])` — one review per user per listing.

**Indexes:** `@@index([listingId])`

## Seed Data

Running `pnpm db:seed` creates a default admin user:

| Field | Value |
|---|---|
| name | Dreamboat Admin |
| email | admin@dreamboat.local |
| password | Dreamboat123! |
| role | ADMIN |
