CREATE TABLE IF NOT EXISTS banners (
    id              SERIAL          PRIMARY KEY,
    shop_id         INTEGER         REFERENCES shops(id) ON DELETE CASCADE,
    title           VARCHAR(255)    NOT NULL,
    image_url       TEXT            DEFAULT NULL,
    link_url        TEXT            DEFAULT NULL,
    placement       VARCHAR(30)     NOT NULL DEFAULT 'HOME',
    "order"         SMALLINT        NOT NULL DEFAULT 0,
    starts_at       TIMESTAMPTZ     DEFAULT NULL,
    ends_at         TIMESTAMPTZ     DEFAULT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    "createdAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "deletedAt"     TIMESTAMPTZ     DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_banners_shop_id    ON banners (shop_id);
CREATE INDEX IF NOT EXISTS idx_banners_placement  ON banners (placement);
CREATE INDEX IF NOT EXISTS idx_banners_is_active  ON banners (is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order      ON banners ("order");
CREATE INDEX IF NOT EXISTS idx_banners_ends_at    ON banners (ends_at);
