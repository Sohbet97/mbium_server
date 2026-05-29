-- 031: Product scheduling — is_published + scheduled_at on products

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_published  BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS scheduled_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_is_published  ON products (is_published);
CREATE INDEX IF NOT EXISTS idx_products_scheduled_at  ON products (scheduled_at);
