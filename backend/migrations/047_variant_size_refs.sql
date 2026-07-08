-- 047: Thread variant_size_id through cart/order/inventory tables so stock
-- can be resolved and decremented at the per-size level (product_variant_sizes).

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS variant_size_id INTEGER REFERENCES product_variant_sizes(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_size_id INTEGER REFERENCES product_variant_sizes(id) ON DELETE SET NULL;

ALTER TABLE inventory_levels
  ADD COLUMN IF NOT EXISTS variant_size_id INTEGER REFERENCES product_variant_sizes(id) ON DELETE CASCADE;

ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS variant_size_id INTEGER REFERENCES product_variant_sizes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_size_id      ON cart_items (variant_size_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_size_id     ON order_items (variant_size_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_variant_size_id ON inventory_levels (variant_size_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_size_id  ON stock_movements (variant_size_id);

-- Replace the old cart uniqueness constraint (user_id, product_id, variant_id) —
-- it would otherwise reject two different sizes of the same variant in one cart.
-- Find it by its actual column signature rather than guessing its generated name.
DO $$
DECLARE idx_name text;
BEGIN
  SELECT indexname INTO idx_name
  FROM pg_indexes
  WHERE tablename = 'cart_items'
    AND indexdef ILIKE '%UNIQUE%'
    AND indexdef ILIKE '%user_id%' AND indexdef ILIKE '%product_id%' AND indexdef ILIKE '%variant_id%'
    AND indexdef NOT ILIKE '%variant_size_id%'
  LIMIT 1;
  IF idx_name IS NOT NULL THEN
    EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_selection
  ON cart_items (user_id, product_id, variant_id, variant_size_id);

-- Old inventory_levels composite index is just a lookup aid (non-unique) —
-- leaving it in place is harmless, but add the size-aware one alongside it.
CREATE INDEX IF NOT EXISTS idx_inventory_levels_composite
  ON inventory_levels (warehouse_id, product_id, variant_id, variant_size_id);
