ALTER TABLE shops ADD COLUMN IF NOT EXISTS verification_status  SMALLINT    NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verification_note   TEXT        DEFAULT NULL;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verified_by         UUID        REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shops_verification_status ON shops (verification_status);

-- Verification status codes:
--   0 = UNVERIFIED      (default)
--   1 = PENDING_REVIEW  (shop submitted for review)
--   2 = VERIFIED        (admin approved; is_verified = true)
--   3 = REJECTED        (admin rejected; is_verified = false)
