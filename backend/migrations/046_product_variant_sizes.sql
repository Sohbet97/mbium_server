-- 046: Per-size stock under a product variant (color/style level)
-- A ProductVariant (e.g. "Red") can list multiple sizes (38, 39, 40, 41),
-- each with its own stock/sku/price override.

CREATE TABLE IF NOT EXISTS product_variant_sizes (
  id                SERIAL         PRIMARY KEY,
  variant_id        INTEGER        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  size_id           INTEGER        NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
  sku               VARCHAR(100),
  barcode           VARCHAR(100),
  price             NUMERIC(12, 2),
  compare_at_price  NUMERIC(12, 2),
  stock             INTEGER        NOT NULL DEFAULT 0,
  is_active         BOOLEAN        NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "deletedAt"       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pvs_variant_size ON product_variant_sizes (variant_id, size_id);
CREATE INDEX IF NOT EXISTS idx_pvs_variant_id ON product_variant_sizes (variant_id);
CREATE INDEX IF NOT EXISTS idx_pvs_size_id    ON product_variant_sizes (size_id);
CREATE INDEX IF NOT EXISTS idx_pvs_is_active  ON product_variant_sizes (is_active);
