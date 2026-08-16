-- Reel likes (mirrors 032_favorites.sql's shape, scoped to reels)

CREATE TABLE IF NOT EXISTS reel_likes (
  id          SERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reel_id     INTEGER     NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reel_id)
);

CREATE INDEX IF NOT EXISTS idx_reel_likes_user_id ON reel_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes (reel_id);

ALTER TABLE reels ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0;
