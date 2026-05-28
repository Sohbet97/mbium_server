# Embium Platform — Roadmap & Implementation Plan

*Last updated: 2026-05-26. Reflects migration state through 019, all 16 backend modules.*

---

## Feature Status vs Task List

| Feature | Status | Notes |
|---|---|---|
| **Banners** | ⚠️ Partial | CRUD done; missing `url`, `shop_id` (store-specific), `display_order` sorting |
| **Coins — CoinCondition** | ❌ Missing | No earning-rules table |
| **Coins — CoinTransaction** | ❌ Missing | No ledger (planned Phase D) |
| **Coins — CoinTopup** | ❌ Missing | No top-up request model |
| **Coins — CoinLog/history** | ❌ Missing | Combined with CoinTransaction |
| **Categories — tree view** | ⚠️ Partial | Backend `parent_id` exists; frontend tree UI not built |
| **Products — gallery** | ⚠️ Partial | `ProductImage`/`ProductMedia` exist; `display_order` + explicit type ENUM missing |
| **Products — tags** | ❌ Missing | No `ProductTag` model or join table |
| **Comments (on products)** | ❌ Missing | `Review` exists (rating-based); threaded product comments not built |
| **Chat rooms / messages** | ✅ Done | `ChatRoom`, `ChatMessage`, `ChatRoomParticipant` models + admin routes |
| **Orders / statuses / items** | ✅ Done | `Order`, `OrderItem`, `OrderStatusHistory` all complete |
| **Brands — tree view** | ❌ Missing | No `Brand` model; no `brand_id` on products |
| **Suppliers** | ❌ Missing | No `Supplier` model |
| **Video streaming** | ❌ Missing | Phase M — infrastructure not started |
| **Favorites** | ❌ Missing | No `Favorite` model |
| **Cart** | ✅ Done | `CartItem` model + full CRUD routes |
| **Addresses** | ✅ Done | `DeliveryAddress` model + routes |
| **Media Gallery — 360° / video** | ⚠️ Partial | `ProductMedia` exists; explicit `type` ENUM (`image/video/image_360/model_3d`) missing |
| **Localization — 3 languages** | ⚠️ Partial | Frontend i18n complete (en/ru/tk); backend key models need `_tk/_ru/_en` fields |
| **Currency — TMT / USD** | ❌ Missing | No currency table; single decimal price only |
| **Product Scheduling** | ❌ Missing | No `scheduled_at` / `is_published` on `Product` |

---

## Module Completion Matrix

| Module | Models | Routes | Status |
|---|---|---|---|
| user | ✅ | ✅ | Complete |
| shops | ✅ | ✅ | Complete |
| catalog | ✅ | ✅ | Complete (tags, scheduling pending) |
| orders | ✅ | ✅ | Complete |
| reviews | ✅ | ✅ | Complete |
| discounts | ✅ | ✅ | Complete |
| banners | ✅ | ✅ | CRUD only — url/store-specific/sort pending |
| payouts | ✅ | ✅ | Complete |
| disputes | ✅ | ✅ | Complete |
| delivers | ✅ | ✅ | CRUD only — GPS tracking missing |
| subscriptions | ✅ | ✅ | Data stored — zero enforcement |
| media | ✅ | ✅ | Complete |
| analytics | ✅ | ✅ | Complete |
| warehouse | ✅ | ✅ | Complete |
| audit | ✅ | ✅ | Complete |
| ai | ✅ | ✅ | Chat assistant only |
| favorites | ❌ | ❌ | Not started |
| brands | ❌ | ❌ | Not started |
| suppliers | ❌ | ❌ | Not started |
| comments | ❌ | ❌ | Not started |
| coins | ❌ | ❌ | Not started |
| currencies | ❌ | ❌ | Not started |
| auctions | ❌ | ❌ | Not started |
| lives | ❌ | ❌ | Not started |

---

## Honest Criticism

### 1. Subscription plans are data without enforcement
`Plan.model.js` stores `product_limit`, `ai_credits`, `auction_per_week`, `live_stream_mode`. None are checked anywhere. A Basic shop can create unlimited products right now.

### 2. Commission engine is global, not per-plan
`011_commission_rate.sql` puts one flat rate in `configurations`. PDFs require 15% Basic / 8-10% VIP / 5% Premium. `OrderService._applyCommission` still reads global config.

### 3. Delivers = driver registry, not logistics
CRUD done. Real-time GPS at 1.5s intervals, QR-code order confirmation, and courier mobile flow are not started.

### 4. No Coin module
Coins are the central monetization mechanism. No `user_coins`, `coin_transactions`, `coin_conditions` table exists. Largest gap against the monetization specs.

### 5. No payment gateway
`PaymentTransaction` is a log, not a gateway. All order "payments" are manual status updates.

### 6. No Brands or Suppliers
Products cannot be attributed to a brand or sourced from a supplier. Both are missing entirely.

### 7. No Favorites
No buyer wishlist/favorites capability exists.

### 8. No Product Tags, Scheduling, or Currency
Products cannot be tagged, scheduled for future publish, or priced in multiple currencies.

---

## Realistic Implementation Plan

---

### ✅ Phase 1 — Core Commerce (COMPLETE)

Auth, Shops, Catalog, Orders, Cart, Reviews, Discounts, Banners, Payouts, Disputes, Delivers CRUD, Subscriptions data model, Warehouse, Analytics, Audit, AI chat.

---

### 🔨 Phase 2 — Platform Integrity *(est. 2–3 weeks)*

#### 2a. Commission by plan tier *(1–2 days)*
- Add `commission_rate DECIMAL(5,4)` to `plans` → migration `015_plan_commission.sql`
- Seed: Basic=0.15, VIP=0.09, Premium=0.05
- Update `OrderService._applyCommission()` to read `shop → shop_subscription → plan → commission_rate`
- Files: `__modules__/orders/services/orders.js`, `__modules__/subscriptions/models/Plan.model.js`

#### 2b. Subscription enforcement *(3–4 days)*
- New util: `backend/utils/plan-limits.js` → `checkProductLimit(shopId)`, `checkAuctionQuota(shopId)`, `checkLiveStreamAccess(shopId)`
- Hook `checkProductLimit` into `ProductController.create`
- Files: new `plan-limits.js`, `__modules__/catalog/controllers/product.js`

#### 2c. KYC document submission *(2–3 days)*
- Model: `KycDocument` → shop_id, type (PASSPORT/TAX_ID/BUSINESS_REG), file_url, status, reviewed_by, note
- Migration `016_kyc.sql`
- Routes: `POST /admin/shops/:id/kyc`, `PATCH /admin/shops/:id/kyc/:docId/status`

#### 2d. Shop rejection notification *(1 day)*
- Add `NOT_SHOP_REJECTED: 111` to `backend/utils/statuses.js`
- Update `ShopService.reject()` to emit to shop owner via Socket.io

#### 2e. FCM device token storage *(1 day)*
- Add `device_tokens JSONB DEFAULT '[]'` to `users` → migration `017_device_tokens.sql`
- Endpoint: `PATCH /auth/me/device-token`

---

### 🏷️ Phase A — Banner Enhancements *(0.5–1 day)*

**Migration**: `020_banner_enhancements.sql`

- Add `url VARCHAR(500) NULL` — banner click destination
- Add `display_order INTEGER DEFAULT 0` — manual sort position
- Add `shop_id INTEGER REFERENCES shops(id) NULL` — NULL = global banner, non-null = store-specific
- Update `GET /banners?sort=display_order|updated_at&shop_id=X` to support filtering
- Admin endpoint: `PATCH /banners/:id/reorder` — swap display_order between two banners
- **Frontend**: add URL field + shop selector to banner form; sort controls to banner list
- **Files**: `__modules__/banners/models/Banner.model.js`, `__modules__/banners/services/banners.js`, `__modules__/banners/routes/banner.js`

---

### 🏷️ Phase B — Product Tags *(1 day)*

**Migration**: `021_product_tags.sql`

- `product_tags` table: `id, name, slug UNIQUE, created_at`
- `product_tag_map` join table: `product_id, tag_id` — composite PK
- Routes: `GET /admin/catalog/tags`, `POST /admin/catalog/tags`, `DELETE /admin/catalog/tags/:id`
- Routes: `POST /products/:id/tags`, `DELETE /products/:id/tags/:tagId`
- **Frontend**: tag input/autocomplete on product form; tag filter on product list
- **Files**: new `__modules__/catalog/models/ProductTag.model.js`, update product routes

---

### 📅 Phase C — Product Scheduling *(1 day)*

**Migration**: `022_product_scheduling.sql`

- Add `scheduled_at TIMESTAMPTZ NULL` and `is_published BOOLEAN DEFAULT true` to `products`
- Update `ProductService.getAll()`: add filter `WHERE is_published = true AND (scheduled_at IS NULL OR scheduled_at <= NOW())`
- Seller/admin product form: date-time picker for scheduled publish date
- **Files**: `__modules__/catalog/models/Product.model.js`, `__modules__/catalog/services/products.js`

---

### ❤️ Phase D — Favorites *(1 day)*

**Migration**: `023_favorites.sql`

- New module `backend/__modules__/favorites/`
- `Favorite.model.js`: `user_id, product_id, created_at` — UNIQUE constraint on `(user_id, product_id)`
- Routes: `POST /buyer/favorites/:productId`, `DELETE /buyer/favorites/:productId`, `GET /buyer/favorites`
- **Frontend**: heart icon on product cards; favorites list page for buyer app
- Permissions: `FAVORITE_GET (106)`, `FAVORITE_POST (107)`, `FAVORITE_DELETE (108)`

---

### 🏢 Phase E — Brands Module *(2–3 days)*

**Migration**: `024_brands.sql`

- New module `backend/__modules__/brands/`
- `Brand.model.js`: `id, name, slug, parent_id (self-ref FK NULL), logo_url, description, is_active, created_at`
- Self-referencing `parent_id` enables tree structure (same pattern as `Category`)
- Add `brand_id INTEGER REFERENCES brands(id) NULL` to `products`
- Routes: full CRUD at `GET/POST/PUT/DELETE /admin/catalog/brands`
- **Frontend**: tree view component (reuse Category tree pattern once built in Phase I); brand selector on product form; brands management page in admin
- **Files**: new `__modules__/brands/`, update `__modules__/catalog/models/Product.model.js`
- Permissions: `BRAND_GET (86)`, `BRAND_POST (87)`, `BRAND_PUT (88)`, `BRAND_DELETE (89)`

---

### 🏭 Phase F — Suppliers Module *(2 days)*

**Migration**: `025_suppliers.sql`

- New module `backend/__modules__/suppliers/`
- `Supplier.model.js`: `id, name, contact_name, email, phone, address, country_id, website, is_active, notes, created_at`
- Add `supplier_id INTEGER REFERENCES suppliers(id) NULL` to `products`
- Routes: full CRUD at `GET/POST/PUT/DELETE /admin/catalog/suppliers`
- **Frontend**: suppliers management page in admin panel; supplier selector on product form
- **Files**: new `__modules__/suppliers/`, update `__modules__/catalog/models/Product.model.js`
- Permissions: `SUPPLIER_GET (90)`, `SUPPLIER_POST (91)`, `SUPPLIER_PUT (92)`, `SUPPLIER_DELETE (93)`

---

### 💬 Phase G — Comments Module *(2 days)*

**Migration**: `026_comments.sql`

- New module `backend/__modules__/comments/`
- `Comment.model.js`: `id, product_id, user_id, body TEXT, parent_id (self-ref for replies), status ENUM(pending/approved/rejected), created_at`
- Distinct from `Review`: no rating, threaded, moderation-gated
- Routes: `GET /products/:id/comments`, `POST /buyer/products/:id/comments`, `DELETE /admin/comments/:id`, `PATCH /admin/comments/:id/status`
- **Frontend**: comment thread on product detail page (buyer); admin moderation queue
- Permissions: `COMMENT_GET (94)`, `COMMENT_POST (95)`, `COMMENT_PUT (96)`, `COMMENT_DELETE (97)`

---

### 💱 Phase H — Currency Support *(2 days)*

**Migration**: `027_currencies.sql`

- `currencies` table: `code CHAR(3) PK, name, symbol, exchange_rate_to_tmt DECIMAL(10,4), is_base BOOLEAN`
- Seed: `TMT` (base, rate=1.0), `USD` (rate≈0.286 — admin-configurable)
- Add `currency_code CHAR(3) DEFAULT 'TMT'` to `products` and `product_variants`
- Routes: `GET /admin/config/currencies`, `PATCH /admin/config/currencies/:code` (update rate)
- Buyer API: prices returned with currency symbol; optional `?currency=USD` conversion
- **Frontend**: currency badge on prices; exchange rate editor in admin Settings page

---

### 🌳 Phase I — Category & Brand Tree View *(1 day, frontend only)*

Backend already has `parent_id` on categories; Brands will have it after Phase E.

- Build reusable `TreeView` component: collapsible nodes, indent levels, expand/collapse all
- Wire to `CategoriesPage.jsx` — replace flat list with tree
- Wire to `BrandsPage.jsx` — same component
- Drag-to-reorder nodes → `PATCH /categories/:id` with new `display_order` + `parent_id`
- **Files**: new `frontend/src/components/ui/TreeView.jsx`, `frontend/src/pages/admin/CategoriesPage.jsx`

---

### 🖼️ Phase J — Media Gallery Type Enforcement *(1 day)*

**Migration**: `028_media_types.sql`

- Update `ProductMedia`: add `type ENUM('image', 'video', 'image_360', 'model_3d') DEFAULT 'image'`
- Add `display_order INTEGER DEFAULT 0` to `ProductImage`
- Gallery endpoint returns items ordered by `display_order`
- 360° images rendered with panorama viewer on product detail
- **Frontend**: separate tabs in product gallery editor for each type; drag-to-reorder images
- **Files**: `__modules__/catalog/models/ProductMedia.model.js`, `__modules__/catalog/models/ProductImage.model.js`

---

### 🌍 Phase K — Backend Multilingual Fields *(2–3 days)*

**Migration**: `029_multilingual_fields.sql`

- Add `name_tk, name_ru, name_en` to: `Category`, `Brand`, `Supplier`, `BannerType`
- API responds with correct locale based on `Accept-Language` header or `?lang=tk|ru|en`
- **Files**: models in `catalog`, `banners`, `brands`, `suppliers` modules

---

### 🪙 Phase L — Coin Economy *(est. 3–4 weeks)*

Highest-priority missing monetization feature. Blocks auctions, AI quotas, livestream gifts.

**Migrations**: `030_coin_conditions.sql`, `031_coin_transactions.sql`, `032_coin_topups.sql`

#### L1. CoinCondition *(1 day)*
- `CoinCondition.model.js`: `id, name, source_event ENUM(ORDER_PLACED/REVIEW_WRITTEN/REFERRAL/TASK/SCAN), coins_amount INTEGER, is_active BOOLEAN, max_per_user_per_day INTEGER NULL`
- Admin CRUD: `GET/POST/PUT/DELETE /admin/coins/conditions`
- Auto-trigger on matching events (hook into OrderService, ReviewService)

#### L2. CoinTransaction *(2–3 days)*
- `CoinTransaction.model.js`: `user_id, amount INTEGER, type ENUM(EARN/SPEND/WITHDRAW/REFUND), source, reference_id, balance_after INTEGER, note, created_at`
- `UserCoin.model.js`: `user_id UNIQUE, balance INTEGER DEFAULT 0`
- `CoinService`: `credit(userId, amount, source, refId)`, `debit(userId, amount, source, refId)` (throws `InsufficientCoins`), `getBalance(userId)`, `getHistory(userId)`
- Auto-create wallet row on user registration

#### L3. CoinTopup *(1–2 days)*
- `CoinTopup.model.js`: `user_id, amount_tmt DECIMAL, coins_requested INTEGER, status ENUM(pending/approved/rejected), receipt_url, reviewed_by, note, created_at`
- Routes: `POST /buyer/coins/topup`, `GET /buyer/coins/topup`, `PATCH /admin/coins/topup/:id/status`

#### L4. Admin coin management *(1 day)*
- `POST /admin/coins/grant` — batch issue to user(s)
- `GET /admin/coins/user/:userId` — balance + history
- Add `coin_tmt_rate DECIMAL(10,4) DEFAULT 0.001` to `configurations` (100 coins = 0.10 TMT)

- Permissions: `COIN_GET (69)`, `COIN_POST (70)`, `COIN_PUT (71)`, `COIN_DELETE (72)`

---

### 🏦 Phase 4 — Payment Gateway *(est. 3–5 weeks)*

#### 4a. Altyn Asyr bank integration *(2–3 weeks)*
- Requires bank API docs from client
- New service: `backend/services/payment-gateway/altyn-asyr.js`
- Endpoints: initiate, webhook callback, status poll
- Escrow: hold on CONFIRMED, release to `seller_balances` on CLOSED

#### 4b. TMCELL Coin top-up *(1 week)*
- User submits top-up request with TMCELL balance receipt
- Admin verifies → `CoinService.credit`

---

### 🔔 Phase 5 — FCM Push Notifications *(est. 1 week)*

- `npm install firebase-admin`
- New service: `backend/services/fcm.js`
- Trigger points: new order → seller; status change → buyer; shop verified/rejected → owner; auction outbid → bidder; low balance → seller

---

### 🔍 Phase 6 — Search & Discovery *(est. 2 weeks)*

- PostgreSQL `tsvector` full-text search on products
- Faceted filters: `price_min`, `price_max`, `rating_min`, `tags`, `brand_id`, `supplier_id`
- VIP search analytics: log queries → `GET /admin/analytics/search-keywords`

---

### 🎯 Phase 7 — Auction System *(est. 3–4 weeks)*

New module: `backend/__modules__/auctions/`
- `Auction.model.js`, `AuctionBid.model.js`
- Socket.io room `auction:{id}` for real-time bids
- Bid freeze: bid in last 30s → extend by 30s
- On close: create Order for winner; trigger CoinService if Coin-denominated
- Permissions: `AUCTION_GET (73)`, `AUCTION_POST (74)`, `AUCTION_PUT (75)`, `AUCTION_DELETE (76)`

---

### 📡 Phase M — Video Streaming *(est. 6–8 weeks)*

Most infrastructure-heavy feature. Requires separate media server.

#### Ma. Media server *(2 weeks)*
- Deploy Ant Media Server or Agora (separate infrastructure)
- Node.js creates stream room → returns RTMP ingest URL to Flutter
- Flutter → RTMP → Media Server → HLS/WebRTC → viewers

#### Mb. Lives module *(1 week)*
New module: `backend/__modules__/lives/`
- `Live.model.js`: shop_id, title, stream_key, thumbnail, status (SCHEDULED/LIVE/ENDED), viewer_count, started_at, ended_at

#### Mc. Live chat + gifts *(1 week)*
- Reuse `ChatRoom`/`ChatMessage` for live chat (add `live_id` FK)
- Gift = `CoinService.debit(viewer)` → `CoinService.credit(streamer, 70%)` + platform 30%
- Socket.io room `live:{id}` for chat, viewer count, gift animations
- Permissions: `LIVE_GET (77)`, `LIVE_POST (78)`, `LIVE_PUT (79)`, `LIVE_DELETE (80)`

---

### 🛵 Phase 10 — Courier GPS Tracking *(est. 1–2 weeks)*

Extends existing `delivers` module:
- Add `latitude DECIMAL(10,7)`, `longitude DECIMAL(10,7)`, `last_seen_at` to `delivers`
- Migration `033_deliver_location.sql`
- Endpoint: `PATCH /delivers/:id/location` — courier app pings every 1.5s
- Socket.io: emit `courier:location` to room `order:{id}`

---

### 🤖 Phase 9 — AI Assistant / Accio *(est. 2–3 weeks)*

- Gemini API integration: `backend/services/gemini.js`
- `UserAiUsage.model.js`: user_id, month DATE, text_count, image_count
- Quota: Basic=5/mo, VIP=50/mo, Premium=unlimited
- Image auto-moderation on product upload
- Permissions: `AI_GET (81)`, `AI_POST (82)`, `AI_PUT (83)`, `AI_DELETE (84)`

---

### 🎮 Phase 11 — Gamification, Brand Mission, Service+ *(est. 4–6 weeks)*

**Do not start before Phase L Coin economy is stable.**
- User levels (1–5 based on orders, scans, time active)
- Coin scan bonus: scan 30 unique products → auto-earn
- Brand Mission: PRO seller creates campaign → creators apply → best video gets Coin reward
- Service+: professional listings (not physical products)

---

## Priority Queue (next 6 months)

| Priority | Feature | Est. Time | Blocks |
|---|---|---|---|
| **P0** | Commission by plan (2a) | 2 days | Revenue accuracy |
| **P0** | Subscription enforcement (2b) | 4 days | Business model validity |
| **P1** | Banner enhancements (Phase A) | 1 day | Store-specific promotions |
| **P1** | Product Tags (Phase B) | 1 day | Catalog discoverability |
| **P1** | Product Scheduling (Phase C) | 1 day | Seller control |
| **P1** | Favorites (Phase D) | 1 day | Buyer engagement |
| **P1** | Brands (Phase E) | 3 days | Catalog quality |
| **P1** | Suppliers (Phase F) | 2 days | Procurement tracking |
| **P1** | KYC documents (2c) | 3 days | Trust + compliance |
| **P1** | FCM push notifications (Phase 5) | 1 week | User engagement |
| **P2** | Comments (Phase G) | 2 days | Engagement |
| **P2** | Currency support (Phase H) | 2 days | USD pricing |
| **P2** | Category tree view (Phase I) | 1 day | UX |
| **P2** | Media gallery types (Phase J) | 1 day | 360° / video products |
| **P2** | Multilingual backend (Phase K) | 3 days | Full localization |
| **P2** | Coin economy (Phase L) | 3 weeks | Auctions, AI, livestream gifts |
| **P2** | Payment gateway (Phase 4) | 3 weeks | Real money flow |
| **P2** | Full-text search (Phase 6) | 2 weeks | Product discovery |
| **P3** | Auction system (Phase 7) | 4 weeks | Premium tier value |
| **P3** | Live streaming (Phase M) | 8 weeks | Top engagement driver |
| **P3** | AI assistant (Phase 9) | 3 weeks | VIP/Premium differentiator |
| **P3** | Courier GPS tracking (Phase 10) | 2 weeks | Logistics UX |
| **P4** | Gamification (Phase 11) | 5 weeks | Retention |
| **P4** | Brand Mission (Phase 11) | 4 weeks | Influencer economy |

---

## Migration Index

| File | Purpose |
|---|---|
| 001_shopify_fields.sql | Product/variant Shopify-like fields; discounts table |
| 002_banners.sql | Banners table |
| 003_shop_members.sql | Shop members with role enum |
| 004_shipments.sql | Shipment tracking |
| 005_payouts.sql | Seller balance + payout requests |
| 006_flash_sales.sql | Flash sale model |
| 007_delivery_addresses.sql | Structured delivery addresses |
| 008_shop_verification.sql | Shop verification workflow fields |
| 009_disputes.sql | Dispute resolution |
| 010_review_replies.sql | Seller replies to reviews |
| 011_commission_rate.sql | Global commission rate in configurations |
| 012_banner_types.sql | Banner type classification |
| 013_shop_application_deliver.sql | Shop multilingual descriptions + delivers table |
| 014_subscriptions.sql | Plans + shop_subscriptions; plan_id on shops |
| 015_plan_commission.sql | **Phase 2a** — commission_rate per plan |
| 016_kyc.sql | **Phase 2c** — KYC documents |
| 017_device_tokens.sql | **Phase 2e** — FCM device tokens on users |
| 018_coins.sql | (reserved) |
| 019_warehouses.sql | Warehouses, inventory levels, stock movements |
| 020_banner_enhancements.sql | **Phase A** — url, shop_id, display_order on banners |
| 021_product_tags.sql | **Phase B** — product_tags + product_tag_map |
| 022_product_scheduling.sql | **Phase C** — scheduled_at, is_published on products |
| 023_favorites.sql | **Phase D** — favorites table |
| 024_brands.sql | **Phase E** — brands table + brand_id on products |
| 025_suppliers.sql | **Phase F** — suppliers table + supplier_id on products |
| 026_comments.sql | **Phase G** — comments table |
| 027_currencies.sql | **Phase H** — currencies table + currency_code on products |
| 028_media_types.sql | **Phase J** — type ENUM + display_order on ProductMedia/ProductImage |
| 029_multilingual_fields.sql | **Phase K** — _tk/_ru/_en name fields on Category, Brand, etc. |
| 030_coin_conditions.sql | **Phase L1** — coin earning conditions |
| 031_coin_transactions.sql | **Phase L2** — user_coins + coin_transactions |
| 032_coin_topups.sql | **Phase L3** — coin top-up requests |
| 033_deliver_location.sql | **Phase 10** — GPS fields on delivers |

---

## Permission ID Continuity

| Range | Reserved for |
|---|---|
| 1–56 | Implemented (user, shop, catalog, order, review, discount, banner, payout, dispute) |
| 57–60 | Delivers module |
| 61–64 | KYC / Verification |
| 65–68 | Subscriptions |
| 69–72 | Coins module |
| 73–76 | Auctions module |
| 77–80 | Lives module |
| 81–84 | AI / Accio module |
| 86–89 | Brands module |
| 90–93 | Suppliers module |
| 94–97 | Comments module |
| 98–101 | Favorites module |
| 102–105 | Currencies module |
| 106–108 | Favorites buyer actions |
| 109+ | Future modules |
