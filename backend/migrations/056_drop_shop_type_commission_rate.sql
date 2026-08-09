-- 056: Remove ShopType.commission_rate — dead field, never read by the commission
-- logic (which uses Plan.commission_rate, falling back to the global platform rate).
-- Kept as a separate migration from 055 since it's an unrelated cleanup.

ALTER TABLE shop_types DROP COLUMN IF EXISTS commission_rate;
