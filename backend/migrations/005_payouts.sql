CREATE TABLE IF NOT EXISTS seller_balances (
    id          SERIAL          PRIMARY KEY,
    shop_id     INTEGER         NOT NULL UNIQUE REFERENCES shops(id) ON DELETE RESTRICT,
    balance     DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    currency    VARCHAR(10)     NOT NULL DEFAULT 'TMT',
    "createdAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_balances_shop_id ON seller_balances (shop_id);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS payout_requests (
    id              SERIAL          PRIMARY KEY,
    shop_id         INTEGER         NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    amount          DECIMAL(12, 2)  NOT NULL,
    currency        VARCHAR(10)     NOT NULL DEFAULT 'TMT',
    status          VARCHAR(30)     NOT NULL DEFAULT 'PENDING',
    bank_details    TEXT            DEFAULT NULL,
    notes           TEXT            DEFAULT NULL,
    requested_by    UUID            REFERENCES users(id) ON DELETE SET NULL,
    processed_at    TIMESTAMPTZ     DEFAULT NULL,
    processed_by    UUID            REFERENCES users(id) ON DELETE SET NULL,
    "createdAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "deletedAt"     TIMESTAMPTZ     DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_shop_id      ON payout_requests (shop_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status       ON payout_requests (status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_by ON payout_requests (requested_by);
