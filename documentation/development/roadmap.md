# Roadmap & Gap Analysis

Comparison of the **marketplace_platform_documentation.pdf** (v1.0, May 2025) requirements against the current backend implementation.

---

## Module Status Overview

| Module | Status | Summary |
|--------|--------|---------|
| Shop Management | ✅ Solid | CRUD, multilingual, geo links, soft delete |
| Order Management | ✅ Solid | Full lifecycle, payment transactions, cart, audit trail |
| Staff & Access Control | ⚠️ Partial | Flat RBAC works; shop-scoped roles and hierarchy missing |
| Payments & Payouts | ⚠️ Partial | Transaction records only; no payout/wallet/gateway |
| Discovery & Search | ⚠️ Partial | Product + category CRUD; no search engine, no filtering |
| Reviews & Trust | ✅ Good foundation | Core review model done; no seller reply or verified badge |
| Promotions & Marketing | ⚠️ Partial | Discount codes + banners; no flash sales or referrals |
| Logistics & Shipping | ❌ Missing | Entire module absent |
| Platform Administration | ⚠️ Partial | Geography + config + logs; no KYC or moderation |
| Messaging & Support | ⚠️ Partial | Real-time chat + notifications; no tickets or disputes |

---

## P1 — Core Commerce Gaps (block real transactions)

### ~~1. Order status machine — add CLOSED (5)~~ ✅ Done
`CLOSED: 5` added to `ORDER_STATUSES` in `backend/__modules__/orders/models/Order.model.js`.  
No migration needed (status column is already SMALLINT).  
Next: auto-close orders N days after DELIVERED (triggers payout) — belongs to the Payouts module task.

---

### ~~2. Structured delivery address model~~ ✅ Done
`DeliveryAddress` model added to the orders module. Fields: `user_id`, `label`, `region_id`, `city_id`, `district_id`, `street`, `apartment`, `postal_code`, `is_default`.  
`Order` now has a nullable `delivery_address_id` FK alongside the legacy `delivery_address` TEXT field.  
New endpoints: `GET/POST /admin/delivery-addresses`, `PUT/DELETE /admin/delivery-addresses/:id`.  
Setting `is_default=true` auto-clears the flag on the user's other addresses. Migration: `007_delivery_addresses.sql`.

---

### ~~3. Shipment / tracking model~~ ✅ Done
`Shipment` model added to the orders module. Statuses: PENDING → IN_TRANSIT → DELIVERED / RETURNED.  
New endpoints: `GET/POST /admin/orders/:id/shipments`, `PUT /admin/orders/:id/shipments/:shipmentId`.  
`Order.getById` now includes shipments. Migration: `004_shipments.sql`.

---

### ~~4. Payout / seller balance ledger~~ ✅ Done
`SellerBalance` and `PayoutRequest` models added in `backend/__modules__/payouts/`.  
Endpoints: `GET/POST /admin/payouts/requests`, `PATCH /admin/payouts/requests/:id/status`, `GET /admin/payouts/balances`, `GET /admin/payouts/balances/:shopId`.  
Marking a request `PROCESSED` auto-debits the shop's `seller_balances` row. Migration: `005_payouts.sql`.  
Next: credit `seller_balances` automatically when an order transitions to CLOSED (commission engine task).

---

### ~~5. Flash sale model~~ ✅ Done
`FlashSale` model added to the discounts module. Fields: `shop_id`, `product_id`, `variant_id`, `sale_price`, `original_price`, `quantity_limit`, `sold_count`, `starts_at`, `ends_at`, `is_active`.  
New endpoints: `GET/POST /admin/flash-sales`, `PUT/DELETE /admin/flash-sales/:id`.  
`?active_now=true` filter returns only currently running sales. Migration: `006_flash_sales.sql`.  
Guarded by `DISCOUNT_*` permissions (same as discount coupons).

---

## P2 — Trust & Platform Integrity

### ~~6. Dispute model~~ ✅ Done
`Dispute` model added in `backend/__modules__/disputes/`.  
State machine: OPEN → UNDER_REVIEW → RESOLVED / CLOSED. Terminal statuses auto-set `resolved_by` + `resolved_at`.  
Endpoints: `GET/POST /admin/disputes`, `PATCH /admin/disputes/:id/status`, soft/hard delete + restore.  
Permissions: DISPUTE_GET=65, DISPUTE_POST=66, DISPUTE_PUT=67, DISPUTE_DELETE=68. Migration: `009_disputes.sql`.

---

### ~~7. Seller reply to reviews~~ ✅ Done
`ReviewReply` model added to the reviews module (`review_id` UNIQUE — one reply per review).  
New endpoints: `GET /admin/reviews/:id/reply`, `POST /admin/reviews/:id/reply`, `DELETE /admin/reviews/:id/reply`.  
`POST` enforces uniqueness (409 if reply already exists); `createdBy` set from `req.user`.  
`Review.getById` now includes the reply. Migration: `010_review_replies.sql`.

---

### ~~8. Shop verification workflow~~ ✅ Done
`verification_status` (SMALLINT), `verification_note`, `verified_at`, `verified_by` added to `shops` table.  
State machine: UNVERIFIED (0) → PENDING_REVIEW (1) → VERIFIED (2) / REJECTED (3).  
New endpoints: `PATCH /admin/shops/:id/submit`, `PATCH /admin/shops/:id/verify`, `PATCH /admin/shops/:id/reject`.  
`is_verified` boolean kept in sync (true on VERIFIED, false otherwise). Migration: `008_shop_verification.sql`.

---

### 9. KYC document submission
Sellers must submit identity documents before going live.

New model `KycDocument` fields: `shop_id`, `type` (PASSPORT/TAX_ID/BUSINESS_REG), `file_url`, `status` (PENDING/APPROVED/REJECTED), `reviewed_by`, `reviewed_at`, `note`.

Files to create:
- New model in shops module or a separate KYC module
- Migration SQL

---

### ~~10. Commission engine~~ ✅ Done
`platform_commission_rate` (DECIMAL 5,4, default 0.05) added to `configurations` table.  
When an order transitions to CLOSED (5), `OrderService._applyCommission` reads the rate, calculates `seller_amount = total_price × (1 − rate)`, and calls `PayoutService.creditBalance`. Migration: `011_commission_rate.sql`.

---

## P3 — Discovery & Growth

### 11. Full-text product search
Elasticsearch or Algolia is listed in `package.json` but not integrated.

Files to create/change:
- `backend/config/elasticsearch.js` (or algolia client)
- `backend/__modules__/catalog/services/search.js`
- New route: `GET /api/products/search?q=...`
- Index products on create/update/delete (service hooks)

---

### 12. Faceted filter endpoints
`GET /admin/products` currently supports only simple equality filters. Add:

- `price_min`, `price_max` — `Op.between`
- `rating_min` — `Op.gte`
- `attributes` — JSONB containment query
- `tags` — array overlap query

Files to change:
- `backend/__modules__/catalog/services/products.js` — extend `getFilter()`

---

### 13. Shipping methods + rate calculation
New model `ShippingMethod` fields: `name`, `carrier`, `estimated_days_min`, `estimated_days_max`, `price_rule` (JSONB: flat rate, by weight, by zone), `is_active`.

Link to shops so each shop can define their shipping options.

Files to create:
- `backend/__modules__/logistics/` — new module
- Permissions: SHIPPING_GET=57+
- Migration SQL

---

### 14. Loyalty points
New model `LoyaltyLedger` fields: `user_id`, `order_id`, `points`, `type` (EARNED/REDEEMED/EXPIRED), `expires_at`.

---

### 15. Support ticket system
New model `SupportTicket` fields: `user_id`, `shop_id` (nullable), `subject`, `body`, `status` (OPEN/IN_PROGRESS/RESOLVED/CLOSED), `priority`, `assigned_to`, `resolved_at`.

---

## Permission ID Continuity

| Range | Reserved for |
|-------|-------------|
| 1–48 | Implemented (see [permissions.md](../shared/permissions.md)) |
| 49–52 | Payouts module |
| 53–56 | Disputes module |
| 57–60 | Logistics / Shipping module |
| 61–64 | KYC / Verification |
| 65+ | Future modules |

---

## Delivery Phases (from platform doc)

| Phase | Timeline | Key Items |
|-------|----------|-----------|
| Phase 1 (current) | 0–3m | Auth, shops, catalog, orders, cart, discounts, banners, reviews |
| Phase 2 | 3–6m | Disputes, seller replies, shop verification, KYC, commission, delivery addresses, shipments |
| Phase 3 | 6–12m | Full-text search, flash sales, payout ledger, loyalty, support tickets, shipping methods |
| Phase 4 | 12m+ | AI recommendations, live commerce, B2B, white-label, chatbot |
