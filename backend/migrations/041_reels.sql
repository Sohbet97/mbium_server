-- Reels: short-video feed, managed per shop (like Instagram Reels)

CREATE TABLE reels (
    id            SERIAL PRIMARY KEY,
    shop_id       INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    video_id      UUID    NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
    thumbnail_id  UUID             REFERENCES media(id) ON DELETE SET NULL,
    caption       TEXT,
    product_id    INTEGER          REFERENCES products(id) ON DELETE SET NULL,
    view_count    INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_reels_shop_id   ON reels(shop_id);
CREATE INDEX idx_reels_is_active ON reels(is_active);
CREATE INDEX idx_reels_created   ON reels(created_at DESC);
