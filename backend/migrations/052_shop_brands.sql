-- 052: Shop brands (many-to-many, sellers pick which brands their shop carries)

CREATE TABLE IF NOT EXISTS shop_brands (
  id       SERIAL  PRIMARY KEY,
  shop_id  INTEGER NOT NULL REFERENCES shops(id)  ON DELETE CASCADE,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_brands_unique ON shop_brands (shop_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_shop_brands_shop_id ON shop_brands (shop_id);
