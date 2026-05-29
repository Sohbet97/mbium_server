-- 033: Structured product tags (replaces plain text array)

CREATE TABLE IF NOT EXISTS product_tags (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_tags_slug ON product_tags (slug);

CREATE TABLE IF NOT EXISTS product_tag_map (
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id      INTEGER NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_ptm_tag_id     ON product_tag_map (tag_id);
CREATE INDEX IF NOT EXISTS idx_ptm_product_id ON product_tag_map (product_id);
