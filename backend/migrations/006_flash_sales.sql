CREATE TABLE IF NOT EXISTS flash_sales (
    id              SERIAL          PRIMARY KEY,
    shop_id         INTEGER         REFERENCES shops(id) ON DELETE CASCADE,
    product_id      INTEGER         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id      INTEGER         REFERENCES product_variants(id) ON DELETE SET NULL,
    sale_price      DECIMAL(12, 2)  NOT NULL,
    original_price  DECIMAL(12, 2)  NOT NULL,
    quantity_limit  INTEGER         DEFAULT NULL,
    sold_count      INTEGER         NOT NULL DEFAULT 0,
    starts_at       TIMESTAMPTZ     DEFAULT NULL,
    ends_at         TIMESTAMPTZ     DEFAULT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    "createdAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "deletedAt"     TIMESTAMPTZ     DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_shop_id    ON flash_sales (shop_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_product_id ON flash_sales (product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_variant_id ON flash_sales (variant_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_is_active  ON flash_sales (is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sales_starts_at  ON flash_sales (starts_at);
CREATE INDEX IF NOT EXISTS idx_flash_sales_ends_at    ON flash_sales (ends_at);
