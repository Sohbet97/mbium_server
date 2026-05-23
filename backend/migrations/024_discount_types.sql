-- Add discount category, method, and extra fields

ALTER TABLE discounts
  ADD COLUMN IF NOT EXISTS category     VARCHAR(30)  NOT NULL DEFAULT 'ORDER',
  ADD COLUMN IF NOT EXISTS method       VARCHAR(20)  NOT NULL DEFAULT 'CODE',
  ADD COLUMN IF NOT EXISTS name         VARCHAR(200),
  ADD COLUMN IF NOT EXISTS min_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS buy_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS get_quantity INTEGER;

-- Migrate legacy FREE_SHIPPING type into category
UPDATE discounts SET category = 'FREE_SHIPPING' WHERE type = 'FREE_SHIPPING';
UPDATE discounts SET type = 'PERCENTAGE'         WHERE type = 'FREE_SHIPPING';

-- Allow null codes (automatic discounts have no code)
ALTER TABLE discounts ALTER COLUMN code DROP NOT NULL;
