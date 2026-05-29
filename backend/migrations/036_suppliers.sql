-- 036: Suppliers module + supplier_id on products

CREATE TABLE IF NOT EXISTS suppliers (
  id           SERIAL        PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  contact_name VARCHAR(200),
  email        VARCHAR(200),
  phone        VARCHAR(50),
  address      TEXT,
  country_id   INTEGER       REFERENCES countries(id) ON DELETE SET NULL,
  website      VARCHAR(500),
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  notes        TEXT,
  "createdAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers (is_active);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products (supplier_id);
