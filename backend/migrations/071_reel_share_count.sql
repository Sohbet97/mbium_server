-- Share count for reels, mirroring view_count/like_count.
ALTER TABLE reels ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;
