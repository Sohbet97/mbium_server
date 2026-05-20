# mbium Platform — Roadmap & Implementation Plan

*Last updated: 2026-05-19. Reflects migration state through 014, all 13 backend modules.*

---

## What the PDFs Require vs. What Exists

| Feature | PDF Requirement | Current State |
|---|---|---|
| Core marketplace | Auth, Shops, Catalog, Orders, Cart, Reviews | ✅ Done (~85%) |
| Subscription tiers | Basic/VIP/Premium plans with feature flags | ✅ Model + seeder done; **enforcement missing** |
| Commission by plan | 15% / 8-10% / 5% per tier | ❌ Still global rate only (`configurations` table) |
| Delivers module | Driver CRUD + real-time GPS tracking (1.5s) | ⚠️ CRUD done; real-time tracking not started |
| Coin economy | 100 Coin = 0.10 TMT, wallet, earn/spend ledger | ❌ Only plan feature flags (no module) |
| Altyn Asyr payment | Bank gateway integration | ❌ PaymentTransaction log only |
| Auction system | Real-time bids via WebSocket, bid history | ❌ Only plan feature flag |
| Live streaming | RTMP/WebRTC + Media Server + live chat | ❌ Only plan feature flag |
| AI Assistant (Accio) | Gemini API, per-plan usage quotas | ❌ Not started |
| FCM push notifications | New order, auction win, campaigns | ❌ Socket.io in-app only |
| Full-text search | Elasticsearch/Algolia product search | ❌ Listed in package.json, not integrated |
| KYC documents | Identity docs before shop goes live | ❌ Planned in old roadmap, not built |
| VIP Analytics | Search keywords, product views (100+ unique) | ❌ Not started |
| Shop application flow | Public /me/shop apply + owner notification | ⚠️ Endpoints exist; rejection notification unverified |
| Courier GPS tracking | 1.5s real-time location via Socket.io | ❌ Not started |
| Brand Mission | Influencer campaign system | ❌ Far future |
| Service+ | Freelancer/professional listings | ❌ Far future |
| Gamification | Levels, coin bonuses, scan rewards | ❌ Far future |
| Mbium Lens | Image-to-product search | ❌ Far future |
| 360° Virtual Tour | PRO shop virtual walkthrough | ❌ Far future |
| Group Buy | Collective purchase discounts | ❌ Far future |

---

## Module Completion Matrix

| Module | Models | Routes | Status |
|---|---|---|---|
| user | ✅ | ✅ | Complete |
| shops | ✅ | ✅ | Complete (anketa endpoint exists) |
| catalog | ✅ | ✅ | Complete |
| orders | ✅ | ✅ | Complete |
| reviews | ✅ | ✅ | Complete |
| discounts | ✅ | ✅ | Complete |
| banners | ✅ | ✅ | Complete |
| payouts | ✅ | ✅ | Complete |
| disputes | ✅ | ✅ | Complete |
| delivers | ✅ | ✅ | CRUD only — GPS tracking missing |
| subscriptions | ✅ | ✅ | Data stored — **zero enforcement** |
| media | ✅ | ✅ | Complete |
| coins | ❌ | ❌ | Not started |
| auctions | ❌ | ❌ | Not started |
| lives | ❌ | ❌ | Not started |
| ai / accio | ❌ | ❌ | Not started |

---

## Honest Criticism

### 1. Subscription plans are data without enforcement
`Plan.model.js` stores `product_limit`, `ai_credits`, `auction_per_week`, `live_stream_mode`, `hotspot`, `verified_badge`. None of these are checked anywhere in the codebase. A Basic shop can create unlimited products right now. The gating layer is entirely missing.

### 2. Commission engine is global, not per-plan
`011_commission_rate.sql` puts one flat rate in the `configurations` table. The PDFs require 15% for Basic, 8-10% for VIP, 5% for Premium. `plan_id` was added to `shops` in migration 014 but `OrderService._applyCommission` still reads the global config.

### 3. Delivers = driver registry, not logistics
The module covers driver profiles (CRUD). The PDF requires real-time GPS at 1.5s intervals via Socket.io, QR-code order confirmation, and a courier mobile flow. Current state is roughly 5% of what's needed.

### 4. No Coin module
Coins are the central monetization mechanism — earn from ad tasks, spend on AI, livestream gifts, promotions. There is no `user_coins`, `coin_transactions` table, no wallet, no ledger. This is the largest gap against the monetization PDFs.

### 5. No payment gateway
`PaymentTransaction` is a log, not a gateway. No Altyn Asyr bank API, no webhook handler, no escrow logic. All order "payments" are manual status updates.

### 6. Plans linked to shops, not users
`shop_subscriptions` is shop-level, which is correct for commission and product limits. But Coin balance and AI usage quotas are user-level. There is no `user_ai_usage` counter table.

### 7. Migrations have no runner
Migrations are raw SQL files in `/migrations/`. There is no migration runner, no tracking table, no rollback. This is a maintainability risk as the number grows.

---

## Realistic Implementation Plan

---

### ✅ Phase 1 — Core Commerce (COMPLETE)

Auth, Shops, Catalog, Orders, Cart, Reviews, Discounts, Banners, Payouts, Disputes, Delivers CRUD, Subscriptions data model.
**Stable foundation. No rework needed.**

---

### 🔨 Phase 2 — Platform Integrity *(est. 2-3 weeks, CURRENT)*

#### 2a. Commission by plan tier *(1-2 days)*
- Add `commission_rate DECIMAL(5,4)` to `plans` table → migration `015_plan_commission.sql`
- Seed: Basic=0.15, VIP=0.09, Premium=0.05
- Update `OrderService._applyCommission()` to read `shop → shop_subscription → plan → commission_rate`
- Files: `__modules__/orders/services/orders.js`, `__modules__/subscriptions/models/Plan.model.js`

#### 2b. Subscription enforcement *(3-4 days)*
- New util: `backend/utils/plan-limits.js` → `checkProductLimit(shopId)`, `checkAuctionQuota(shopId)`, `checkLiveStreamAccess(shopId)`
- Hook `checkProductLimit` into `ProductController.create`
- Files: new `plan-limits.js`, `__modules__/catalog/controllers/product.js`

#### 2c. KYC document submission *(2-3 days)*
- Model: `KycDocument` → shop_id, type (PASSPORT/TAX_ID/BUSINESS_REG), file_url, status, reviewed_by, note
- Migration `016_kyc.sql`
- Routes: `POST /admin/shops/:id/kyc`, `PATCH /admin/shops/:id/kyc/:docId/status`

#### 2d. Shop rejection notification *(1 day)*
- Add `NOT_SHOP_REJECTED: 111` to `backend/utils/statuses.js`
- Update `ShopService.reject()` to emit to shop owner via Socket.io
- Files: `services/notifications.js`, `__modules__/shops/services/shops.js`

#### 2e. FCM device token storage *(1 day)*
- Add `device_tokens JSONB DEFAULT '[]'` to `users` table → migration `017_device_tokens.sql`
- Endpoint: `PATCH /auth/me/device-token`
- Prepares for Phase 5 FCM triggers

---

### 🪙 Phase 3 — Coin Economy *(est. 3-4 weeks)*

Highest-priority missing feature. Blocks auctions, AI, livestream gifts, promotions.

#### 3a. Data model *(2-3 days)*
New module `backend/__modules__/coins/`:
- `UserCoin.model.js` → user_id (unique), balance INTEGER (in coins)
- `CoinTransaction.model.js` → user_id, amount, type (EARN/SPEND/WITHDRAW/REFUND), source (ORDER/AI/TASK/GIFT/PROMO/MANUAL), reference_id, note
- Migration `018_coins.sql`
- Auto-create wallet row on user registration (hook into UserService.create)

#### 3b. CoinService *(3-4 days)*
- `credit(userId, amount, source, referenceId)` — atomic UPDATE + INSERT transaction log
- `debit(userId, amount, source, referenceId)` — throws `InsufficientCoins` if balance < amount
- `getBalance(userId)`
- `getHistory(userId, filters)`

#### 3c. Admin coin management *(1-2 days)*
- `POST /admin/coins/grant` — batch issue to user(s)
- `GET /admin/coins/user/:userId` — balance + history

#### 3d. Conversion rate *(0.5 day)*
- Add `coin_tmt_rate DECIMAL(10,4) DEFAULT 0.001` to `configurations` (100 coins = 0.10 TMT → rate = 0.001)

#### 3e. Coin withdrawal *(2-3 days)*
- Withdrawal = `PayoutRequest` with type=COIN
- Admin approves → `CoinService.debit` + record bank transfer note
- Min withdrawal: 100 TMT = 100,000 coins

---

### 🏦 Phase 4 — Payment Gateway *(est. 3-5 weeks)*

#### 4a. Altyn Asyr bank integration *(2-3 weeks)*
- Requires bank API docs from client — obtain before starting
- New service: `backend/services/payment-gateway/altyn-asyr.js`
- Endpoints: initiate, webhook callback, status poll
- Escrow: hold funds on CONFIRMED, release to `seller_balances` on CLOSED

#### 4b. TMCELL Coin top-up *(1 week)*
- User submits top-up request with TMCELL balance receipt
- Admin verifies manually → `CoinService.credit`
- Auto-verify is future scope (requires TMCELL API agreement)

---

### 🔔 Phase 5 — FCM Push Notifications *(est. 1 week)*

#### 5a. Firebase Admin SDK *(2 days)*
- `npm install firebase-admin`
- New service: `backend/services/fcm.js`

#### 5b. Trigger points *(3 days)*
- New order created → seller push
- Order status changed → buyer push
- Shop verified / rejected → owner push
- Auction outbid → bidder push (when auctions live)
- Low balance warning → seller push

---

### 🔍 Phase 6 — Search & Discovery *(est. 2 weeks)*

#### 6a. Full-text search *(1 week)*
- Use **PostgreSQL `tsvector`** (free, sufficient for TM market scale)
- Add `search_vector tsvector` to `products`, populate via DB trigger on insert/update
- New endpoint: `GET /api/products/search?q=&category=&price_min=&price_max=`

#### 6b. Faceted filters *(3-4 days)*
- Extend `ProductService.getFilter()` with `price_min`, `price_max`, `rating_min`, `tags` (array overlap), `attributes` (JSONB containment)
- File: `__modules__/catalog/services/products.js`

#### 6c. VIP search analytics *(2-3 days)*
- Log search queries to `search_logs` table (query, user_id, result_count, timestamp)
- `GET /admin/analytics/search-keywords` → aggregate top keywords (VIP/Premium only)

---

### 🎯 Phase 7 — Auction System *(est. 3-4 weeks)*

New module: `backend/__modules__/auctions/`

#### Models:
- `Auction.model.js` → shop_id, product_id, start_price, current_price, reserve_price, starts_at, ends_at, status (DRAFT/ACTIVE/CLOSED/CANCELLED), winner_id, bid_count
- `AuctionBid.model.js` → auction_id, user_id, amount, is_winning

#### Real-time logic:
- Socket.io room `auction:{id}` — broadcast every new bid instantly
- Bid validation: amount must exceed current_price by minimum increment
- "Bid Freeze": bid in last 30s → extend auction by 30s automatically
- On close: create Order for winner; trigger CoinService if Coin-denominated

#### Plan enforcement:
- Check `plan.auction_per_week` counter before shop creates auction

---

### 📡 Phase 8 — Live Streaming *(est. 6-8 weeks)*

Most infrastructure-heavy feature. Requires a separate media server.

#### 8a. Media server *(2 weeks)*
- Deploy Ant Media Server or Agora (separate infrastructure, not in this repo)
- Node.js creates stream room via media server API → returns RTMP ingest URL to Flutter
- Flutter → RTMP → Media Server → HLS/WebRTC → viewers

#### 8b. Lives module *(1 week)*
New module: `backend/__modules__/lives/`
- `Live.model.js` → shop_id, title, stream_key, thumbnail, status (SCHEDULED/LIVE/ENDED), viewer_count, started_at, ended_at

#### 8c. Live chat + gifts *(1 week)*
- Reuse existing ChatRoom/ChatMessage for live chat (add `live_id` FK)
- Gift = `CoinService.debit(viewer)` → `CoinService.credit(streamer, 70%)` + platform 30%
- Socket.io room `live:{id}` for chat messages, viewer count, gift animations

#### 8d. Plan enforcement:
- `live_stream_mode`: 0=none, 1=view_only, 2=limited (VIP: 2/month), 3=unlimited (Premium)

---

### 🤖 Phase 9 — AI Assistant / Accio *(est. 2-3 weeks)*

#### 9a. Gemini API integration *(3-4 days)*
- `npm install @google/generative-ai`
- New service: `backend/services/gemini.js`
- Capabilities: text Q&A, product image analysis, content moderation

#### 9b. Usage quota enforcement *(2-3 days)*
- `UserAiUsage.model.js` → user_id, month DATE, text_count, image_count
- Check against plan: Basic=5/mo, VIP=50/mo, Premium=200/mo or unlimited
- Deduct Coins for paid overage

#### 9c. Image auto-moderation *(1 week)*
- On product image upload → Gemini content check → auto-approve or flag

---

### 🛵 Phase 10 — Courier GPS Tracking *(est. 1-2 weeks)*

Extends existing `delivers` module (no new module needed):

- Add `latitude DECIMAL(10,7)`, `longitude DECIMAL(10,7)`, `last_seen_at` to `delivers` table
- Migration `019_deliver_location.sql`
- Endpoint: `PATCH /delivers/:id/location` — courier mobile app pings every 1.5s (JWT-authenticated)
- Socket.io: emit `courier:location` event to room `order:{id}` on each ping
- Buyer subscribes to room → live map in Flutter app

---

### 🎮 Phase 11 — Gamification, Brand Mission, Service+ *(est. 4-6 weeks)*

**Do not start before Phase 3 Coin economy is stable.**

- User levels (Level 1-5 based on orders, scans, time active)
- Coin scan bonus: scan 30 unique products → auto-earn coins (Level 3+, VIP)
- Brand Mission: PRO seller creates campaign → creators apply → best video gets Coin reward
- Service+: professional profiles with service listings (not physical products)

---

## Priority Queue (next 6 months)

| Priority | Feature | Est. Time | Blocks |
|---|---|---|---|
| **P0** | Commission by plan | 2 days | Revenue accuracy |
| **P0** | Subscription enforcement | 4 days | Business model validity |
| **P1** | Coin economy module | 3 weeks | Auctions, AI, livestream gifts |
| **P1** | KYC documents | 3 days | Trust + compliance |
| **P1** | FCM push notifications | 1 week | User engagement |
| **P2** | Altyn Asyr payment gateway | 3 weeks | Real money flow |
| **P2** | Full-text search | 2 weeks | Product discovery |
| **P2** | Auction system | 4 weeks | Premium tier value |
| **P3** | Live streaming | 8 weeks | Top engagement driver |
| **P3** | AI assistant | 3 weeks | VIP/Premium differentiator |
| **P3** | Courier GPS tracking | 2 weeks | Logistics UX |
| **P4** | Gamification | 5 weeks | Retention |
| **P4** | Brand Mission | 4 weeks | Influencer economy |

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
| 015_plan_commission.sql | **NEXT** — commission_rate per plan |
| 016_kyc.sql | **NEXT** — KYC documents |
| 017_device_tokens.sql | **NEXT** — FCM device tokens on users |
| 018_coins.sql | **Phase 3** — user_coins + coin_transactions |
| 019_deliver_location.sql | **Phase 10** — GPS fields on delivers |

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
| 85+ | Future modules |
