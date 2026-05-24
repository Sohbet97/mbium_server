CREATE TABLE IF NOT EXISTS shop_type_change_requests (
    id              SERIAL PRIMARY KEY,
    shop_id         INTEGER     NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    current_type_id INTEGER     NOT NULL REFERENCES shop_types(id),
    requested_type_id INTEGER   NOT NULL REFERENCES shop_types(id),
    status          SMALLINT    NOT NULL DEFAULT 0,  -- 0=pending, 1=approved, 2=rejected
    note            TEXT,
    requested_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stcr_shop_id ON shop_type_change_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_stcr_status  ON shop_type_change_requests(status);
