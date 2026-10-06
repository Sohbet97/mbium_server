CREATE TABLE IF NOT EXISTS guides (
    id             SERIAL PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    title_ru       VARCHAR(255),
    title_eng      VARCHAR(255),
    description    TEXT,
    description_ru TEXT,
    description_eng TEXT,
    video          TEXT,
    thumbnail      TEXT,
    "order"        SMALLINT     NOT NULL DEFAULT 0,
    status         SMALLINT     NOT NULL DEFAULT 0,  -- 0 = draft, 1 = published
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_status_order ON guides (status, "order");
