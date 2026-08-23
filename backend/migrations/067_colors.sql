-- 067: Colors module (structured colour palette) + product/variant colour

CREATE TABLE IF NOT EXISTS colors (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  name_ru     VARCHAR(200),
  name_eng    VARCHAR(200),
  slug        VARCHAR(220) NOT NULL UNIQUE,
  -- Lower-case #rrggbb. UNIQUE so products/variants can reference it directly,
  -- which keeps colour filtering a plain column match with no join.
  hex         CHAR(7)      NOT NULL UNIQUE CHECK (hex ~ '^#[0-9a-f]{6}$'),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colors_slug      ON colors (slug);
CREATE INDEX IF NOT EXISTS idx_colors_is_active ON colors (is_active);

-- Starter palette, matching the colours already used by seeders/04-product-variants.js
INSERT INTO colors (name, name_ru, name_eng, slug, hex, sort_order) VALUES
  ('Gara',   'Чёрный',     'Black',  'gara',   '#000000', 10),
  ('Syýah',  'Тёмный',     'Jet',    'syyah',  '#1a1a1a', 20),
  ('Ak',     'Белый',      'White',  'ak',     '#f5f5f5', 30),
  ('Kümüş',  'Серебряный', 'Silver', 'kumus',  '#c0c0c0', 40),
  ('Çal',    'Серый',      'Grey',   'cal',    '#808080', 50),
  ('Gyzyl',  'Красный',    'Red',    'gyzyl',  '#ef4444', 60),
  ('Mawy',   'Синий',      'Blue',   'mawy',   '#2a5298', 70),
  ('Gök',    'Голубой',    'Cyan',   'gok',    '#0ea5e9', 80),
  ('Ýaşyl',  'Зелёный',    'Green',  'yasyl',  '#22c55e', 90),
  ('Sary',   'Жёлтый',     'Yellow', 'sary',   '#eab308', 100),
  ('Narynç', 'Оранжевый',  'Orange', 'narync', '#f97316', 110),
  ('Melewşe','Фиолетовый', 'Purple', 'melewse','#a855f7', 120),
  ('Gülgün', 'Розовый',    'Pink',   'gulgun', '#ec4899', 130),
  ('Goňur',  'Коричневый', 'Brown',  'gonur',  '#92400e', 140),
  ('Bej',    'Бежевый',    'Beige',  'bej',    '#e7d3b3', 150)
ON CONFLICT (slug) DO NOTHING;

-- Nullable colour on both levels: a product can carry one overall colour, and a
-- variant can override it. ON UPDATE CASCADE keeps rows in step if a hex is
-- corrected; ON DELETE SET NULL drops the colour rather than the product.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_hex CHAR(7)
  REFERENCES colors(hex) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS color_hex CHAR(7)
  REFERENCES colors(hex) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_color_hex         ON products (color_hex);
CREATE INDEX IF NOT EXISTS idx_product_variants_color_hex ON product_variants (color_hex);

-- Backfill from the legacy free-text convention in product_variants.attributes
-- ({ color: 'Gyzyl', hex: '#ef4444' }). Only exact palette hits are migrated;
-- anything unmatched keeps working through the attributes fallback on the client.
UPDATE product_variants v
SET    color_hex = c.hex
FROM   colors c
WHERE  v.color_hex IS NULL
  AND  LOWER(COALESCE(v.attributes->>'color_hex', v.attributes->>'hex', '')) = c.hex;
