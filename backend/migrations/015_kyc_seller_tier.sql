-- 015: KYC document fields + two-tier seller classification on shops

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS video_url      TEXT,
  ADD COLUMN IF NOT EXISTS passport_file  TEXT,
  ADD COLUMN IF NOT EXISTS patent_file    TEXT,
  ADD COLUMN IF NOT EXISTS bank_iban      VARCHAR(34),
  ADD COLUMN IF NOT EXISTS card_number    VARCHAR(20),
  -- 0 = pending classification, 1 = standard seller, 2 = verified_pro
  ADD COLUMN IF NOT EXISTS seller_tier    SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_shops_seller_tier ON shops (seller_tier);
