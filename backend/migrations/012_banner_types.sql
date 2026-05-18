-- Banner types table
CREATE TABLE IF NOT EXISTS banner_types (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    name_ru     VARCHAR(100),
    name_eng    VARCHAR(100),
    slug        VARCHAR(60)     NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banner_types_slug ON banner_types (slug);

-- Extend banners table
ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS banner_type_id INTEGER REFERENCES banner_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subtitle       TEXT,
    ADD COLUMN IF NOT EXISTS media_id       UUID    REFERENCES media(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS button_text    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS button_url     TEXT;

CREATE INDEX IF NOT EXISTS idx_banners_banner_type_id ON banners (banner_type_id);
CREATE INDEX IF NOT EXISTS idx_banners_media_id       ON banners (media_id);
