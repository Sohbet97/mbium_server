# Payouts Module

Tracks seller earnings and withdrawal requests. Two resources: a per-shop running balance (`SellerBalance`) and individual payout requests (`PayoutRequest`).

**Location:** `backend/__modules__/payouts/`

---

## Models

### SellerBalance
**Table:** `seller_balances`

One row per shop — created automatically on first credit/debit.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| shop_id | INTEGER | yes | — | FK → shops.id, RESTRICT on delete; UNIQUE |
| balance | DECIMAL(12,2) | yes | 0.00 | Running balance in seller's favour |
| currency | STRING(10) | yes | "TMT" | |

Timestamps, no paranoid.

**Associations:**
- `belongsTo Shop` (as `shop`)

---

### PayoutRequest
**Table:** `payout_requests`

A seller's request to withdraw funds from their balance.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| shop_id | INTEGER | yes | — | FK → shops.id, RESTRICT on delete |
| amount | DECIMAL(12,2) | yes | — | Requested withdrawal amount |
| currency | STRING(10) | yes | "TMT" | |
| status | STRING(30) | yes | "PENDING" | See state machine below |
| bank_details | TEXT | no | — | Banking information for the transfer |
| notes | TEXT | no | — | Admin notes |
| requested_by | UUID | no | — | FK → users.id, SET NULL |
| processed_at | DATE | no | — | Set when status → PROCESSED |
| processed_by | UUID | no | — | FK → users.id, SET NULL |

Timestamps + paranoid.

**Indexes:** `shop_id`, `status`, `requested_by`

**Associations:**
- `belongsTo Shop` (as `shop`)
- `belongsTo User` (as `requester`, FK: `requested_by`)
- `belongsTo User` (as `processor`, FK: `processed_by`)

---

### PayoutRequest Status State Machine

```
PENDING
   │
   ├──► APPROVED
   │        │
   │        ▼
   │    PROCESSED  ← debits seller_balances.balance
   │
   └──► REJECTED
```

| Status | Description |
|--------|-------------|
| `PENDING` | Request submitted, awaiting admin review |
| `APPROVED` | Admin approved; awaiting bank transfer |
| `PROCESSED` | Transfer completed; seller balance debited |
| `REJECTED` | Request denied |

---

## API Endpoints

### Seller Balances — `/admin/payouts/balances`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/payouts/balances` | List all seller balances | PAYOUT_GET (53) |
| GET | `/admin/payouts/balances/:shopId` | Get balance for a specific shop | PAYOUT_GET (53) |

### Payout Requests — `/admin/payouts/requests`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/payouts/requests` | List requests | PAYOUT_GET (53) |
| GET | `/admin/payouts/requests/:id` | Get single request | PAYOUT_GET (53) |
| POST | `/admin/payouts/requests` | Create withdrawal request | PAYOUT_POST (54) |
| PATCH | `/admin/payouts/requests/:id/status` | Update request status | PAYOUT_PUT (55) |
| DELETE | `/admin/payouts/requests/:id` | Soft delete | PAYOUT_DELETE (56) |
| DELETE | `/admin/payouts/requests/:id/force` | Hard delete | PAYOUT_DELETE (56) |
| POST | `/admin/payouts/requests/:id/restore` | Restore soft-deleted | PAYOUT_POST (54) |

---

## Query Parameters (GET /admin/payouts/requests)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `shop_id` | number | Filter by shop |
| `status` | string | Filter by status (PENDING / APPROVED / REJECTED / PROCESSED) |
| `paranoid` | any | Include soft-deleted records |

---

## Business Rules

- **`SellerBalance` is managed by the system** — never created or updated directly via API. It is created automatically by `findOrCreate` on first credit/debit operation.
- **`requested_by`** is set from the authenticated user (`req.user.id`) on create — not from the request body.
- **`processed_by` and `processed_at`** are set automatically when status transitions to `PROCESSED`.
- **Balance debit on PROCESSED** — when a request reaches `PROCESSED`, `seller_balances.balance` is decremented by `amount`. The service does not enforce sufficient-balance checks yet (future task: add balance guard before approval).
- **Balance credit** — the `PayoutService.creditBalance()` method exists but is not yet wired to automatic triggers. It will be called by the commission engine when an order transitions to `CLOSED`.

---

## Roadmap

- Auto-credit `seller_balances` when an order transitions to `CLOSED` (commission engine task — see `documentation/development/roadmap.md` item 10)
- Enforce sufficient balance before `APPROVED` transition
- Per-shop minimum withdrawal threshold config
- Payout history report endpoint
