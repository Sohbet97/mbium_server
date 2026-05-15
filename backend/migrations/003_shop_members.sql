CREATE TABLE IF NOT EXISTS shop_members (
    id              SERIAL          PRIMARY KEY,
    shop_id         INTEGER         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(30)     NOT NULL DEFAULT 'STAFF',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    invited_by      UUID            REFERENCES users(id) ON DELETE SET NULL,
    "createdAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "deletedAt"     TIMESTAMPTZ     DEFAULT NULL,
    UNIQUE (shop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_members_shop_id   ON shop_members (shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_user_id   ON shop_members (user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_role      ON shop_members (role);
CREATE INDEX IF NOT EXISTS idx_shop_members_is_active ON shop_members (is_active);
