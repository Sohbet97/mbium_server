# Authentication

**Routes file:** `backend/routes/auth/auth.js`
**Service:** `backend/__modules__/user/services/users.js`
**Models:** `User`, `UserSession`, `UserOtpSession`

All auth endpoints are mounted at `/auth/`.

---

## Token Strategy

Two-token scheme:

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token (JWT) | Short-lived (minutes) | Client memory / Authorization header |
| Refresh token | Long-lived (days) | `UserSession` table + httpOnly cookie or client storage |

The JWT payload includes the user's `id`, `role_id`, `permissions` array, and `assignment_id` (active position assignment).

---

## Auth Flows

### 1. Register
```
POST /auth/register
Body: { name, phone_number | email, password }

→ Creates User with status = NOT_ACTIVATED
→ Sends OTP to phone/email
→ Returns: { otpSessionId }
```

### 2. Verify OTP (activate account or confirm login)
```
POST /auth/verify-otp
Body: { otpSessionId, otp }

→ Validates OTP hash in UserOtpSession
→ If purpose = LOGIN: creates UserSession, returns tokens
→ If purpose = REGISTER: activates user account
```

### 3. Resend OTP
```
POST /auth/resend-otp
Body: { otpSessionId }

→ Replaces existing OtpSession with a fresh one
→ Re-sends OTP code
```

### 4. Login (password)
```
POST /auth/login
Body: { phone_number | email, password }

→ Validates password hash
→ If OTP enabled (Config.is_otp_enabled = true): returns otpSessionId for 2FA step
→ If OTP disabled: creates UserSession immediately, returns tokens
```

### 5. Google OAuth
```
POST /auth/google
Body: { google_id_token }

→ Verifies token with Google
→ Finds or creates User by google_id
→ Creates UserSession, returns tokens
```

### 6. Refresh
```
POST /auth/refresh
Body: { refreshToken }

→ Validates refresh token against UserSession
→ Issues new access token (rotates refresh token)
→ Updates session.last_used
```

### 7. Logout
```
POST /auth/logout    (requires valid access token)

→ Deletes the active UserSession
→ Refresh token invalidated
```

### 8. Change Password
```
POST /auth/change-password    (authenticated)
Body: { currentPassword, newPassword }
```

### 9. Select Assignment
```
POST /auth/select-assignment    (authenticated)
Body: { assignmentId }

→ Used when a user has multiple active position assignments
→ Issues a new access token embedding the selected assignmentId
```

### 10. Session Management
```
GET    /auth/sessions          → List all active sessions for current user
DELETE /auth/sessions/:id      → Terminate a specific session (log out device)
```

### 11. Force Login (admin only)
```
POST /auth/force-login    (requires USER_LOGIN_AS permission = 309)
Body: { userId }

→ Admin impersonates another user
→ Issues tokens for that user without their password
```

---

## OTP Configuration

OTP can be toggled globally via:

```
GET /admin/configurations   → returns { is_otp_enabled: bool, ... }
PUT /admin/configurations   → update config including is_otp_enabled
```

When `is_otp_enabled = false`, login skips the OTP step and issues tokens directly.

---

## Authorization Middleware

**File:** `backend/middlewares/authorization-middleware.js`

Applied to all `/admin/*` routes. Extracts the JWT from the `Authorization: Bearer <token>` header, verifies it, and attaches the user + permissions to `req.user`.

If the token is missing or invalid: `401 Unauthorized`.

---

## Route Guard

**File:** `backend/middlewares/route-guard.js`

Applied inside each module's `index.js`. Checks that `req.user.permissions` includes the required permission ID for the current HTTP method.

```js
routeGuard({ GET: 29, POST: 30, PUT: 31, DELETE: 32 })
```

If the permission is missing: `403 Forbidden`.

---

## Session Model Fields

| Field | Notes |
|-------|-------|
| `device_info` | User-agent string or device label |
| `ip` | IP address at session creation |
| `last_used` | Updated on every token refresh |
| `assignment_id` | The position assignment active in this session |

---

## Security Notes

- Passwords are hashed with **bcryptjs** (salt rounds from `bcrypt.genSalt()`)
- OTP codes are stored as **bcrypt hashes** in `UserOtpSession.otp_hash` — the plain code is never persisted
- Failed login attempts are tracked in `UserLoginFail`; accounts can be blocked until `blocked_till`
- `UserLogin` records every successful login (IP, timestamp, device)
