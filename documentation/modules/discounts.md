# Discounts Module

Manages coupon codes and promotional discounts. Discounts can be scoped to a specific shop or applied platform-wide.

**Location:** `backend/__modules__/discounts/`

---

## Models

### Discount
**Table:** `discounts`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| shop_id | INTEGER | no | — | FK → shops.id, CASCADE. NULL = platform-wide |
| code | STRING(64) | yes | — | Unique. Normalized to uppercase |
| type | STRING(30) | yes | "PERCENTAGE" | See discount types below |
| value | DECIMAL(10,2) | yes | 0 | Percentage (0–100) or fixed amount |
| min_order_amount | DECIMAL(12,2) | no | — | Minimum cart value to apply |
| max_uses | INTEGER | no | — | NULL = unlimited |
| used_count | INTEGER | yes | 0 | Incremented on each redemption |
| starts_at | DATE | no | — | NULL = immediately active |
| ends_at | DATE | no | — | NULL = no expiry |
| is_active | BOOLEAN | yes | true | Master on/off switch |

Timestamps + paranoid.

**Indexes:** `code` (unique), `shop_id`, `is_active`, `ends_at`

**Associations:**
- `belongsTo Shop` (as `shop`)

---

### Discount Types

| Type | Description |
|------|-------------|
| `PERCENTAGE` | Reduces order total by `value`% (e.g., 10 = 10% off) |
| `FIXED` | Reduces order total by a fixed `value` in TMT |
| `FREE_SHIPPING` | Waives shipping cost (value ignored) |

---

## API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/discounts` | List discounts | DISCOUNT_GET (41) |
| GET | `/admin/discounts/:id` | Get single discount | DISCOUNT_GET (41) |
| POST | `/admin/discounts` | Create discount | DISCOUNT_POST (42) |
| PUT | `/admin/discounts/:id` | Update discount | DISCOUNT_PUT (43) |
| DELETE | `/admin/discounts/:id` | Soft delete | DISCOUNT_DELETE (44) |
| DELETE | `/admin/discounts/:id/force` | Hard delete | DISCOUNT_DELETE (44) |
| POST | `/admin/discounts/:id/restore` | Restore soft-deleted | DISCOUNT_PUT (43) |

---

## Query Parameters (GET /admin/discounts)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `shop_id` | number | Filter by shop |
| `is_active` | boolean | |
| `code` | string | Case-insensitive partial match |
| `paranoid` | any | Include deleted |

---

## Business Rules

- **Code normalization:** `code` is always stored in uppercase. On create, if no code is provided, an 8-character random hex code is auto-generated.
- **Scheduling:** A discount is considered active only when `is_active = true` AND `starts_at <= NOW()` AND (`ends_at IS NULL` OR `ends_at >= NOW()`). The `is_active` flag is a manual override on top of the date schedule.
- **Usage cap:** When `max_uses` is set, `used_count` must be incremented each time the code is redeemed. When `used_count >= max_uses`, the code is no longer valid.
- **Validation at checkout:** Before applying a discount code to an order, call `DiscountService.getByCode(code)` and verify: `is_active`, date range, `used_count < max_uses`, `min_order_amount`.

---

## Relationships

- Discount `belongs to` Shop (nullable — NULL means platform-wide)
- Orders do not yet have a `discount_id` FK (applying a discount to an order is planned)

---

## Roadmap

- Apply discount at checkout: add `discount_id` FK to Order and enforce discount logic in the order creation service
- Flash sale model: time-limited + stock-limited price reduction on specific products (different from coupon codes — automatic, no code required)
- Bundle discounts: "buy X get Y" rules
- Tiered discounts: different % based on cart total thresholds
- Referral / affiliate program: generate referral codes tied to users
