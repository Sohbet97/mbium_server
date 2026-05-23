CREATE TABLE IF NOT EXISTS shop_verification_logs (
    id          SERIAL PRIMARY KEY,
    shop_id     INTEGER          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    action      VARCHAR(20)      NOT NULL,   -- 'submitted' | 'approved' | 'rejected'
    note        TEXT,
    admin_id    UUID             REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_svl_shop_id   ON shop_verification_logs (shop_id);
CREATE INDEX IF NOT EXISTS idx_svl_admin_id  ON shop_verification_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_svl_createdat ON shop_verification_logs ("createdAt" DESC);
