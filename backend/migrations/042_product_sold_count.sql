-- Track how many units of each product have been sold (status=closed orders)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_sold_count ON products(sold_count DESC);
