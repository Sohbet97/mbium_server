-- Reel gifts: buyer sends an animated gift (gift_types) on a reel, paid in coins.
-- Revenue share (70% creator / 30% platform commission) lands on the gift's
-- gift_creator, NOT the shop that posted the reel — shop_id here is denormalized
-- from the reel purely for "which shop's reels collect gifts" analytics.

CREATE TABLE IF NOT EXISTS reel_gifts (
    id                     SERIAL PRIMARY KEY,
    user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reel_id                INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    shop_id                INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    gift_type_id           INTEGER NOT NULL REFERENCES gift_types(id),
    gift_creator_id        INTEGER NOT NULL REFERENCES gift_creators(id), -- snapshot from gift_type at send time
    price_coin             INTEGER NOT NULL,                              -- snapshot of gift_types.price_coin
    price_tmt              NUMERIC(10, 2) NOT NULL,                       -- snapshot of gift_types.price_tmt
    message                VARCHAR(200),
    wallet_transaction_id  INTEGER REFERENCES wallet_transactions(id) ON DELETE SET NULL,
    "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No UNIQUE(user_id, reel_id) — a buyer can send many gifts to the same reel
);

CREATE INDEX IF NOT EXISTS idx_reel_gifts_user_id         ON reel_gifts (user_id);
CREATE INDEX IF NOT EXISTS idx_reel_gifts_reel_id         ON reel_gifts (reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_gifts_shop_id         ON reel_gifts (shop_id);
CREATE INDEX IF NOT EXISTS idx_reel_gifts_gift_creator_id ON reel_gifts (gift_creator_id);

ALTER TABLE reels ADD COLUMN IF NOT EXISTS gift_count      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS gift_coin_total INTEGER NOT NULL DEFAULT 0;
