-- Per-variant "sell when out of stock" override. The product-level flag stays a
-- blanket allow for every variant; this column lets a single variant be
-- backorderable without opening up the whole product.
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS sell_when_out_of_stock BOOLEAN NOT NULL DEFAULT false;
