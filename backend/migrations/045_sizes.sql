-- 045: Sizes module (structured size taxonomy)

CREATE TABLE IF NOT EXISTS sizes (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  name_ru     VARCHAR(200),
  name_eng    VARCHAR(200),
  slug        VARCHAR(220) NOT NULL UNIQUE,
  parent_id   INTEGER      REFERENCES sizes(id) ON DELETE SET NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sizes_parent_id  ON sizes (parent_id);
CREATE INDEX IF NOT EXISTS idx_sizes_slug       ON sizes (slug);
CREATE INDEX IF NOT EXISTS idx_sizes_is_active  ON sizes (is_active);
