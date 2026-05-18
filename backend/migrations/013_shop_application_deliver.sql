-- 1. Extend shops with multilingual descriptions, location, coordinates
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS description_tm  TEXT,
  ADD COLUMN IF NOT EXISTS description_ru  TEXT,
  ADD COLUMN IF NOT EXISTS description_en  TEXT,
  ADD COLUMN IF NOT EXISTS location        TEXT,
  ADD COLUMN IF NOT EXISTS coordinates     JSONB;

-- 2. Commission rate per shop type (e.g. 0.15 = 15%)
ALTER TABLE shop_types
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15;

-- 3. Shop ↔ Category join table
CREATE TABLE IF NOT EXISTS shop_categories (
  id          SERIAL  PRIMARY KEY,
  shop_id     INTEGER NOT NULL REFERENCES shops(id)      ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE (shop_id, category_id)
);

-- 4. Platform delivery drivers
CREATE TABLE IF NOT EXISTS delivers (
  id           SERIAL  PRIMARY KEY,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  avatar       TEXT,
  city_id      INTEGER REFERENCES cities(id),
  status       SMALLINT NOT NULL DEFAULT 0,
  phones       JSONB    NOT NULL DEFAULT '[]',
  "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt"  TIMESTAMP WITH TIME ZONE
);
