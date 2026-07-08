-- 048: Variant-scoped media (gallery, video, 3D models, spin frames).
-- variant_id NULL = shared product-level media; set = belongs to that ProductVariant (color/style) only.

ALTER TABLE product_media
  ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_product_media_variant_id ON product_media (variant_id);

-- Replace (product_id, media_id) uniqueness with (product_id, variant_id, media_id) —
-- Postgres treats NULLs as distinct, so existing shared rows keep working unchanged.
DO $$
DECLARE idx_name text;
BEGIN
  SELECT indexname INTO idx_name
  FROM pg_indexes
  WHERE tablename = 'product_media'
    AND indexdef ILIKE '%UNIQUE%'
    AND indexdef ILIKE '%product_id%' AND indexdef ILIKE '%media_id%'
    AND indexdef NOT ILIKE '%variant_id%'
  LIMIT 1;
  IF idx_name IS NOT NULL THEN
    EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_unique_selection
  ON product_media (product_id, variant_id, media_id);
