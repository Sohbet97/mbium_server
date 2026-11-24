-- Shops pick region, city and district on creation. region_id/city_id already exist; add district_id.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS shops_district_id ON shops (district_id);
