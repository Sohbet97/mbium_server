-- Quantity-tiered pricing: buy-more-pay-less unit price schedules for products
-- and product variants (variant sizes keep their existing flat price — not tiered).
-- A tier belongs to exactly one owner (product OR variant), mirroring how
-- product.price/variant.price are already alternatives, not composites.

CREATE TABLE IF NOT EXISTS product_price_tiers (
    id           SERIAL PRIMARY KEY,
    product_id   INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id   INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    min_qty      INTEGER NOT NULL CHECK (min_qty > 0),
    max_qty      INTEGER CHECK (max_qty IS NULL OR max_qty > min_qty),  -- NULL = open-ended ("100+")
    unit_price   NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt"  TIMESTAMPTZ,
    CONSTRAINT chk_ppt_owner_xor CHECK (
        (product_id IS NOT NULL AND variant_id IS NULL) OR
        (product_id IS NULL AND variant_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_ppt_product_id ON product_price_tiers (product_id);
CREATE INDEX IF NOT EXISTS idx_ppt_variant_id ON product_price_tiers (variant_id);
