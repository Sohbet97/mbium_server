-- Reels: add moderation workflow (mirrors 054_product_moderation.sql)

ALTER TABLE reels
    ADD COLUMN moderation_status SMALLINT NOT NULL DEFAULT 0,  -- 0=PENDING, 1=APPROVED, 2=REJECTED
    ADD COLUMN moderation_note   TEXT,
    ADD COLUMN moderated_at      TIMESTAMPTZ,
    ADD COLUMN moderated_by      UUID REFERENCES users(id) ON DELETE SET NULL;

-- Existing reels predate this workflow — grandfather them in as approved so
-- nothing already live gets pulled off the storefront by this migration.
UPDATE reels SET moderation_status = 1 WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_reels_moderation_status ON reels(moderation_status);
