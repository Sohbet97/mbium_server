-- Migration: Add Shopify-like fields to products, product_variants, and categories
-- Run once against your PostgreSQL database

-- ── products ──────────────────────────────────────────────────────────────────

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS compare_at_price  NUMERIC(12, 2)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS barcode           VARCHAR(100)      DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS weight            INTEGER           DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tags              TEXT[]            DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS handle            VARCHAR(255)      DEFAULT NULL UNIQUE,
    ADD COLUMN IF NOT EXISTS seo_title         VARCHAR(255)      DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS seo_description   TEXT              DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_products_handle ON products (handle) WHERE handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_tags   ON products USING GIN (tags);

-- ── product_variants ──────────────────────────────────────────────────────────

ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS barcode           VARCHAR(100)      DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS compare_at_price  NUMERIC(12, 2)   DEFAULT NULL;

-- ── categories ────────────────────────────────────────────────────────────────

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS seo_title         VARCHAR(255)      DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS seo_description   TEXT              DEFAULT NULL;

-- ── discounts ─────────────────────────────────────────────────────────────────
-- (new table — created by Sequelize sync or run this if sync is disabled)

CREATE TABLE IF NOT EXISTS discounts (
    id                SERIAL           PRIMARY KEY,
    shop_id           INTEGER          REFERENCES shops(id) ON DELETE CASCADE,
    code              VARCHAR(64)      NOT NULL UNIQUE,
    type              VARCHAR(30)      NOT NULL DEFAULT 'PERCENTAGE',
    value             NUMERIC(10, 2)   NOT NULL DEFAULT 0,
    min_order_amount  NUMERIC(12, 2)   DEFAULT NULL,
    max_uses          INTEGER          DEFAULT NULL,
    used_count        INTEGER          NOT NULL DEFAULT 0,
    starts_at         TIMESTAMPTZ      DEFAULT NULL,
    ends_at           TIMESTAMPTZ      DEFAULT NULL,
    is_active         BOOLEAN          NOT NULL DEFAULT TRUE,
    "createdAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    "deletedAt"       TIMESTAMPTZ      DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_discounts_shop_id  ON discounts (shop_id);
CREATE INDEX IF NOT EXISTS idx_discounts_is_active ON discounts (is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_ends_at   ON discounts (ends_at);
