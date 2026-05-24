-- Add applies_to fields for product-scoped discounts

ALTER TABLE discounts
  ADD COLUMN IF NOT EXISTS applies_to_type VARCHAR(20) NOT NULL DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS applies_to_ids  JSONB       NOT NULL DEFAULT '[]'::jsonb;
