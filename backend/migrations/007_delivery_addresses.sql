CREATE TABLE IF NOT EXISTS delivery_addresses (
    id            SERIAL        PRIMARY KEY,
    user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label         VARCHAR(50)   DEFAULT NULL,
    region_id     INTEGER       REFERENCES regions(id) ON DELETE SET NULL,
    city_id       INTEGER       REFERENCES cities(id) ON DELETE SET NULL,
    district_id   INTEGER       REFERENCES districts(id) ON DELETE SET NULL,
    street        VARCHAR(255)  DEFAULT NULL,
    apartment     VARCHAR(100)  DEFAULT NULL,
    postal_code   VARCHAR(20)   DEFAULT NULL,
    is_default    BOOLEAN       NOT NULL DEFAULT FALSE,
    "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "deletedAt"   TIMESTAMPTZ   DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user_id    ON delivery_addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_region_id  ON delivery_addresses (region_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_city_id    ON delivery_addresses (city_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_is_default ON delivery_addresses (is_default);

-- Add delivery_address_id FK to orders (nullable — keeps existing free-text field for legacy rows)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id INTEGER REFERENCES delivery_addresses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders (delivery_address_id);
