# Orders Module

Manages the full order lifecycle: shopping cart, order creation, status transitions, payment transactions, and audit history.

**Location:** `backend/__modules__/orders/`

---

## Models

### Order
**Table:** `orders`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| user_id | UUID | yes | — | FK → users.id, RESTRICT on delete |
| shop_id | INTEGER | yes | — | FK → shops.id, RESTRICT on delete |
| status | SMALLINT | yes | 0 (PENDING) | See state machine below |
| total_price | DECIMAL(12,2) | yes | — | Immutable after creation |
| currency | STRING(10) | yes | "TMT" | |
| delivery_address | TEXT | no | — | Free-text. Structured address model planned |
| note | TEXT | no | — | Buyer note |

Timestamps + paranoid.

**Indexes:** `user_id`, `shop_id`, `status`, `createdAt`

**Associations:**
- `belongsTo User` (as `customer`)
- `belongsTo Shop` (as `shop`)
- `hasMany OrderItem` (as `items`)
- `hasMany OrderStatusHistory` (as `status_history`)
- `hasMany PaymentTransaction` (as `payments`)

---

### Order Status State Machine

```
PENDING (0)
    │
    ├──► CONFIRMED (1)
    │         │
    │         ▼
    │    PROCESSING (2)
    │         │
    │         ▼
    │      SHIPPED (3)
    │         │
    │         ▼
    │    DELIVERED (4)
    │         │
    │         ▼
    │       CLOSED (5)
    │
    ├──► CANCELLED (10)  ← from PENDING or CONFIRMED
    └──► REFUNDED (11)   ← from DELIVERED or CLOSED
```

Status codes:

| Code | Name | Description |
|------|------|-------------|
| 0 | PENDING | Order placed, awaiting confirmation |
| 1 | CONFIRMED | Shop confirmed the order |
| 2 | PROCESSING | Being prepared |
| 3 | SHIPPED | In transit |
| 4 | DELIVERED | Received by buyer |
| 5 | CLOSED | Finalized; signals payout release to seller |
| 10 | CANCELLED | Cancelled before shipping |
| 11 | REFUNDED | Refund issued |

---

### OrderItem
**Table:** `order_items`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | yes | |
| order_id | INTEGER | yes | FK → orders.id, CASCADE |
| product_id | INTEGER | yes | FK → products.id, RESTRICT |
| variant_id | INTEGER | no | FK → product_variants.id, SET NULL |
| product_name | STRING(500) | yes | Snapshot at purchase time (product name may change later) |
| quantity | INTEGER | yes | |
| unit_price | DECIMAL(12,2) | yes | Snapshot at purchase time |
| total_price | DECIMAL(12,2) | yes | `quantity × unit_price` |

Timestamps (no paranoid).

**Indexes:** `order_id`, `product_id`

---

### OrderStatusHistory
**Table:** `order_status_histories`

Immutable audit trail — one row per status change.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | yes | |
| order_id | INTEGER | yes | FK → orders.id, CASCADE |
| status | SMALLINT | yes | New status value |
| note | TEXT | no | Admin comment |
| changed_by | UUID | no | FK → users.id, SET NULL |

Timestamps (no paranoid — never deleted).

**Indexes:** `order_id`

---

### PaymentTransaction
**Table:** `payment_transactions`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| order_id | INTEGER | yes | — | FK → orders.id, RESTRICT |
| amount | DECIMAL(12,2) | yes | — | |
| currency | STRING(10) | yes | "TMT" | |
| method | STRING(30) | yes | "CASH" | `CASH`, `CARD`, `BANK_TRANSFER` |
| status | SMALLINT | yes | 0 (PENDING) | 0=PENDING, 1=SUCCESS, 2=FAILED, 3=REFUNDED |
| external_id | STRING(255) | no | — | Payment gateway transaction ID |
| paid_at | DATE | no | — | Set when status → SUCCESS |

Timestamps (no paranoid).

**Indexes:** `order_id`, `status`

---

### Shipment
**Table:** `shipments`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| order_id | INTEGER | yes | — | FK → orders.id, CASCADE |
| carrier | STRING(100) | no | — | e.g., "DHL", "Türkmenpoçta" |
| tracking_number | STRING(100) | no | — | Carrier tracking code |
| status | STRING(30) | yes | "PENDING" | See statuses below |
| shipped_at | DATE | no | — | When dispatched |
| delivered_at | DATE | no | — | When received by buyer |
| notes | TEXT | no | — | Internal notes |

Timestamps (no paranoid — shipment history is immutable).

**Indexes:** `order_id`, `status`, `tracking_number`

**Shipment statuses:**

| Value | Description |
|-------|-------------|
| `PENDING` | Created but not yet dispatched |
| `IN_TRANSIT` | Picked up by carrier |
| `DELIVERED` | Delivered to buyer |
| `RETURNED` | Returned to sender |

**Associations:**
- `belongsTo Order` (as `order`)

---

### CartItem
**Table:** `cart_items`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| user_id | UUID | yes | — | FK → users.id, CASCADE |
| product_id | INTEGER | yes | — | FK → products.id, CASCADE |
| variant_id | INTEGER | no | — | FK → product_variants.id, SET NULL |
| quantity | INTEGER | yes | 1 | |

Timestamps.

**Indexes:** `user_id`, unique(`user_id`, `product_id`, `variant_id`)

---

## API Endpoints

### Orders — `/admin/orders`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/orders` | List orders | ORDER_GET (33) |
| GET | `/admin/orders/:id` | Get order with items | ORDER_GET (33) |
| POST | `/admin/orders` | Create order | ORDER_POST (34) |
| PATCH | `/admin/orders/:id/status` | Update order status | ORDER_PUT (35) |
| POST | `/admin/orders/:id/payments` | Add payment transaction | ORDER_POST (34) |
| GET | `/admin/orders/:id/shipments` | List shipments for order | ORDER_GET (33) |
| POST | `/admin/orders/:id/shipments` | Create shipment record | ORDER_POST (34) |
| PUT | `/admin/orders/:id/shipments/:shipmentId` | Update shipment | ORDER_PUT (35) |
| DELETE | `/admin/orders/:id` | Soft delete | ORDER_DELETE (36) |
| DELETE | `/admin/orders/:id/force` | Hard delete | ORDER_DELETE (36) |

### Cart — `/admin/cart`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/cart` | Get cart items for current user | ORDER_GET (33) |
| POST | `/admin/cart` | Add or update cart item (upsert) | ORDER_POST (34) |
| DELETE | `/admin/cart` | Clear entire cart | ORDER_DELETE (36) |
| DELETE | `/admin/cart/:id` | Remove single cart item | ORDER_DELETE (36) |

---

## Query Parameters (GET /admin/orders)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `sort` | string | e.g., `-createdAt` |
| `user_id` | UUID | Filter by customer |
| `shop_id` | number | Filter by shop |
| `status` | number | Filter by status code |
| `paranoid` | any | Include soft-deleted |

---

## Business Rules

- **`total_price` is set at creation** and should not change after the order is placed. Individual `OrderItem.unit_price` are also snapshots.
- **`product_name` snapshot** — stored in OrderItem to preserve the name even if the product is later renamed or deleted.
- **Status transitions** — every status change via `PATCH /:id/status` automatically creates an `OrderStatusHistory` record.
- **Cart upsert** — `POST /cart` with the same `product_id` + `variant_id` updates the quantity instead of creating a duplicate row.
- **Payment on delivery** — the default `method` is `CASH`. `external_id` is used when integrating with a payment gateway.

---

## Relationships

- Order `belongs to` User (customer)
- Order `belongs to` Shop
- Order `has many` OrderItem → Product + ProductVariant
- Order `has many` OrderStatusHistory
- Order `has many` PaymentTransaction
- CartItem `belongs to` User, Product, ProductVariant

---

## Roadmap

- Structured delivery address model (linked to geography hierarchy)
- Shipment / tracking model: `carrier`, `tracking_number`, `shipped_at`, `delivered_at`
- Return / RMA flow: buyer initiates return, shop approves, refund issued
- CLOSED status: auto-close orders N days after DELIVERED, triggering seller payout
- Payment gateway integration (Stripe Connect or local equivalent)
