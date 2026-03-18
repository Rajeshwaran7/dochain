# JWT Authentication in Dochain

This document describes how JWT authentication is implemented and how to use it.

## Overview

The API uses **JWT (JSON Web Tokens)** for authentication:

- **Access token**: Short-lived, sent as `Authorization: Bearer <token>` on API requests.
- **Refresh token**: Long-lived, used to obtain a new access token when it expires.

## Backend (NestJS API)

### 1. Environment variables

Ensure these are set in `.env` or `.env.local`:

```env
JWT_SECRET=R4+6bUUHhMWZTYVY0hmHg+e+06foaiXmhXMSvUYHKZE=
JWT_REFRESH_SECRET=yf7ADHT31bxxChdNqb9EcNEdfUldpQTY0YgCRfBM/y4=
JWT_REFRESH_EXPIRY=30d
```

Use strong, random values in production (e.g. `openssl rand -base64 32`).

### 2. How it works

- **Login** (`POST /api/v1/auth/login`) and **Register** (`POST /api/v1/auth/register`) return:
  - `user`: sanitized user object
  - `accessToken`: JWT to send in `Authorization: Bearer <accessToken>`
  - `refreshToken`: use with `POST /api/v1/auth/refresh` to get new tokens

- **Protected routes** use `JwtAuthGuard`. The guard:
  - Reads `Authorization: Bearer <token>` header
  - Verifies the JWT with `JWT_SECRET`
  - Attaches the user to `req.user`

- **Refresh** (`POST /api/v1/auth/refresh` body: `{ "refreshToken": "<refresh_token>" }`):
  - Verifies the refresh token with `JWT_REFRESH_SECRET`
  - Returns new `accessToken` and `refreshToken`

### 3. Applying JWT to routes

- Controllers that require authentication use:
  - `@UseGuards(JwtAuthGuard)` on the controller or method
  - `@ApiBearerAuth()` for Swagger

Example:

```ts
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Get('me')
getProfile(@Request() req) {
  return this.authService.getProfile(req.user.id);
}
```

### 4. Key files

- `apps/api/src/auth/strategies/jwt.strategy.ts` – validates JWT and loads user
- `apps/api/src/common/guards/jwt-auth.guard.ts` – guard that uses the JWT strategy
- `apps/api/src/auth/auth.module.ts` – registers `JwtModule` with `JWT_SECRET` and `JWT_REFRESH_SECRET`

## Frontend (Patient / Doctor apps)

### 1. Storing tokens

- **Patient app**: `localStorage`: `dochain_token` (access), `dochain_refresh` (refresh). Cookie `dochain_auth=1` for middleware.
- **Doctor app**: `localStorage`: `dochain_doctor_token`, `dochain_doctor_refresh`. Cookie `dochain_doctor_auth=1` for middleware.

### 2. Sending the token

- `api` (axios) uses a request interceptor to add:
  - `Authorization: Bearer <accessToken>` from localStorage on every request.

### 3. Refreshing on 401

- Response interceptor: on 401 (except for login/register), it calls `POST /auth/refresh` with the refresh token, saves new tokens, and retries the request. If refresh fails, it clears auth and redirects to login.

### 4. Route protection

- **Middleware** (`apps/web-patient/src/middleware.ts` and `apps/web-doctor/src/middleware.ts`):
  - Protects `/dashboard`, `/appointments`, `/profile` (and doctor `/settings`) by checking the auth cookie. If missing, redirects to `/auth/login`.
  - If the user is logged in (cookie set) and visits `/auth/login` or `/auth/register`, redirects to `/dashboard`.

- **Pages**: Protected pages also check `isAuthenticated` from the auth store and redirect to login if not authenticated (handles the case before the cookie is set after login).

## Steps to ensure JWT is working end-to-end

1. **Set secrets** in API `.env`: `JWT_SECRET`, `JWT_REFRESH_SECRET`, and optionally `JWT_REFRESH_EXPIRY`.
2. **Use HTTPS in production** so the Bearer token is not sent in clear text.
3. **Ensure all protected API routes** use `@UseGuards(JwtAuthGuard)` (and optionally `RolesGuard`).
4. **Frontend**: After login/register, store both `accessToken` and `refreshToken` and set the auth cookie so middleware can redirect correctly.
5. **Frontend**: Use the axios instance that attaches the Bearer token and handles 401 refresh; do not call protected endpoints without it.
6. **Logout**: Clear tokens and the auth cookie and redirect to login.

## Optional: moving token to httpOnly cookie

For stronger security you can:

- Set the access token in an **httpOnly cookie** from the API (e.g. on login/refresh).
- Configure the API to read the token from the cookie (e.g. with a custom Passport strategy or cookie parser) instead of (or in addition to) the `Authorization` header.
- Keep the refresh token in an httpOnly cookie or in memory only; do not expose it to client JavaScript. The middleware would then rely on the presence of that cookie for route protection instead of a non-httpOnly flag cookie.

The current setup uses a non-httpOnly cookie only as a “signed in” flag for middleware; the actual JWT is in localStorage and sent in the `Authorization` header.
