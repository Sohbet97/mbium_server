CREATE TABLE IF NOT EXISTS tariff_requests (
    id              SERIAL PRIMARY KEY,
    shop_id         INTEGER      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_id         INTEGER      NOT NULL REFERENCES plans(id),
    current_plan_id INTEGER      REFERENCES plans(id) ON DELETE SET NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    comment         TEXT,
    admin_comment   TEXT,
    requested_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tariff_requests_shop_id ON tariff_requests (shop_id);
CREATE INDEX IF NOT EXISTS idx_tariff_requests_status  ON tariff_requests (status);

-- A shop may have only one pending request at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_tariff_requests_shop_pending
    ON tariff_requests (shop_id) WHERE status = 'pending';
