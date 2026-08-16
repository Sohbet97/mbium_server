-- 058: Turbo product boost — sellers pay (TMT or Coin, via wallet_transactions from 057)
-- to have a product sort first in mobile search/listings for a tiered, time-limited window.

CREATE TABLE IF NOT EXISTS turbo_packages (
    id             SERIAL PRIMARY KEY,
    tier_hours     SMALLINT       NOT NULL UNIQUE, -- refresh interval: 24 | 12 | 6 | 3 | 1
    price_tmt      DECIMAL(10, 2) NOT NULL,
    price_coin     INTEGER        NOT NULL,
    duration_days  SMALLINT       NOT NULL DEFAULT 7,
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
    "createdAt"    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

INSERT INTO turbo_packages (tier_hours, price_tmt, price_coin, duration_days) VALUES
    (24, 10,  100,  7),
    (12, 20,  200,  7),
    (6,  40,  400,  7),
    (3,  85,  850,  7),
    (1,  150, 1500, 7)
ON CONFLICT (tier_hours) DO NOTHING;

CREATE TABLE IF NOT EXISTS product_turbo_boosts (
    id                   SERIAL PRIMARY KEY,
    product_id           INTEGER        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    shop_id              INTEGER        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    package_id           INTEGER        NOT NULL REFERENCES turbo_packages(id),
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_ptb_one_active_per_product
    ON product_turbo_boosts (product_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_ptb_shop_id ON product_turbo_boosts (shop_id);
CREATE INDEX IF NOT EXISTS idx_ptb_status_next_refresh ON product_turbo_boosts (status, next_refresh_at);
CREATE INDEX IF NOT EXISTS idx_ptb_status_expires ON product_turbo_boosts (status, expires_at);

ALTER TABLE products ADD COLUMN IF NOT EXISTS turbo_active     BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS turbo_boosted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_turbo ON products (turbo_active, turbo_boosted_at);
