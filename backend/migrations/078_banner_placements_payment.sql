-- 078: Paid seller banners. Sellers pick a placement (banner_type) and a number of days,
-- pay in COIN or TMT, and the banner waits for admin approval before going live.

ALTER TABLE banner_types
    ADD COLUMN IF NOT EXISTS price_per_day_tmt  DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS price_per_day_coin INTEGER,
    ADD COLUMN IF NOT EXISTS max_days           SMALLINT;

ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS status                VARCHAR(20) NOT NULL DEFAULT 'APPROVED', -- PENDING|APPROVED|REJECTED
    ADD COLUMN IF NOT EXISTS duration_days         SMALLINT,
    ADD COLUMN IF NOT EXISTS currency              VARCHAR(10),  -- TMT|COIN
    ADD COLUMN IF NOT EXISTS paid_amount           DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS wallet_transaction_id INTEGER REFERENCES wallet_transactions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reject_reason         TEXT;

CREATE INDEX IF NOT EXISTS idx_banners_status ON banners (status);
