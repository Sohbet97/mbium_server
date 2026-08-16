-- 051: Shop delivery types (many-to-many, sellers pick which delivery types their shop supports)

CREATE TABLE IF NOT EXISTS shop_delivery_types (
  id               SERIAL  PRIMARY KEY,
  shop_id          INTEGER NOT NULL REFERENCES shops(id)          ON DELETE CASCADE,
  delivery_type_id INTEGER NOT NULL REFERENCES delivery_types(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_delivery_types_unique ON shop_delivery_types (shop_id, delivery_type_id);
CREATE INDEX IF NOT EXISTS idx_shop_delivery_types_shop_id ON shop_delivery_types (shop_id);
