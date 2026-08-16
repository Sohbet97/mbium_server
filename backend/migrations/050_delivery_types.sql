-- 050: Delivery types module + product_delivery_types join table

CREATE TABLE IF NOT EXISTS delivery_types (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  name_ru     VARCHAR(200),
  name_en     VARCHAR(200),
  code        VARCHAR(50)  NOT NULL UNIQUE,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_types_is_active ON delivery_types (is_active);

CREATE TABLE IF NOT EXISTS product_delivery_types (
  product_id       INTEGER NOT NULL REFERENCES products(id)       ON DELETE CASCADE,
  delivery_type_id INTEGER NOT NULL REFERENCES delivery_types(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, delivery_type_id)
);

CREATE INDEX IF NOT EXISTS idx_product_delivery_types_delivery_type_id ON product_delivery_types (delivery_type_id);
