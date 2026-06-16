-- Add 'spin' role for 360° product spin-view frame sequences.
-- Distinct from the existing '360' type/role, which is a single equirectangular panorama (Pannellum viewer).
-- 'spin' rows are ordinary images (Media.type = 'image') attached with role='spin' and
-- sort_order = contiguous frame index (0..N-1), used to drive the spin viewer rotation.

ALTER TYPE enum_product_media_role ADD VALUE IF NOT EXISTS 'spin';
