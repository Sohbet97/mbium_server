-- 079: Admin-editable AI settings (single row). coins_per_request is charged to a buyer
-- for every /buyer/ai/chat request; 0 disables billing.

CREATE TABLE IF NOT EXISTS ai_settings (
    id                 SERIAL PRIMARY KEY,
    coins_per_request  INTEGER      NOT NULL DEFAULT 1 CHECK (coins_per_request >= 0),
    "createdAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO ai_settings (coins_per_request)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM ai_settings);
