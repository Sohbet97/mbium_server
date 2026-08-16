-- Adds a dedicated 'gift' media type so gift animations (GIFs) can be filtered
-- separately from regular product/reel images. Precedent: 044_product_media_spin_role.sql.
-- Kept in its own file/statement, per that same precedent.

ALTER TYPE enum_media_type ADD VALUE IF NOT EXISTS 'gift';
