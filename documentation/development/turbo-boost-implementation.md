# Turbo Boost Implementation Plan

*Last updated: 2026-08-10*

---

## Overview

"Turbo" lets a seller pay to have a product rank first in mobile search/category listings for a period, using tiered packages priced in both TMT and Coin. The seller picks either currency at purchase time.

| Package | Refresh interval | Price (TMT) | Price (Coin) |
|---|---|---|---|
| Turbo 24 | every 24h | 10 | 100 |
| Turbo 12 | every 12h | 20 | 200 |
| Turbo 6  | every 6h  | 40 | 400 |
| Turbo 3  | every 3h  | 85 | 850 |
| Turbo 1  | every 1h  | 150 | 1,500 |

All packages run for **7 days**; the "refresh interval" controls how often the boost's sort-priority timestamp is renewed within that window (see Part 2).

Investigating the payment side surfaced gaps bigger than Turbo itself:
- No unified purchase-transaction system spanning both wallets — Coin is per-user (`UserCoinBalance`/`CoinService`), TMT is per-shop (`SellerBalance`/payouts module), and they're two unrelated ledgers with no shared "purchase" concept.
- The seller web panel has no page at all for the Coin wallet (no balance view, no top-up, no transaction history) — only the TMT payouts page exists.
- The admin Coins panel (`AdminCoinsPage.jsx`) has Wallets/Conditions/Topups tabs but no cross-user "all transactions" feed — `CoinService` only exposes `getHistory(userId)` (single user), no `getAllTransactions(filter)`.

This is split into two parts so the wallet/payment groundwork can be built and shipped independently before Turbo depends on it:
- **Part 1** — Coin wallet completeness + a unified transaction system (`WalletTransaction`) that both Coin and TMT purchases write through. Becomes the payment foundation for Turbo *and* any future paid feature (this doc's spend-event list already anticipated "Promoted listing boost" — see [coins-implementation.md](coins-implementation.md)).
- **Part 2** — Turbo boost itself, implemented as the first consumer of Part 1's `PurchaseService`.

The mobile app lives in a separate repo — Part 2's mobile-facing surface is backend API only (`backend/routes/buyer/turbo.js`). Part 1's UI work is entirely in `frontend/` (admin + seller web panels).

---

## Part 1: Coin wallet & unified transactions

### 1a. Unified transaction ledger (backend)

New module `backend/__modules__/wallet/` — a currency-agnostic "pay for something with TMT or Coin" building block that Turbo (Part 2) and future paid features reuse instead of each reinventing payment branching.

**`WalletTransaction` model** — table `wallet_transactions`:
- `id, user_id, shop_id, feature (e.g. 'TURBO_BOOST'), reference_id, currency (TMT|COIN), amount, status (COMPLETED|FAILED|REFUNDED), coin_transaction_id (nullable FK → CoinTransaction), seller_transaction_id (nullable FK → SellerTransaction), note, createdAt`

**`PurchaseService.charge({ userId, shopId, currency, amount, feature, referenceId, note })`** in `backend/__modules__/wallet/services/PurchaseService.js`:
- `currency === 'COIN'` → existing `CoinService.debit(userId, amount, feature, referenceId, note)` (`backend/__modules__/coins/services/CoinService.js:65-104`), unchanged.
- `currency === 'TMT'` → new `PayoutService.debitForPurchase(shopId, amount, type, referenceId, note)` in `backend/__modules__/payouts/services/payouts.js`, copying the atomic conditional-decrement pattern from the existing `debitForPayout` (lines 153-172: `UPDATE ... SET available_balance = available_balance - amount WHERE shop_id = ? AND available_balance >= amount`, throws `"Balans ýeterlik däl"` on `affected === 0`). Requires a new `SELLER_TRANSACTION_TYPES.PURCHASE_DEBIT` entry alongside the existing `ORDER_CREDIT|COMMISSION|PAYOUT_DEBIT|PAYOUT_REVERSAL` enum (`SellerTransaction.model.js:3-8`).
- Both branches run in one DB transaction, then insert the `WalletTransaction` row linking to whichever underlying ledger row was created, and return it.

Migration: `backend/migrations/057_wallet_transactions.sql`.

### 1b. Admin-wide Coin transactions feed (currently missing)

- `CoinService.getAllTransactions(filter = {}, limit, skip)` in `CoinService.js` — cross-user query over `CoinTransaction` (filterable by `user_id`, `type`, `source`, date range), alongside the existing single-user `getHistory(userId)`.
- New route `GET /coins/transactions` in `backend/__modules__/coins/routes/coin.routes.js` → `CoinController.getAllTransactions`.
- New **"Transactions"** tab in `frontend/src/pages/admin/AdminCoinsPage.jsx` (append to the `TABS` array at line 547, alongside `tabWallets/tabConditions/tabTopups`) — a table like `TopupsTab`/`WalletsTab` but listing every `CoinTransaction` with filters for user/type/source/date. Add `AdminApi.coins.getTransactions(params)` wrapper in `frontend/src/lib/api.js:243-254`.
- Once `WalletTransaction` (1a) exists, this tab (or a follow-up) should read from it instead so it shows TMT-funded purchases too, not just Coin ones — same idea as the seller-side unification below.

### 1c. Seller-web Coin wallet page (currently missing entirely)

The seller panel (`frontend/src/pages/seller/`) has `SellerPayoutsPage.jsx` for the TMT wallet but nothing for Coin. The backend already supports it — `GET /buyer/coins/balance`, `/history`, `POST /topup`, `GET /topup` — already wrapped as `BuyerApi.coins` in `frontend/src/lib/api.js:325-330`, using the same `http` client/token as the seller panel. No backend changes needed for the Coin-only half:

1. New `frontend/src/pages/seller/SellerCoinsPage.jsx` — balance card, paginated transaction history (`BuyerApi.coins.getHistory()`), and a top-up form/modal (`BuyerApi.coins.submitTopup()`) plus the seller's own topup request list (`BuyerApi.coins.getTopups()`). Model the layout on `SellerPayoutsPage.jsx`.
2. Route: `{ path: 'coins', element: <SellerCoinsPage /> }` under `/seller` in `frontend/src/App.jsx` (~line 148-151, next to `payouts`/`subscription`).
3. Menu entry in `frontend/src/components/layout/Sidebar.jsx` (or `SellerLayout.jsx`) pointing at `/seller/coins`.
4. Once `WalletTransaction` (1a) + `GET /buyer/wallet/transactions` exist, add a combined "all purchases" tab/section on this page (`SellerApi.wallet.getTransactions()`) showing Coin- and TMT-funded purchases together with a currency badge, instead of the seller having to check two separate pages.

### Part 1 verification
- Admin: open Coins → Transactions tab, confirm it lists transactions across multiple users with working filters.
- Seller: open `/seller/coins`, confirm balance/history/top-up all work end-to-end (submit a top-up, see it in "my topups", have admin approve it via the existing Topups tab, confirm balance updates).
- Unit-test `PurchaseService.charge` for both currencies independently: insufficient-balance rollback, and exactly one `WalletTransaction` row produced per charge, correctly linked to the underlying `CoinTransaction`/`SellerTransaction` row.

---

## Part 2: Turbo boost (built on Part 1)

### Data model

New module `backend/__modules__/turbo/` (mirrors the `subscriptions` module's shape — priced, timed, tiered).

**`TurboPackage`** — table `turbo_packages`: `id, tier_hours (24|12|6|3|1), price_tmt, price_coin, duration_days (default 7), is_active`

**`ProductTurboBoost`** — table `product_turbo_boosts`: `id, product_id (FK), shop_id, package_id, tier_hours, started_at, expires_at, next_refresh_at, status (ACTIVE|EXPIRED), currency (TMT|COIN), paid_amount, wallet_transaction_id (FK → WalletTransaction)`. One active row per product (unique partial index on `product_id WHERE status='ACTIVE'`).

Denormalize onto `products` (avoids a join in the hot search path — `backend/services/search.js` is raw SQL touching `products` directly):
- `turbo_active (boolean, default false)`
- `turbo_boosted_at (timestamp, nullable)` — bumped on each refresh tick; sort key so higher-frequency tiers resurface to the top more often within the 7-day window.

Index on `(turbo_active, turbo_boosted_at)`. Migration: `backend/migrations/058_turbo_boosts.sql`.

### Purchase flow (buyer-app endpoints only — no seller-web/admin-web UI for buying Turbo itself)

New routes `backend/routes/buyer/turbo.js`, backed by `backend/__modules__/turbo/controllers/turbo.js` + `services/TurboService.js`:

- **`GET /buyer/turbo/packages`** — active `TurboPackage` rows (tier_hours, price_tmt, price_coin, duration_days) for the app's pricing table.
- **`POST /buyer/turbo/products/:id/purchase`** — body `{ tier_hours, currency: 'TMT'|'COIN' }`:
  1. Validate the product belongs to the requesting user's shop and is approved/active.
  2. Look up `TurboPackage` by `tier_hours`; pick `price_tmt`/`price_coin` by `currency`.
  3. `PurchaseService.charge({ userId, shopId, currency, amount, feature: 'TURBO_BOOST', referenceId: product.id })` — the only place currency branching happens (Part 1).
  4. In the same transaction, upsert `ProductTurboBoost` (block if one is already `ACTIVE` — no stacking) and set `products.turbo_active=true, turbo_boosted_at=NOW()`.
  5. Return the new boost's `expires_at`/`next_refresh_at`.
- **`GET /buyer/turbo/products/:id/status`** — current active boost (if any) for a product the user owns.

### Refresh & expiry (cron)

New job in `backend/config/app.js` (pattern: `PayoutService.releaseDueHolds`, `app.js:73-111`), every 5 minutes — `TurboService.tick()`:
- `next_refresh_at <= NOW()` and `status='ACTIVE'` → bump `products.turbo_boosted_at = NOW()`, advance `next_refresh_at += tier_hours`.
- `expires_at <= NOW()` → `status='EXPIRED'`, `products.turbo_active=false`.

### Sort integration (two places, keep in sync)

1. `backend/routes/buyer/catalog.js` — prepend to `BUYER_SORT_MAP[sort]`:
   ```js
   const order = [['turbo_active', 'DESC'], ['turbo_boosted_at', 'DESC'], ...BUYER_SORT_MAP[sort]];
   ```
2. `backend/services/search.js` (`searchProducts`, raw SQL FTS) — `ORDER BY p.turbo_active DESC, p.turbo_boosted_at DESC, rank DESC, p."createdAt" DESC`.

Add `is_turbo` (= `turbo_active`) to both paths' product response shape for the mobile badge.

### Anti-abuse
- Debit happens transactionally before activation, for either currency — no free boost on failure.
- TMT path uses the same atomic `WHERE available_balance >= amount` conditional update as `debitForPayout` — no double-spend race.
- No stacking: block purchase while an `ACTIVE` boost exists (avoids payment-loss disputes in either currency).
- `turbo_active` must never be settable via the generic product update endpoint (`ProductService.update` whitelist) — only through `TurboService`.

### Part 2 verification
- Purchase once with `currency: 'COIN'`, once with `currency: 'TMT'`; confirm the correct wallet decreases, the correct underlying transaction type is created, and both produce a `WalletTransaction` row.
- Confirm `GET /buyer/catalog/products` and `GET /buyer/catalog/search` return the boosted product first with `is_turbo: true`, regardless of funding currency.
- Fast-forward `next_refresh_at`/`expires_at` in DB, run the cron tick manually, confirm refresh bumps `turbo_boosted_at` and expiry flips `turbo_active` false and drops the product out of the boosted position.
