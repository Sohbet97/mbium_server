-- 053: Track which coupon (if any) was applied to an order and how much it saved

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_id     INTEGER REFERENCES discounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_code   VARCHAR(64),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_discount_id ON orders (discount_id);
