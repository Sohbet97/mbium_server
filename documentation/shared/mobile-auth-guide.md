# Mobile Auth API Guide

How the mobile app registers, logs in, and stays authenticated.
All endpoints are mounted at both `/auth/*` and `/api/auth/*` — use `/api/auth/*`.

**Routes:** `backend/routes/auth/auth.js` · **Controller:** `backend/__modules__/user/controllers/user-controller.js`

---

## Token model — read this first

| Token | Lifetime | Where it lives | How you use it |
|-------|----------|----------------|----------------|
| Access token (JWT) | 2 hours | Response body `token` | `Authorization: Bearer <token>` on every request |
| Refresh token | 2 days | **httpOnly `refreshToken` cookie only** — never in the body | Sent automatically on `POST /auth/refresh` if your HTTP client keeps cookies |

⚠️ **The refresh token is delivered only as a cookie.** Your HTTP client must persist
cookies across requests and app restarts, or refresh will never work:

- **Flutter (dio):** `dio_cookie_manager` + `cookie_jar` (`PersistCookieJar` backed by app storage)
- **Android (OkHttp):** a persistent `CookieJar`
- **iOS (URLSession):** `HTTPCookieStorage` handles it by default

Keep the access token in memory (or secure storage). When a request returns **401**,
call `POST /auth/refresh` once and retry; if refresh also fails, drop to the login screen.

---

## Flow 1 — Registration (phone + password + SMS OTP)

```
┌─────────┐  1. POST /register   ┌─────────┐
│  App    │ ───────────────────► │ Backend │──► SMS with 6-digit OTP
│         │ ◄─── {session_id} ── │         │
│         │  2. POST /verify-otp │         │
│         │ ───────────────────► │         │
│         │ ◄── {token, user} ── │         │    (+ refreshToken cookie)
└─────────┘                      └─────────┘
```

### 1. `POST /auth/register`

```json
{
  "name": "Merdan",            // required
  "phone_number": "61123456",  // required — 8 digits, TM format: 6[1-5]xxxxxx or 71xxxxxx
  "password": "secret123",     // required — min 8 chars
  "surname": "Berdiyev",       // optional
  "email": "m@example.com",    // optional
  "birth_date": "1998-04-12"   // optional
}
```

**201** → `{ "session_id": "<uuid>" }`
The account is created as NOT_ACTIVATED and a 6-digit OTP is sent by SMS.

**400** if phone/email already belongs to an active account. A phone that was
soft-deleted or never activated is reusable — the stale record is wiped automatically.

### 2. `POST /auth/verify-otp`

```json
{ "session_id": "<uuid>", "otp": "123456" }
```

**200** → `{ "token": "<jwt>", "user": { ... }, "is2FA": false }` + `refreshToken` cookie.
The account is activated and the user is fully logged in — no separate login call needed.

**400** on wrong OTP. Rules: OTP expires after **5 minutes**, **5 wrong attempts**
kill the session (the user must restart the flow).

### 3. `POST /auth/resend-otp` (optional)

```json
{ "session_id": "<uuid>" }
```

**200**, no body. Sends a fresh OTP and resets the 5-minute timer and attempt counter.
Only works while the session still exists — after expiry/lockout, restart the flow.

---

## Flow 2 — Login (phone + password)

### `POST /auth/login`

```json
{ "phone_number": "61123456", "password": "secret123" }
```

Two possible **200** responses — branch on `is2FA`:

```json
// A) 2FA disabled on the server → logged in immediately
{ "token": "<jwt>", "user": { ... }, "is2FA": false }

// B) 2FA enabled → an OTP was sent by SMS, finish with /verify-otp
{ "is2FA": true, "session_id": "<uuid>" }
```

For case B, call `POST /auth/verify-otp` with `session_id` + the OTP, exactly as in
registration. Handle **both** shapes — 2FA is a server-side config toggle.

**Lockout:** 3 wrong passwords blocks the account for 3 minutes (login returns 400
with a generic "invalid phone_number or password" message either way).

---

## Flow 3 — Login with Google

### `POST /auth/google`

```json
{ "id_token": "<google-id-token>" }
```

**200** → `{ "token": "<jwt>", "user": { ... }, "is2FA": false }` + `refreshToken` cookie.
Google login never triggers 2FA.

Server-side behavior: matches by `google_id` first, then by e-mail (links Google to an
existing account), otherwise creates a new active user. New Google users have **no
phone number and no password** — prompt them to set both in the profile screen,
otherwise they can only ever log in with Google.

**Getting the `id_token` on mobile:** use the Google Sign-In SDK and configure it with
the **web** OAuth client ID (the same value as the backend's `GOOGLE_CLIENT_ID`) as
`serverClientId` / `requestIdToken(...)`. Also create Android/iOS OAuth client IDs in
the same Google Cloud project (Android needs the package name + SHA-1), but the
token you send to the API must be minted for the web client ID or verification fails.

```dart
// Flutter — google_sign_in
final googleSignIn = GoogleSignIn(
  serverClientId: 'xxxx.apps.googleusercontent.com', // = backend GOOGLE_CLIENT_ID
);
final account = await googleSignIn.signIn();
final auth = await account!.authentication;
// POST auth.idToken to /api/auth/google
```

---

## Session lifecycle

### `POST /auth/refresh`

No body — the `refreshToken` cookie is what authenticates the call.
**200** → `{ "token": "<jwt>", "user": { ... } }` + a **rotated** `refreshToken` cookie
(the old one is invalidated; make sure the client saves the new cookie).
**401** → refresh token missing/expired → force re-login.

### `POST /auth/logout` 🔒

Invalidates the server-side session and clears the cookie. Call it before wiping local
state so the session doesn't linger in the user's active-sessions list.

### `GET /auth/sessions` 🔒 / `DELETE /auth/sessions/:id` 🔒

List / revoke the user's active sessions (device info + IP) — for a "logged-in devices"
screen.

---

## Profile & account 🔒 (all require `Authorization: Bearer <token>`)

| Endpoint | Body / notes |
|----------|--------------|
| `GET /auth/me` | → `{ model: { ...user, shop, shops } }` |
| `PATCH /auth/me` | Partial update of own profile fields |
| `POST /auth/me/avatar` | `multipart/form-data`, field `avatar` → `{ thumbnail }` |
| `POST /auth/change-password` | `{ old_password, password }` |
| `DELETE /auth/me/google` | Unlink Google. 400 if the user has no password set |

## Push notifications 🔒

| Endpoint | Body |
|----------|------|
| `PATCH /auth/me/device-token` | `{ "token": "<fcm-token>" }` — call after login and on FCM token refresh; server keeps the 5 newest per user |
| `DELETE /auth/me/device-token` | `{ "token": "<fcm-token>" }` — call on logout |

## Shop application (mobile → web hand-off) 🔒

Shop creation happens in the web panel. Mobile requests a one-time deep link:

```
POST /auth/web-token   → { "url": "https://<web>/apply?token=<one-time-jwt>" }
```

Open the URL in the browser; the token is valid for **10 minutes** and the web panel
exchanges it for its own session. `GET /auth/me/shop` returns the application status.

---

## Error format

Errors come from the shared error middleware as `{ "message": "..." }` with an
appropriate HTTP status (400 validation/bad credentials, 401 unauthenticated,
404 not found). Show `message` or map by status code.
