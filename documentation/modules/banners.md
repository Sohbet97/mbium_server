# Banners Module

Manages promotional banners displayed across the marketplace. Banners can be global (platform-wide) or scoped to a specific shop, and are organized by placement zones.

**Location:** `backend/__modules__/banners/`

---

## Models

### Banner
**Table:** `banners`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| shop_id | INTEGER | no | — | FK → shops.id, CASCADE. NULL = global/platform banner |
| title | STRING(255) | yes | — | Display label / alt text |
| image_url | TEXT | no | — | URL or file path to banner image |
| link_url | TEXT | no | — | Click destination URL |
| placement | STRING(30) | yes | "HOME" | Determines which page/zone renders this banner |
| order | SMALLINT | yes | 0 | Display priority within a placement (lower = first) |
| starts_at | DATE | no | — | NULL = immediately active |
| ends_at | DATE | no | — | NULL = no expiry |
| is_active | BOOLEAN | yes | true | Master on/off switch |

Timestamps + paranoid.

**Indexes:** `shop_id`, `placement`, `is_active`, `order`, `ends_at`

**Associations:**
- `belongsTo Shop` (as `shop`)

---

### Placement Zones

| Value | Where it appears |
|-------|-----------------|
| `HOME` | Marketplace homepage |
| `SHOP` | Individual shop page |
| `CATEGORY` | Category listing page |

---

## API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/banners` | List banners | BANNER_GET (45) |
| GET | `/admin/banners/:id` | Get single banner | BANNER_GET (45) |
| POST | `/admin/banners` | Create banner | BANNER_POST (46) |
| PUT | `/admin/banners/:id` | Update banner | BANNER_PUT (47) |
| DELETE | `/admin/banners/:id` | Soft delete | BANNER_DELETE (48) |
| DELETE | `/admin/banners/:id/force` | Hard delete | BANNER_DELETE (48) |
| POST | `/admin/banners/:id/restore` | Restore soft-deleted | BANNER_PUT (47) |

---

## Query Parameters (GET /admin/banners)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `sort` | string | |
| `shop_id` | number \| `"null"` | Filter by shop. Pass `"null"` to get global banners |
| `placement` | string | `HOME`, `SHOP`, or `CATEGORY` |
| `is_active` | boolean | |
| `paranoid` | any | Include soft-deleted |

---

## Default Sort Order

Results are ordered by `order ASC, createdAt DESC` — lower `order` values appear first; ties broken by newest first.

---

## Business Rules

- **`shop_id = null`** — platform-level banners, shown regardless of shop context.
- **`shop_id = X`** — shown only in the context of shop X (e.g., on the shop's own page).
- **Scheduling:** Same pattern as Discounts — `is_active` is a manual switch; `starts_at` / `ends_at` control the time window. A banner is live only when all three conditions pass.
- **`order` field** — use integers to control display sequence within a placement. There is no uniqueness constraint on `order`, so multiple banners can share the same position (sorted by `createdAt` as a tiebreaker).
- **Validator:** Placement must be one of `HOME`, `SHOP`, `CATEGORY`. Rejected values return a Turkmen-language error from the Yup schema.

---

## Relationships

- Banner `belongs to` Shop (nullable)

---

## Roadmap

- Click-tracking: record impression and click counts per banner for analytics
- A/B test variants: link multiple banner variants to a single "campaign", serve by weight
- Frontend public API endpoint: `GET /public/banners?placement=HOME` — unauthenticated, returns only active + in-schedule banners
