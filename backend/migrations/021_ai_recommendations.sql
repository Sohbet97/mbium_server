CREATE TABLE IF NOT EXISTS ai_recommendations (
    id          SERIAL PRIMARY KEY,
    title_tk    VARCHAR(255) NOT NULL,
    title_ru    VARCHAR(255) NOT NULL,
    title_en    VARCHAR(255) NOT NULL,
    subtitle_tk VARCHAR(255),
    subtitle_ru VARCHAR(255),
    subtitle_en VARCHAR(255),
    emoji       VARCHAR(10),
    prompt      TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_rec_is_active ON ai_recommendations (is_active);
CREATE INDEX IF NOT EXISTS idx_ai_rec_sort      ON ai_recommendations (sort_order);
