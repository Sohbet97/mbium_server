-- Shop follows (mirrors reel_likes / favorites shape, scoped to shops)

CREATE TABLE IF NOT EXISTS shop_follows (
  id          SERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id     INTEGER     NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_follows_user_id ON shop_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_shop_follows_shop_id ON shop_follows (shop_id);

ALTER TABLE shops ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0;
