# Shops Module

Manages marketplace shops (seller storefronts), their types, and shop-level staff members.

**Location:** `backend/__modules__/shops/`

---

## Models

### Shop
**Table:** `shops`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| owner_id | UUID | yes | — | FK → users.id, CASCADE on delete |
| type_id | INTEGER | yes | — | FK → shop_types.id |
| name | STRING(255) | yes | — | Primary name (Turkmen) |
| name_ru | STRING(500) | no | — | Russian name |
| name_eng | STRING(500) | no | — | English name |
| description | TEXT | no | — | Shop description |
| logo | TEXT | no | — | URL or file path |
| address | TEXT | no | — | Free-text address |
| city_id | INTEGER | no | — | FK → cities.id |
| region_id | INTEGER | no | — | FK → regions.id |
| phone | STRING(20) | no | — | Contact phone |
| email | STRING(100) | no | — | Contact email |
| order | SMALLINT | no | — | Display order |
| status | SMALLINT | yes | STATUSE_ACTIVE | |
| is_active | BOOLEAN | yes | false | Visible to buyers only when true |
| is_verified | BOOLEAN | yes | false | Set by platform admins after KYC |
| rating | DECIMAL(3,2) | yes | 0 | Average rating, updated from reviews |
| createdBy | UUID | no | — | FK → users.id |

Timestamps + paranoid.

**Indexes:** `owner_id`, `type_id`, `status`, `is_active`, `region_id`, `city_id`

**Associations:**
- `belongsTo User` (as `owner`, FK: owner_id)
- `belongsTo User` (as `creator`, FK: createdBy)
- `belongsTo ShopType` (as `type`)
- `belongsTo Region` (as `region`)
- `belongsTo City` (as `city`)

---

### ShopType
**Table:** `shop_types`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| name | STRING(500) | yes | — | Primary name (Turkmen) |
| name_ru | STRING(500) | no | — | |
| name_eng | STRING(500) | no | — | |
| order | SMALLINT | no | — | Display order |
| is_active | BOOLEAN | yes | false | |
| createdBy | UUID | no | — | FK → users.id |

Timestamps + paranoid.

**Associations:**
- `hasMany Shop` (as `shops`)
- `belongsTo User` (as `creator`)

---

### ShopMember
**Table:** `shop_members`

Links users to shops with a 5-tier role. One row per user per shop.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| shop_id | INTEGER | yes | — | FK → shops.id, CASCADE |
| user_id | UUID | yes | — | FK → users.id, CASCADE |
| role | VARCHAR(30) | yes | "STAFF" | See role hierarchy below |
| is_active | BOOLEAN | yes | true | |
| invited_by | UUID | no | — | FK → users.id, SET NULL — who added this member |

Timestamps + paranoid.

**Unique constraint:** `(shop_id, user_id)` — one membership record per user per shop.

**Indexes:** `shop_id`, `user_id`, `role`, `is_active`

**Associations:**
- `belongsTo Shop` (as `shop`)
- `belongsTo User` (as `user`)
- `belongsTo User` (as `inviter`, FK: invited_by)

**Role Hierarchy:**

| Role | Description |
|------|-------------|
| `OWNER` | Full control; typically one per shop |
| `DIRECTOR` | Near-full access; cannot transfer ownership |
| `MANAGER` | Manage products, orders, discounts |
| `MODERATOR` | Review/moderate content (reviews, listings) |
| `STAFF` | Read-only / basic operations |

The hierarchy is a string enum. Permission enforcement per role is planned for the route-guard re-enablement task.

---

## API Endpoints

All routes require `authorizationMiddleware`. Permissions are from the `WM_*` group.

### Shops — `/admin/shops`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/shops` | List shops (paginated) |
| GET | `/admin/shops/count` | Count shops matching filter |
| GET | `/admin/shops/:id` | Get single shop |
| POST | `/admin/shops` | Create shop |
| PUT | `/admin/shops/:id` | Update shop |
| PATCH | `/admin/shops/:id/restore` | Restore soft-deleted shop |
| DELETE | `/admin/shops/:id` | Soft delete |
| DELETE | `/admin/shops/:id/force` | Hard delete |

### Shop Types — `/admin/shop-types`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/shop-types` | List types |
| GET | `/admin/shop-types/count` | Count types |
| GET | `/admin/shop-types/:id` | Get single type |
| POST | `/admin/shop-types` | Create type |
| PUT | `/admin/shop-types/:id` | Update type |
| PATCH | `/admin/shop-types/:id/restore` | Restore |
| DELETE | `/admin/shop-types/:id` | Soft delete |
| DELETE | `/admin/shop-types/:id/force` | Hard delete |

### Shop Members — `/admin/shop-members`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/shop-members` | List members | SHOP_MEMBER_GET (49) |
| GET | `/admin/shop-members/:id` | Get single member | SHOP_MEMBER_GET (49) |
| POST | `/admin/shop-members` | Add member | SHOP_MEMBER_POST (50) |
| PUT | `/admin/shop-members/:id` | Update role / status | SHOP_MEMBER_PUT (51) |
| DELETE | `/admin/shop-members/:id` | Soft delete | SHOP_MEMBER_DELETE (52) |
| DELETE | `/admin/shop-members/:id/force` | Hard delete | SHOP_MEMBER_DELETE (52) |
| POST | `/admin/shop-members/:id/restore` | Restore | SHOP_MEMBER_PUT (51) |

**Query parameters for `GET /admin/shop-members`:**

| Param | Type | Description |
|-------|------|-------------|
| `shop_id` | number | Filter by shop |
| `user_id` | UUID | Filter by user |
| `role` | string | Filter by role name |
| `is_active` | boolean | |
| `page`, `limit`, `sort` | — | Standard pagination |
| `paranoid` | any | Include soft-deleted |

---

## Query Parameters (GET /admin/shops)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Records per page (default 20) |
| `sort` | string | e.g., `name`, `-createdAt` |
| `owner_id` | UUID | Filter by shop owner |
| `type_id` | number | Filter by shop type |
| `is_active` | boolean | Filter active/inactive shops |
| `region_id` | number | Filter by region |
| `city_id` | number | Filter by city |
| `paranoid` | any | Include soft-deleted records |

---

## Business Rules

- **`is_active`** — a shop starts inactive. It must be explicitly activated before buyers can see it.
- **`is_verified`** — set by a platform admin after KYC review. Planned: verification workflow with document submission.
- **`rating`** — computed field. Should be recalculated when a review for a product in this shop is created/updated/deleted. Currently manual or not auto-updated.
- **Multilingual names** — `name` is the canonical (Turkmen) name. `name_ru` and `name_eng` are optional translations.
- **Geographic links** — `city_id` and `region_id` reference the geography hierarchy. See [shared/geography.md](../shared/geography.md).

---

## Relationships

- Shop `belongs to` User (owner)
- Shop `belongs to` ShopType
- Shop `has many` Products (via catalog module)
- Shop `has many` Orders
- Shop `has many` Discounts
- Shop `has many` Banners (shop_id = null → global banner)
- Shop `has many` ShopMember

---

## Roadmap

- Shop verification workflow: PENDING → UNDER_REVIEW → VERIFIED / REJECTED (with admin actions and seller notification)
- Seller analytics endpoints: revenue, order counts, top products
- Payout configuration per shop: payout frequency, bank account details
- ~~Shop-scoped staff roles~~ — **Done**: ShopMember model with 5-tier role hierarchy
- Route-guard enforcement per ShopMember role (next: re-enable permission checks)
- Invitation workflow: PENDING → ACCEPTED status; email/SMS invite link
