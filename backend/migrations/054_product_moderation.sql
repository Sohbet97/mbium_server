ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_status  SMALLINT    NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_note    TEXT        DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderated_at       TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderated_by       UUID        REFERENCES users(id) ON DELETE SET NULL;

-- Existing products predate this workflow — grandfather them in as approved so
-- nothing already live gets pulled off the storefront by this migration.
UPDATE products SET moderation_status = 1 WHERE moderation_status = 0;

CREATE INDEX IF NOT EXISTS idx_products_moderation_status ON products (moderation_status);

-- Moderation status codes:
--   0 = PENDING   (default for new seller-created products; hidden from buyers)
--   1 = APPROVED  (moderator approved, or admin-created; visible if also active/published)
--   2 = REJECTED  (moderator rejected; hidden from buyers)
