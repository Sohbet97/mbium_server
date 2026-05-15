# User Module

Manages platform users, roles, positions, and staff assignments. This is also the module that owns the authentication system — see [shared/authentication.md](../shared/authentication.md) for auth flows.

**Location:** `backend/__modules__/user/`

---

## Models

### User
**Table:** `users`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | UUID | yes | UUIDV4 | Primary key |
| name | STRING(100) | yes | "User" | First name |
| surname | STRING(100) | no | — | Last name |
| birth_date | DATEONLY | no | — | |
| phone_number | STRING(8) | no | — | Unique. TM format: `6[1-5]XXXXXX` or `71XXXXXX` |
| email | STRING(100) | no | — | Unique |
| password | STRING(255) | no | — | bcrypt hash |
| google_id | STRING(100) | no | — | Unique. Set on Google OAuth login |
| status | SMALLINT | yes | STATUS_NOT_ACTIVATED | See statuses below |
| role_id | INTEGER | no | — | FK → roles.id, SET NULL on delete |
| last_login_date | DATE | no | — | Updated on each login |
| last_login_ip | STRING(100) | no | — | |
| blocked_till | DATE | no | — | Account unlock happens automatically after this date |

Timestamps: `createdAt`, `updatedAt`, `deletedAt` (paranoid)

**Associations:**
- `belongsTo Role` (as `_role`)
- `hasMany UserSession` (as `sessions`)
- `hasMany UserLogin` (as `last_logins`)
- `hasMany UserLoginFail` (as `login_fails`)
- `hasMany UserNote` (as `notes`)
- `hasMany UserOtpSession` (as `otp_sessions`)
- `hasMany UserPositionAssignment` (as `position_assignments`)

---

### Role
**Table:** `roles`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| name | STRING(255) | yes | — | Role display name |
| permissions | ARRAY(INTEGER) | yes | [] | List of permission IDs. See [permissions.md](../shared/permissions.md) |
| modules | ARRAY(INTEGER) | yes | [] | Module visibility flags for the frontend |
| start_page | INTEGER | no | 0 | Default page after login |
| order | SMALLINT | no | — | Display order |
| status | SMALLINT | yes | STATUSE_ACTIVE | |
| createdBy | UUID | no | — | FK → users.id |

Timestamps + paranoid.

**Associations:**
- `hasMany User` (as `users`)

---

### UserPosition
**Table:** `positions`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| name | STRING(100) | yes | — | e.g., "Sales Manager" |
| role_id | INTEGER | no | — | FK → roles.id |
| seats | SMALLINT | yes | 1 | Max concurrent assignments |
| room | STRING(100) | no | — | Physical location label |
| type | SMALLINT | no | — | Position category |
| order | SMALLINT | no | — | |
| status | SMALLINT | yes | STATUSE_ACTIVE | |
| createdBy | UUID | yes | — | FK → users.id |

Timestamps + paranoid.

---

### UserPositionAssignment
**Table:** `user_position_assignments`

Links a user to a position with time-scoped activation.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| user_id | UUID | yes | — | FK → users.id |
| position_id | INTEGER | yes | — | FK → positions.id |
| assignment_type | STRING | yes | — | `PRIMARY` or `TEMPORARY` |
| replaced_assignment_id | INTEGER | no | — | Points to the assignment being temporarily replaced |
| started_at | DATE | no | — | |
| ended_at | DATE | no | — | NULL = still active |
| is_active | BOOLEAN | yes | — | |

---

### UserSession
**Table:** `user_sessions`

One row per active device/browser session.

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | |
| user_id | UUID | FK → users.id |
| assignment_id | INTEGER | The assignment active during this session |
| refresh_token | STRING | Stored securely; used to issue new access tokens |
| device_info | STRING | User-agent or device label |
| ip | STRING | Client IP at session creation |
| last_used | DATE | Updated on each token refresh |

---

### UserOtpSession
**Table:** `user_otp_sessions`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| user_id | UUID | FK → users.id |
| otp_hash | STRING | bcrypt hash of the OTP code |
| purpose | STRING | `LOGIN`, or other purposes |
| expires_at | DATE | OTP expires after this timestamp |
| attempts | INTEGER | Failed attempt counter |

---

## API Endpoints

### User Management — `POST /admin` base, guarded by `authorizationMiddleware`

| Method | Path | Controller | Permission |
|--------|------|------------|------------|
| GET | `/admin/users` | UserController.get | USER_GET (5) |
| GET | `/admin/users/:id` | UserController.getById | USER_GET (5) |
| POST | `/admin/users` | UserController.create | USER_POST (6) |
| PUT | `/admin/users/:id` | UserController.update | USER_PUT (7) |
| PUT | `/admin/users/:id/unlock` | UserController.unlockUser | USER_PUT (7) |
| DELETE | `/admin/users/:id` | UserController.delete | USER_DELETE (8) |
| DELETE | `/admin/users/:id/force` | UserController.forceDelete | USER_DELETE (8) |

### Role Management

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/roles` | ROLE_GET (1) |
| GET | `/admin/roles/:id` | ROLE_GET (1) |
| POST | `/admin/roles` | ROLE_POST (2) |
| PUT | `/admin/roles/:id` | ROLE_PUT (3) |
| DELETE | `/admin/roles/:id` | ROLE_DELETE (4) |
| DELETE | `/admin/roles/:id/force` | ROLE_DELETE (4) |

### Position Management

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/positions` | USER_POSITION_GET (9) |
| GET | `/admin/positions/:id` | USER_POSITION_GET (9) |
| POST | `/admin/positions` | USER_POSITION_POST (10) |
| PUT | `/admin/positions/:id` | USER_POSITION_PUT (11) |
| PATCH | `/admin/positions/:id/restore` | USER_POSITION_PUT (11) |
| DELETE | `/admin/positions/:id` | USER_POSITION_DELETE (12) |
| DELETE | `/admin/positions/:id/force` | USER_POSITION_DELETE (12) |

### Position Assignments

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/position-assignments` | USER_POSITION_GET (9) |
| GET | `/admin/position-assignments/:id` | USER_POSITION_GET (9) |
| POST | `/admin/position-assignments` | USER_POSITION_POST (10) |
| PUT | `/admin/position-assignments/:id` | USER_POSITION_PUT (11) |
| PATCH | `/admin/position-assignments/:id/restore` | USER_POSITION_PUT (11) |
| DELETE | `/admin/position-assignments/:id` | USER_POSITION_DELETE (12) |

---

## Query Parameters (GET /)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 20, 0 = all) |
| `sort` | string | Field name, prefix `-` for DESC (e.g., `-createdAt`) |
| `paranoid` | any | If present, includes soft-deleted records |

---

## Business Rules

- **Phone format:** Turkmenistan numbers — must match `6[1-5]\d{6}` or `71\d{6}` (8-digit local format)
- **Blocking:** A user can be blocked until `blocked_till`. The `unlockUser` endpoint clears this field.
- **Soft delete:** `DELETE /users/:id` sets `deletedAt`. `DELETE /users/:id/force` permanently removes the record.
- **Role → Permissions:** When a user authenticates, their role's `permissions` array is used for all route guards throughout the session.
- **Position assignments:** A user must `POST /auth/select-assignment` after login if they hold multiple positions. The selected assignment is embedded in the JWT.

---

## Relationships

- User `belongs to` Role
- User `has many` UserPositionAssignment
- UserPositionAssignment `belongs to` UserPosition
- UserPosition `belongs to` Role
- Shop `belongs to` User (as owner)
- Order `belongs to` User (as customer)
- Review `belongs to` User (as author)

---

## Roadmap

- Shop-scoped roles: a user should be able to hold different roles in different shops
- TOTP / authenticator-app 2FA (beyond SMS OTP)
- Permission delegation between roles
- User suspension workflow with reason tracking
