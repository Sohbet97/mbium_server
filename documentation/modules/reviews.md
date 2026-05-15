# Reviews Module

Manages product reviews submitted by buyers. Supports moderation via a status field.

**Location:** `backend/__modules__/reviews/`

---

## Models

### Review
**Table:** `reviews`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | INTEGER | yes | autoincrement | Primary key |
| user_id | UUID | yes | — | FK → users.id, CASCADE |
| product_id | INTEGER | yes | — | FK → products.id, CASCADE |
| order_id | INTEGER | no | — | FK → orders.id, SET NULL. Links review to a verified purchase |
| rating | SMALLINT | yes | — | 1–5 inclusive |
| comment | TEXT | no | — | |
| status | SMALLINT | yes | 0 | Moderation status (see below) |

Timestamps + paranoid.

**Indexes:** `product_id`, `user_id`, `rating`

**Unique constraint:** `(user_id, product_id, order_id)` — one review per buyer per product per order.

**Associations:**
- `belongsTo User` (as `author`)
- `belongsTo Product` (as `product`)
- `belongsTo Order` (as `order`)

---

### Review Status

| Value | Meaning |
|-------|---------|
| 0 | Pending moderation |
| 1 | Approved / visible |
| 2 | Rejected / hidden |

---

## API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/reviews` | List reviews | REVIEW_GET (37) |
| GET | `/admin/reviews/:id` | Get single review | REVIEW_GET (37) |
| POST | `/admin/reviews` | Create review | REVIEW_POST (38) |
| PATCH | `/admin/reviews/:id/status` | Update moderation status | REVIEW_PUT (39) |
| DELETE | `/admin/reviews/:id` | Soft delete | REVIEW_DELETE (40) |
| DELETE | `/admin/reviews/:id/force` | Hard delete | REVIEW_DELETE (40) |

---

## Query Parameters (GET /admin/reviews)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `sort` | string | |
| `product_id` | number | Filter by product |
| `user_id` | UUID | Filter by reviewer |
| `status` | number | Filter by moderation status |
| `rating` | number | Filter by rating value |
| `paranoid` | any | Include deleted |

---

## Business Rules

- **Rating range:** 1–5. Values outside this range are rejected by the Yup validator.
- **One review per purchase:** The unique constraint on `(user_id, product_id, order_id)` prevents duplicate reviews. A buyer who purchased the same product in two different orders can leave two reviews (one per `order_id`). Reviews without an `order_id` are limited to one per `(user_id, product_id)`.
- **`order_id` link:** Optional but important for displaying a "Verified Purchase" badge. When present, it proves the reviewer actually bought the product.
- **`product.rating` and `product.review_count`:** These denormalized fields on the Product model should be recalculated after each review create/update/delete operation.

---

## Relationships

- Review `belongs to` User (author)
- Review `belongs to` Product
- Review `belongs to` Order (optional, for verified purchase)

---

## Roadmap

- Seller reply: a `ReviewReply` model linked to a review, writable by the shop owner
- Helpful vote: buyers can mark a review as helpful; `helpful_count` on the review
- Automated moderation queue: surface reviews with low rating or flagged content for admin review
- Verified purchase badge: expose `order_id IS NOT NULL` as a computed field in the API response
- Trigger auto-update of `product.rating` and `product.review_count` on review changes
