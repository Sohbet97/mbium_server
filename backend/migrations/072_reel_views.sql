-- Per-user view dedup for reels, mirroring reel_likes so repeat views by the
-- same authenticated user don't inflate reels.view_count.
CREATE TABLE IF NOT EXISTS reel_views (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reel_id     INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, reel_id)
);

CREATE INDEX IF NOT EXISTS idx_reel_views_user_id ON reel_views (user_id);
CREATE INDEX IF NOT EXISTS idx_reel_views_reel_id ON reel_views (reel_id);
