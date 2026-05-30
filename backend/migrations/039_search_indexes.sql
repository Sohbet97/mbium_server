-- Full-text search GIN indexes
-- Run with: psql $DATABASE_URL -f migrations/039_search_indexes.sql
-- CONCURRENTLY means the table stays writable during index build.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_fts
  ON products USING GIN (
    to_tsvector('simple',
      COALESCE(name, '')     || ' ' ||
      COALESCE(name_ru, '')  || ' ' ||
      COALESCE(name_eng, '') || ' ' ||
      COALESCE(sku, '')      || ' ' ||
      COALESCE(description, '')
    )
  );

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_fts
  ON categories USING GIN (
    to_tsvector('simple',
      COALESCE(name, '')     || ' ' ||
      COALESCE(name_ru, '')  || ' ' ||
      COALESCE(name_eng, '')
    )
  );

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_fts
  ON shops USING GIN (
    to_tsvector('simple',
      COALESCE(name, '')     || ' ' ||
      COALESCE(name_ru, '')  || ' ' ||
      COALESCE(name_eng, '') || ' ' ||
      COALESCE(description, '')
    )
  );
