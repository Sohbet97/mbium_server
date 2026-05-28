# Coins Implementation Plan

*Last updated: 2026-05-26*

---

## Overview

The Embium Coin Economy is the central monetization mechanism. Coins let buyers earn rewards from purchases and reviews, spend on AI usage and livestream gifts, and withdraw as TMT cash.

**Rate**: 1 TMT = 100 Coins (1 coin = 0.01 TMT). Stored as `INTEGER` (whole coins, no fractions).

### Earn Events

| Event | Coins | Notes |
|---|---|---|
| Complete order (CLOSED) | 1 coin per 1 TMT spent | Goes to buyer |
| Write a review | 10 coins | First review per product only |
| Referral signup | 50 coins | Referred user must complete first order |
| Ad / scan task | Variable | Configured via `CoinCondition` table |
| Admin manual grant | Any | Admin panel only |

### Spend Events
- AI assistant usage (future, Phase 9)
- Livestream gifts (future, Phase M)
- Promoted listing boost (future)

### Withdrawal
Buyer submits topup/withdrawal request → admin approves → bank transfer. Minimum: 1000 coins (10 TMT).

### Plan Integration
`Plan` model already has `coin_earn` (BOOLEAN) and `coin_earn_priority` (BOOLEAN) fields:
- Basic plan: `coin_earn = false`
- VIP plan: `coin_earn = true, coin_earn_priority = false`
- Premium plan: `coin_earn = true, coin_earn_priority = true`

`coin_earn_priority` applies the `multiplier_priority` factor from `CoinCondition` (e.g. 1.5× coins).

---

## Database Schema

### `user_coin_balances`

```sql
CREATE TABLE user_coin_balances (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance      INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_coin_balances_user_id ON user_coin_balances(user_id);
```

One row per user. Created automatically on user registration via `CoinService.ensureWallet()`.

---

### `coin_conditions`

Configurable earning rules managed by admin. Decouples coin logic from hardcoded values.

```sql
CREATE TABLE coin_conditions (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  source_event          VARCHAR(50) NOT NULL,
  -- ORDER_CLOSED | REVIEW_WRITTEN | REFERRAL | TASK | MANUAL
  coins_amount          INTEGER NOT NULL CHECK (coins_amount > 0),
  multiplier_priority   DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  -- applied when buyer's shop plan has coin_earn_priority = true
  max_per_user_per_day  INTEGER,
  -- NULL = unlimited
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**`coins_amount` semantics by event**:
- `ORDER_CLOSED`: coins per 1 TMT spent (e.g. `1` → 1 coin per TMT)
- All others: flat coins per event occurrence

---

### `coin_transactions`

Immutable ledger — rows are only inserted, never updated or deleted.

```sql
CREATE TABLE coin_transactions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  amount        INTEGER NOT NULL,
  -- positive = credit, negative = debit
  type          VARCHAR(20) NOT NULL,
  -- EARN | SPEND | WITHDRAW | REFUND | GRANT | DEDUCT
  source        VARCHAR(50) NOT NULL,
  -- ORDER | REVIEW | REFERRAL | TASK | AI | GIFT | MANUAL
  reference_id  VARCHAR(100),
  -- order id, review id, etc.
  balance_after INTEGER NOT NULL,
  -- snapshot of balance after this transaction
  note          TEXT,
  created_by    UUID REFERENCES users(id),
  -- admin user id for GRANT/DEDUCT
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON coin_transactions(created_at DESC);
```

---

### `coin_topups`

Buyer submits a top-up request with a payment receipt; admin approves and coins are credited.

```sql
CREATE TABLE coin_topups (
  id               SERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES users(id),
  amount_tmt       DECIMAL(10,2) NOT NULL CHECK (amount_tmt > 0),
  coins_requested  INTEGER NOT NULL,
  -- = amount_tmt * 100
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING | APPROVED | REJECTED
  receipt_url      VARCHAR(500),
  note             TEXT,
  -- admin rejection reason
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coin_topups_user_id ON coin_topups(user_id);
CREATE INDEX idx_coin_topups_status ON coin_topups(status);
```

---

## Migration

**File**: `backend/migrations/030_coins.sql`

Contains all four tables above plus a configuration entry:

```sql
INSERT INTO configurations (key, value, description)
VALUES ('coin_tmt_rate', '0.01', '1 coin = N TMT. 100 coins = 1 TMT.')
ON CONFLICT (key) DO NOTHING;
```

---

## Module Structure

```
backend/__modules__/coins/
├── index.js                          registers routes into express app
├── models/
│   ├── UserCoinBalance.model.js
│   ├── CoinCondition.model.js
│   ├── CoinTransaction.model.js
│   └── CoinTopup.model.js
├── services/
│   └── CoinService.js
├── controllers/
│   └── coin.controller.js
└── routes/
    └── coin.routes.js
```

---

## CoinService

**File**: `backend/__modules__/coins/services/CoinService.js`

```javascript
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');

class CoinService {

  // Called on user registration — ensures wallet row exists
  static async ensureWallet(userId) {
    const [wallet] = await db.UserCoinBalance.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, balance: 0, total_earned: 0, total_spent: 0 }
    });
    return wallet;
  }

  // Atomic credit
  static async credit(userId, amount, source, referenceId = null, note = null, createdBy = null) {
    if (!Number.isInteger(amount) || amount < 1)
      throw ApiError.BadRequest('Coin amount must be a positive integer');

    const t = await db.sequelize.transaction();
    try {
      const wallet = await this.ensureWallet(userId);
      await db.UserCoinBalance.increment(
        { balance: amount, total_earned: amount },
        { where: { user_id: userId }, transaction: t }
      );
      await wallet.reload({ transaction: t });

      await db.CoinTransaction.create({
        user_id: userId,
        amount,
        type: createdBy ? 'GRANT' : 'EARN',
        source,
        reference_id: referenceId != null ? String(referenceId) : null,
        balance_after: wallet.balance,
        note,
        created_by: createdBy ?? null
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // Atomic debit — throws if balance insufficient
  static async debit(userId, amount, source, referenceId = null, note = null, createdBy = null) {
    if (!Number.isInteger(amount) || amount < 1)
      throw ApiError.BadRequest('Coin amount must be a positive integer');

    const t = await db.sequelize.transaction();
    try {
      const wallet = await db.UserCoinBalance.findOne({
        where: { user_id: userId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!wallet || wallet.balance < amount)
        throw ApiError.BadRequest('Insufficient coin balance');

      await db.UserCoinBalance.increment(
        { balance: -amount, total_spent: amount },
        { where: { user_id: userId }, transaction: t }
      );
      await wallet.reload({ transaction: t });

      await db.CoinTransaction.create({
        user_id: userId,
        amount: -amount,
        type: createdBy ? 'DEDUCT' : 'SPEND',
        source,
        reference_id: referenceId != null ? String(referenceId) : null,
        balance_after: wallet.balance,
        note,
        created_by: createdBy ?? null
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  static async getBalance(userId) {
    return db.UserCoinBalance.findOne({ where: { user_id: userId } });
  }

  static async getHistory(userId, limit = 20, skip = 0) {
    return db.CoinTransaction.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset: skip
    });
  }

  // Called from OrderService when order status → CLOSED (5)
  static async awardForOrder(order) {
    const condition = await db.CoinCondition.findOne({
      where: { source_event: 'ORDER_CLOSED', is_active: true }
    });
    if (!condition) return;

    // Check daily limit
    if (condition.max_per_user_per_day) {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayCount = await db.CoinTransaction.count({
        where: {
          user_id: order.user_id, source: 'ORDER',
          created_at: { [db.Sequelize.Op.gte]: todayStart }
        }
      });
      if (todayCount >= condition.max_per_user_per_day) return;
    }

    let coins = Math.floor(parseFloat(order.total_price) * condition.coins_amount);
    if (coins < 1) return;

    // Apply priority multiplier if buyer's shop plan has coin_earn_priority
    // (for seller plans — buyer gets base rate regardless)

    await this.credit(order.user_id, coins, 'ORDER', order.id,
      `Order #${order.id} completed`);
  }

  // Called from ReviewService on review create
  static async awardForReview(userId, reviewId, productId) {
    const condition = await db.CoinCondition.findOne({
      where: { source_event: 'REVIEW_WRITTEN', is_active: true }
    });
    if (!condition) return;

    // Only first review per product earns coins
    const prev = await db.CoinTransaction.count({
      where: { user_id: userId, source: 'REVIEW', reference_id: String(productId) }
    });
    if (prev > 0) return;

    await this.credit(userId, condition.coins_amount, 'REVIEW', reviewId,
      `Review on product #${productId}`);
  }

  // Admin: bulk grant
  static async adminGrant(userIds, amount, note, adminId) {
    for (const uid of userIds) {
      await this.credit(uid, amount, 'MANUAL', null, note, adminId);
    }
  }
}

module.exports = CoinService;
```

---

## Integration Points

### 1. Order closed → award coins
**File**: `backend/__modules__/orders/services/orders.js`

In `updateStatus()`, after `_applyCommission(order)` when `newStatus === 5`:

```javascript
const CoinService = require('../../../__modules__/coins/services/CoinService');
// ...
if (newStatus === 5) {
  await this._applyCommission(order);
  await CoinService.awardForOrder(order).catch(() => {}); // non-blocking
}
```

### 2. Review created → award coins
**File**: `backend/__modules__/reviews/services/reviews.js`

In `create()`, after review is saved:

```javascript
const CoinService = require('../../../__modules__/coins/services/CoinService');
// after: await db.Review.create(...)
await CoinService.awardForReview(userId, review.id, body.product_id).catch(() => {});
```

### 3. User registered → create wallet
**File**: `backend/__modules__/user/services/users.js`

In `create()`, after user is saved:

```javascript
const CoinService = require('../../../__modules__/coins/services/CoinService');
// after: const user = await db.User.create(...)
await CoinService.ensureWallet(user.id).catch(() => {});
```

---

## API Routes

### Admin: `backend/routes/admin/coins.js`

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/admin/coins/balances` | COIN_GET (69) | List wallets (paginated, searchable) |
| GET | `/admin/coins/balances/:userId` | COIN_GET | One user's balance + history |
| POST | `/admin/coins/grant` | COIN_POST (70) | Grant coins to user(s); body: `{ user_ids, amount, note }` |
| POST | `/admin/coins/deduct` | COIN_DELETE (72) | Deduct coins; body: `{ user_id, amount, note }` |
| GET | `/admin/coins/conditions` | COIN_GET | List earning conditions |
| POST | `/admin/coins/conditions` | COIN_POST | Create condition |
| PUT | `/admin/coins/conditions/:id` | COIN_PUT (71) | Update condition |
| DELETE | `/admin/coins/conditions/:id` | COIN_DELETE | Delete condition |
| GET | `/admin/coins/topups` | COIN_GET | List topup requests (filter by status) |
| PATCH | `/admin/coins/topups/:id/status` | COIN_PUT | Approve/reject; body: `{ status, note }` |

### Buyer: `backend/routes/buyer/coins.js`

| Method | Path | Description |
|---|---|---|
| GET | `/buyer/coins/balance` | My coin balance |
| GET | `/buyer/coins/history` | My transaction log (paginated) |
| POST | `/buyer/coins/topup` | Submit topup request; body: `{ amount_tmt, receipt_url }` |
| GET | `/buyer/coins/topup` | My topup requests |

---

## Permissions

**File**: `backend/utils/permissions.js`

```javascript
static COIN_GET    = 69;
static COIN_POST   = 70;
static COIN_PUT    = 71;
static COIN_DELETE = 72;
```

---

## Seeder

**File**: `backend/seeders/21-coin-conditions.js`

```javascript
const CONDITIONS = [
  {
    name: 'Order Completed',
    source_event: 'ORDER_CLOSED',
    coins_amount: 1,           // 1 coin per 1 TMT spent
    multiplier_priority: 1.50,
    max_per_user_per_day: null,
    is_active: true
  },
  {
    name: 'Write Review',
    source_event: 'REVIEW_WRITTEN',
    coins_amount: 10,
    multiplier_priority: 1.50,
    max_per_user_per_day: 5,
    is_active: true
  },
  {
    name: 'Referral Signup',
    source_event: 'REFERRAL',
    coins_amount: 50,
    multiplier_priority: 2.00,
    max_per_user_per_day: 10,
    is_active: true
  },
];

module.exports = async (db) => {
  console.log('  Seeding coin conditions...');
  let created = 0;
  for (const c of CONDITIONS) {
    const [, wasCreated] = await db.CoinCondition.findOrCreate({
      where: { source_event: c.source_event },
      defaults: c,
    });
    if (wasCreated) created++;
    else console.log(`  CoinCondition '${c.source_event}' already exists — skipping`);
  }
  console.log(`  Done: ${created} coin conditions created`);
};
```

Add step to `backend/seeders/index.js`:
```javascript
console.log('[21/21] Coin conditions');
await require('./21-coin-conditions')(fullDb);
```

---

## Frontend

### Admin Coins Page

**File**: `frontend/src/pages/admin/AdminCoinsPage.jsx`

Three-tab layout:

**Tab 1 — Wallets**
- Table: User name/phone, Balance, Total Earned, Total Spent, Last Transaction
- Search by name or phone
- Click row → history modal (transaction log with type badge + amount + date)
- "Grant Coins" button → modal: user search, amount, note

**Tab 2 — Conditions**
- Table: Name, Trigger Event, Coins, Priority Multiplier, Max/Day, Active
- Add / Edit / Delete with modal form
- `source_event` as dropdown of event types

**Tab 3 — Top-ups**
- Filter by status (PENDING / APPROVED / REJECTED)
- Table: User, TMT Amount, Coins Requested, Receipt link, Date
- Approve / Reject actions with note

### Navigation

**File**: `frontend/src/components/layout/Sidebar.jsx`

Add between Analytics and Warehouses:
```jsx
<SidebarLink to="/admin/coins" icon={<CoinsIcon />} label={t('nav.coins')} />
```

### Route

**File**: `frontend/src/App.jsx`

```jsx
<Route path="coins" element={<AdminCoinsPage />} />
```

### API Client

**File**: `frontend/src/lib/api.js`

```javascript
// Inside AdminApi class:
static coins = {
  getBalances:       (p) => http.get(a('/coins/balances'), { params: p }),
  getBalance:        (userId) => http.get(a(`/coins/balances/${userId}`)),
  grant:             (data) => http.post(a('/coins/grant'), data),
  deduct:            (data) => http.post(a('/coins/deduct'), data),
  getConditions:     (p) => http.get(a('/coins/conditions'), { params: p }),
  createCondition:   (data) => http.post(a('/coins/conditions'), data),
  updateCondition:   (id, data) => http.put(a(`/coins/conditions/${id}`), data),
  deleteCondition:   (id) => http.delete(a(`/coins/conditions/${id}`)),
  getTopups:         (p) => http.get(a('/coins/topups'), { params: p }),
  updateTopupStatus: (id, data) => http.patch(a(`/coins/topups/${id}/status`), data),
}
```

---

## i18n Keys

Add to `frontend/src/i18n/locales/en.js`, `ru.js`, `tk.js`:

```javascript
coins: {
  title: 'Coins',
  balance: 'Balance',
  totalEarned: 'Total Earned',
  totalSpent: 'Total Spent',
  history: 'Transaction History',
  wallets: 'Wallets',
  grant: 'Grant Coins',
  grantTitle: 'Grant Coins to User',
  deduct: 'Deduct Coins',
  conditions: 'Earning Conditions',
  conditionName: 'Condition Name',
  sourceEvent: 'Trigger Event',
  coinsAmount: 'Coins',
  multiplier: 'Priority Multiplier',
  maxPerDay: 'Max per Day (null = unlimited)',
  topups: 'Top-up Requests',
  topupAmount: 'Amount (TMT)',
  coinsRequested: 'Coins Requested',
  receiptUrl: 'Receipt URL',
  approve: 'Approve',
  reject: 'Reject',
  rate: 'Coin Rate (TMT)',
  events: {
    ORDER_CLOSED: 'Order Completed',
    REVIEW_WRITTEN: 'Review Written',
    REFERRAL: 'Referral Signup',
    TASK: 'Ad/Scan Task',
    MANUAL: 'Admin Manual',
  },
  types: {
    EARN: 'Earn',
    SPEND: 'Spend',
    WITHDRAW: 'Withdraw',
    REFUND: 'Refund',
    GRANT: 'Admin Grant',
    DEDUCT: 'Admin Deduct',
  },
}
```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `backend/migrations/030_coins.sql` | **Create** — all 4 tables + config entry |
| `backend/__modules__/coins/models/UserCoinBalance.model.js` | **Create** |
| `backend/__modules__/coins/models/CoinCondition.model.js` | **Create** |
| `backend/__modules__/coins/models/CoinTransaction.model.js` | **Create** |
| `backend/__modules__/coins/models/CoinTopup.model.js` | **Create** |
| `backend/__modules__/coins/services/CoinService.js` | **Create** |
| `backend/__modules__/coins/controllers/coin.controller.js` | **Create** |
| `backend/__modules__/coins/routes/coin.routes.js` | **Create** |
| `backend/__modules__/coins/index.js` | **Create** |
| `backend/models/index.js` | **Modify** — register 4 new models |
| `backend/routes/admin/index.js` | **Modify** — mount `/coins` router |
| `backend/routes/buyer/index.js` | **Modify** — mount buyer `/coins` router |
| `backend/utils/permissions.js` | **Modify** — add COIN_GET/POST/PUT/DELETE = 69–72 |
| `backend/__modules__/orders/services/orders.js` | **Modify** — call `CoinService.awardForOrder` on CLOSED |
| `backend/__modules__/reviews/services/reviews.js` | **Modify** — call `CoinService.awardForReview` |
| `backend/__modules__/user/services/users.js` | **Modify** — call `CoinService.ensureWallet` |
| `backend/seeders/21-coin-conditions.js` | **Create** |
| `backend/seeders/index.js` | **Modify** — add step 21 |
| `frontend/src/pages/admin/AdminCoinsPage.jsx` | **Create** |
| `frontend/src/components/layout/Sidebar.jsx` | **Modify** — add Coins nav entry |
| `frontend/src/App.jsx` | **Modify** — add `/admin/coins` route |
| `frontend/src/lib/api.js` | **Modify** — add `AdminApi.coins` |
| `frontend/src/lib/endpoints.js` | **Modify** — add coin paths |
| `frontend/src/i18n/locales/en.js` | **Modify** — add `coins` section |
| `frontend/src/i18n/locales/ru.js` | **Modify** |
| `frontend/src/i18n/locales/tk.js` | **Modify** |

---

## Verification Steps

1. Run `030_coins.sql` → confirm 4 tables exist with constraints (especially `balance >= 0`)
2. Run seeder `21-coin-conditions.js` → 3 conditions in DB
3. Register a new user → `user_coin_balances` row created automatically with balance=0
4. Place order → set status to CLOSED → `coin_transactions` row appears + balance incremented
5. Write a review → `coin_transactions` row with `source='REVIEW'`; repeat review on same product → no second award
6. Admin grants 100 coins to user → balance updates + GRANT transaction logged
7. Debit with amount > balance → 400 response with "Insufficient coin balance"
8. Submit topup request (receipt URL) → appears in admin topups tab → approve → balance credited
9. Frontend `/admin/coins` → Wallets tab shows data, Conditions tab shows 3 seeded rows, Topups tab works
