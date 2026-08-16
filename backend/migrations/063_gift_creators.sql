-- Gift creators: admin-managed catalog of people who design/create gift animations.
-- No login of their own (per product decision) — balance/transactions are admin-panel only.
-- Revenue-share ledger mirrors seller_balances/seller_transactions (005_payouts.sql).

CREATE TABLE IF NOT EXISTS gift_creators (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    avatar_id     UUID REFERENCES media(id) ON DELETE SET NULL,
    contact_note  TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_creator_balances (
    id                 SERIAL PRIMARY KEY,
    gift_creator_id    INTEGER NOT NULL UNIQUE REFERENCES gift_creators(id) ON DELETE CASCADE,
    available_balance  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency           VARCHAR(10) NOT NULL DEFAULT 'TMT',
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_creator_balances_creator_id ON gift_creator_balances (gift_creator_id);

CREATE TABLE IF NOT EXISTS gift_creator_transactions (
    id               SERIAL PRIMARY KEY,
    gift_creator_id  INTEGER NOT NULL REFERENCES gift_creators(id) ON DELETE CASCADE,
    type             VARCHAR(20) NOT NULL,                    -- GIFT_CREDIT | COMMISSION
    amount           DECIMAL(12, 2) NOT NULL,                 -- positive = credit; commission rows are negative, audit-only
    status           VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    balance_after    DECIMAL(12, 2),
    reference_id     INTEGER,                                 -- reel id the gift was sent on
    note             TEXT,
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_creator_transactions_creator_id ON gift_creator_transactions (gift_creator_id);
CREATE INDEX IF NOT EXISTS idx_gift_creator_transactions_type       ON gift_creator_transactions (type);
