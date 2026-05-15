# Catalog Module

Manages the product catalog: products, hierarchical categories, product variants, and product images.

**Location:** `backend/__modules__/catalog/`

---

## Models

### Product
**Table:** `products`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| shop_id | INTEGER | yes | — | FK → shops.id, CASCADE on delete |
| category_id | INTEGER | yes | — | FK → categories.id |
| name | STRING(500) | yes | — | Primary name (Turkmen) |
| name_ru | STRING(500) | no | — | Russian |
| name_eng | STRING(500) | no | — | English |
| description | TEXT | no | — | |
| price | DECIMAL(12,2) | yes | — | Base price in TMT |
| currency | STRING(10) | yes | "TMT" | ISO currency code |
| compare_at_price | DECIMAL(12,2) | no | — | Original price (for strike-through display) |
| sku | STRING(100) | no | — | Stock keeping unit |
| barcode | STRING(100) | no | — | |
| weight | INTEGER | no | — | Weight in grams |
| stock | INTEGER | yes | 0 | Available quantity |
| tags | ARRAY(STRING) | no | [] | Searchable tags |
| handle | STRING(255) | no | — | Unique URL slug (e.g., `red-sneakers-v2`) |
| seo_title | STRING(255) | no | — | |
| seo_description | TEXT | no | — | |
| rating | DECIMAL(3,2) | yes | 0 | Computed avg from reviews |
| review_count | INTEGER | yes | 0 | Denormalized count |
| status | SMALLINT | yes | STATUSE_ACTIVE | |
| is_active | BOOLEAN | yes | true | |
| createdBy | UUID | no | — | FK → users.id |

Timestamps + paranoid.

**Indexes:** `shop_id`, `category_id`, `status`, `is_active`, `price`

**Associations:**
- `belongsTo Shop` (as `shop`)
- `belongsTo Category` (as `category`)
- `hasMany ProductVariant` (as `variants`)
- `hasMany ProductImage` (as `images`)
- `hasMany Review` (as `reviews`)

---

### Category
**Table:** `categories`

Self-referencing tree (unlimited depth).

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| parent_id | INTEGER | no | — | FK → categories.id, SET NULL on delete |
| name | STRING(255) | yes | — | |
| name_ru | STRING(255) | no | — | |
| name_eng | STRING(255) | no | — | |
| slug | STRING(255) | yes | — | Unique URL path segment |
| icon | TEXT | no | — | Icon URL or icon class |
| order | SMALLINT | no | — | |
| seo_title | STRING(255) | no | — | |
| seo_description | TEXT | no | — | |
| status | SMALLINT | yes | STATUSE_ACTIVE | |
| createdBy | UUID | no | — | FK → users.id |

Timestamps + paranoid.

**Indexes:** `parent_id`, `status`, `slug` (unique)

**Associations:**
- `belongsTo Category` (as `parent`, FK: parent_id)
- `hasMany Category` (as `children`, FK: parent_id)
- `hasMany Product` (as `products`)

---

### ProductVariant
**Table:** `product_variants`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | |
| product_id | INTEGER | yes | — | FK → products.id, CASCADE |
| name | STRING(255) | yes | — | e.g., "Size M / Red" |
| sku | STRING(100) | no | — | |
| barcode | STRING(100) | no | — | |
| price | DECIMAL(12,2) | no | — | Overrides product.price if set |
| compare_at_price | DECIMAL(12,2) | no | — | |
| stock | INTEGER | yes | 0 | |
| attributes | JSONB | no | {} | e.g., `{ "color": "red", "size": "M" }` |
| is_active | BOOLEAN | yes | true | |

Timestamps + paranoid.

**Indexes:** `product_id`, `is_active`

---

### ProductImage
**Table:** `product_images`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | yes | |
| product_id | INTEGER | yes | FK → products.id, CASCADE |
| url | TEXT | yes | Full URL or relative path |
| is_primary | BOOLEAN | yes, default false | One image should be primary |
| order | SMALLINT | no | Display sequence |

Timestamps (no paranoid).

---

## API Endpoints

### Products — `/admin/products`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/products` | List products | PRODUCT_GET (29) |
| GET | `/admin/products/:id` | Get product | PRODUCT_GET (29) |
| POST | `/admin/products` | Create product | PRODUCT_POST (30) |
| PUT | `/admin/products/:id` | Update product | PRODUCT_PUT (31) |
| PATCH | `/admin/products/:id/restore` | Restore | PRODUCT_PUT (31) |
| DELETE | `/admin/products/:id` | Soft delete | PRODUCT_DELETE (32) |
| DELETE | `/admin/products/:id/force` | Hard delete | PRODUCT_DELETE (32) |
| POST | `/admin/products/:id/images` | Add image | PRODUCT_POST (30) |
| DELETE | `/admin/products/:id/images/:imageId` | Remove image | PRODUCT_DELETE (32) |
| POST | `/admin/products/:id/variants` | Add variant | PRODUCT_POST (30) |
| PUT | `/admin/products/:id/variants/:variantId` | Update variant | PRODUCT_PUT (31) |
| DELETE | `/admin/products/:id/variants/:variantId` | Delete variant | PRODUCT_DELETE (32) |

### Categories — `/admin/categories`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/categories` | List categories (flat) | CATEGORY_GET (25) |
| GET | `/admin/categories/tree` | Full category tree | CATEGORY_GET (25) |
| GET | `/admin/categories/:id` | Get category | CATEGORY_GET (25) |
| POST | `/admin/categories` | Create | CATEGORY_POST (26) |
| PUT | `/admin/categories/:id` | Update | CATEGORY_PUT (27) |
| PATCH | `/admin/categories/:id/restore` | Restore | CATEGORY_PUT (27) |
| DELETE | `/admin/categories/:id` | Soft delete | CATEGORY_DELETE (28) |
| DELETE | `/admin/categories/:id/force` | Hard delete | CATEGORY_DELETE (28) |

---

## Query Parameters (GET /admin/products)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `sort` | string | e.g., `-price`, `name` |
| `shop_id` | number | Filter by shop |
| `category_id` | number | Filter by category |
| `is_active` | boolean | |
| `paranoid` | any | Include deleted |

---

## Business Rules

- **`handle` (slug)** — must be unique across all products. Used for SEO-friendly URLs. Convention: lowercase, hyphen-separated.
- **Variants** — if a product has variants, buyers choose a variant at purchase time. `OrderItem` stores both `product_id` and `variant_id`.
- **`rating` / `review_count`** — denormalized for query performance. Should be updated whenever a review is created, updated, or deleted for this product.
- **`compare_at_price`** — displayed as the original (struck-through) price to indicate a discount. No enforcement; purely presentational.
- **Category tree** — `GET /admin/categories/tree` returns nested JSON with `children` arrays. Useful for rendering navigation menus.

---

## Relationships

- Product `belongs to` Shop
- Product `belongs to` Category
- Product `has many` ProductVariant
- Product `has many` ProductImage
- Product `has many` Review
- OrderItem `belongs to` Product + ProductVariant
- CartItem `belongs to` Product + ProductVariant

---

## Roadmap

- Full-text search: integrate Elasticsearch or Algolia (infrastructure configured in `package.json`, not yet wired)
- Faceted filtering endpoints: price range, attributes, rating min
- Flash deal model: time-limited + quantity-limited price override per product
- Product recommendations: "also bought", "similar items"
- Autocomplete / search suggest endpoint
