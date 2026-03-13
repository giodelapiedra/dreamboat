# Authentication & Authorization

## Overview

Dreamboat uses a **dual-token JWT system** with refresh token rotation:

- **Access Token** — short-lived (15 min), sent in `Authorization` header
- **Refresh Token** — long-lived (7 days), stored in httpOnly cookie

## Authentication Flow

### Register

```
Client                              Server
  │                                    │
  │  POST /api/auth/register           │
  │  { name, email, password }         │
  │ ──────────────────────────────►    │
  │                                    │  Hash password (bcrypt, 12 rounds)
  │                                    │  Create User in DB
  │                                    │  Create RefreshToken record in DB
  │                                    │  Sign access token (15m)
  │                                    │  Sign refresh token (7d)
  │    Set-Cookie: refresh_token       │
  │    { accessToken, user }           │
  │ ◄──────────────────────────────    │
  │                                    │
  │  Store accessToken in memory       │
```

### Login

```
Client                              Server
  │                                    │
  │  POST /api/auth/login              │
  │  { email, password }               │
  │ ──────────────────────────────►    │
  │                                    │  Find user by email
  │                                    │  Compare password (bcrypt)
  │                                    │  Issue new session (access + refresh)
  │    Set-Cookie: refresh_token       │
  │    { accessToken, user }           │
  │ ◄──────────────────────────────    │
```

### Token Refresh (Rotation)

```
Client                              Server
  │                                    │
  │  POST /api/auth/refresh            │
  │  Cookie: refresh_token=eyJ...      │
  │ ──────────────────────────────►    │
  │                                    │  Verify refresh token JWT
  │                                    │  Find token record in DB
  │                                    │  DELETE old token from DB
  │                                    │  CREATE new token in DB
  │                                    │  Sign new access + refresh tokens
  │    Set-Cookie: NEW refresh_token   │
  │    { accessToken, user }           │
  │ ◄──────────────────────────────    │
```

Token rotation means each refresh token is **single-use**. After refresh, the old token is deleted from the database. If an attacker reuses a stolen refresh token, it will be rejected because it no longer exists in the DB.

### Logout

```
Client                              Server
  │                                    │
  │  POST /api/auth/logout             │
  │  Cookie: refresh_token=eyJ...      │
  │ ──────────────────────────────►    │
  │                                    │  Delete token from DB
  │    Clear-Cookie: refresh_token     │
  │    204 No Content                  │
  │ ◄──────────────────────────────    │
  │                                    │
  │  Clear accessToken from memory     │
```

## JWT Token Structure

### Access Token Payload

```json
{
  "sub": "clx...",       // User ID
  "email": "user@example.com",
  "role": "GUEST",       // GUEST | HOST | ADMIN
  "iat": 1773295429,     // Issued at
  "exp": 1773296329      // Expires (15 min later)
}
```

Signed with `JWT_ACCESS_SECRET` (min 32 chars).

### Refresh Token Payload

```json
{
  "sub": "clx...",          // User ID
  "tokenId": "clx...",     // RefreshToken record ID in DB
  "iat": 1773295429,
  "exp": 1773900629         // Expires (7 days later)
}
```

Signed with `JWT_REFRESH_SECRET` (separate secret, min 32 chars).

## Refresh Token Cookie

```
Name:     dreamboat_refresh_token
Path:     /api/auth
HttpOnly: true
SameSite: lax
Secure:   true (production only)
```

- `httpOnly` prevents JavaScript from reading the cookie (XSS protection)
- `SameSite: lax` prevents CSRF on state-changing requests
- `Path: /api/auth` limits cookie to auth endpoints only
- `Secure: true` in production ensures HTTPS-only

## Authorization (Role-Based)

Three roles exist: `GUEST`, `HOST`, `ADMIN`.

The `authorize()` middleware checks `req.user.role` against allowed roles:

```typescript
// Only HOST and ADMIN can create listings
router.post("/", authenticate, authorize("HOST", "ADMIN"), ...);

// Only ADMIN can access admin routes
router.use(authenticate, authorize("ADMIN"));
```

### Role Permissions

| Action | GUEST | HOST | ADMIN |
|---|---|---|---|
| Browse/search listings | Yes | Yes | Yes |
| View listing detail | Yes | Yes | Yes |
| Create booking | Yes | Yes | Yes |
| View own bookings | Yes | Yes | Yes |
| Cancel own booking | Yes | Yes | Yes |
| Create listing | No | Yes | Yes |
| Edit own listing | No | Yes | Yes |
| Delete own listing | No | Yes | Yes |
| Edit any listing | No | No | Yes |
| Delete any listing | No | No | Yes |
| View all users | No | No | Yes |
| Change user roles | No | No | Yes |
| View platform stats | No | No | Yes |

## How Auth Middleware Works

```typescript
// 1. authenticate — verifies token and sets req.user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const payload = verifyAccessToken(token);  // throws if invalid
  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
};

// 2. authorize — checks role
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

## Password Requirements

Enforced via Zod schema:

- Minimum 8 characters
- Maximum 128 characters
- Must contain at least 1 uppercase letter (`[A-Z]`)
- Must contain at least 1 lowercase letter (`[a-z]`)
- Must contain at least 1 number (`[0-9]`)

Hashed with bcrypt using 12 salt rounds before storage.
