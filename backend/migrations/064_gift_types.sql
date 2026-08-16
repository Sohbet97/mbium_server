-- Gift types: admin-managed catalog of purchasable animated gifts (Telegram Gifts-style).
-- Each gift belongs to a gift_creator, who receives the 70% revenue share when it's sent.

CREATE TABLE IF NOT EXISTS gift_types (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    animation_id        UUID NOT NULL REFERENCES media(id) ON DELETE RESTRICT,  -- GIF, media.type='gift'
    icon_id             UUID REFERENCES media(id) ON DELETE SET NULL,
    effect_description  VARCHAR(255),
    price_coin          INTEGER NOT NULL CHECK (price_coin > 0),
    price_tmt           NUMERIC(10, 2) NOT NULL CHECK (price_tmt > 0), -- revenue-share hasaplamasy üçin binýat
    gift_creator_id     INTEGER NOT NULL REFERENCES gift_creators(id) ON DELETE RESTRICT,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_types_active_sort     ON gift_types (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_gift_types_gift_creator_id ON gift_types (gift_creator_id);
