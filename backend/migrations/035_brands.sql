-- 035: Brands module + brand_id on products

CREATE TABLE IF NOT EXISTS brands (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  name_ru     VARCHAR(200),
  name_en     VARCHAR(200),
  slug        VARCHAR(220) NOT NULL UNIQUE,
  parent_id   INTEGER      REFERENCES brands(id) ON DELETE SET NULL,
  logo_url    TEXT,
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_parent_id  ON brands (parent_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug       ON brands (slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_active  ON brands (is_active);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products (brand_id);
