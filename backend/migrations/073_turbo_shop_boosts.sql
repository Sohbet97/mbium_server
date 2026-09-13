-- 073: Turbo shop boost — sellers pay (TMT or Coin, via wallet_transactions from 057)
-- to have their shop sort first in mobile shop listings for a tiered, time-limited window.
-- Mirrors 058_turbo_boosts.sql, but scoped to shops instead of products.

CREATE TABLE IF NOT EXISTS turbo_shop_packages (
    id             SERIAL PRIMARY KEY,
    tier_hours     SMALLINT       NOT NULL UNIQUE, -- refresh interval: 24 | 12 | 6 | 3 | 1
    price_tmt      DECIMAL(10, 2) NOT NULL,
    price_coin     INTEGER        NOT NULL,
    duration_days  SMALLINT       NOT NULL DEFAULT 7,
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
    "createdAt"    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

INSERT INTO turbo_shop_packages (tier_hours, price_tmt, price_coin, duration_days) VALUES
    (24, 15,  150,  7),
    (12, 30,  300,  7),
    (6,  60,  600,  7),
    (3,  120, 1200, 7),
    (1,  200, 2000, 7)
ON CONFLICT (tier_hours) DO NOTHING;

CREATE TABLE IF NOT EXISTS turbo_shop_boosts (
    id                   SERIAL PRIMARY KEY,
    shop_id              INTEGER        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    package_id           INTEGER        NOT NULL REFERENCES turbo_shop_packages(id),
    tier_hours           SMALLINT       NOT NULL,
    started_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    expires_at           TIMESTAMPTZ    NOT NULL,
    next_refresh_at      TIMESTAMPTZ    NOT NULL,
    status               VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | EXPIRED
    currency             VARCHAR(10)    NOT NULL, -- TMT | COIN
    paid_amount          DECIMAL(12, 2) NOT NULL,
    wallet_transaction_id INTEGER       REFERENCES wallet_transactions(id) ON DELETE SET NULL,
    "createdAt"          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tsb_one_active_per_shop
    ON turbo_shop_boosts (shop_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_tsb_status_next_refresh ON turbo_shop_boosts (status, next_refresh_at);
CREATE INDEX IF NOT EXISTS idx_tsb_status_expires ON turbo_shop_boosts (status, expires_at);

ALTER TABLE shops ADD COLUMN IF NOT EXISTS turbo_active     BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS turbo_boosted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_shops_turbo ON shops (turbo_active, turbo_boosted_at);
