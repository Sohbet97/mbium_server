-- Ad tasks ("Mugt mbium gazan"): a shop pays a TMT budget, users do tasks in that shop
-- (follow, reel like, review) and earn coins. Money is DECIMAL(12,2); ball_rate converts
-- a task price to coins (0.10 TMT = 1 coin by default).

CREATE TABLE IF NOT EXISTS ad_task_types (
    id               SERIAL PRIMARY KEY,
    code             VARCHAR(30)    NOT NULL,           -- review | reel_like | shop_follow (backend action)
    name             VARCHAR(150)   NOT NULL,
    name_ru          VARCHAR(150),
    name_eng         VARCHAR(150),
    target_type      VARCHAR(10)    NOT NULL,           -- shop | product | reel
    min_price        DECIMAL(12, 2) NOT NULL DEFAULT 0.10,
    needs_moderation BOOLEAN        NOT NULL DEFAULT FALSE,
    status           BOOLEAN        NOT NULL DEFAULT TRUE,
    "createdAt"      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
    id                    SERIAL PRIMARY KEY,
    shop_id               INTEGER        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    budget                DECIMAL(12, 2) NOT NULL,
    user_percent          SMALLINT       NOT NULL,      -- fixed from the plan at creation
    user_pool             DECIMAL(12, 2) NOT NULL,
    platform_fee          DECIMAL(12, 2) NOT NULL,
    spent                 DECIMAL(12, 2) NOT NULL DEFAULT 0,
    reserved              DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status                VARCHAR(10)    NOT NULL DEFAULT 'pending', -- pending | active | rejected | finished
    comment               TEXT,
    wallet_transaction_id INTEGER        REFERENCES wallet_transactions(id) ON DELETE SET NULL,
    approved_at           TIMESTAMPTZ,
    finished_at           TIMESTAMPTZ,
    "createdAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CHECK (spent + reserved <= user_pool)
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_shop   ON ad_campaigns (shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns (status);

CREATE TABLE IF NOT EXISTS ad_campaign_tasks (
    id            SERIAL PRIMARY KEY,
    campaign_id   INTEGER        NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    task_type_id  INTEGER        NOT NULL REFERENCES ad_task_types(id),
    price         DECIMAL(12, 2) NOT NULL,
    ball          INTEGER        NOT NULL,
    scope         VARCHAR(10),                          -- all | selected (NULL for shop targets)
    target_ids    INTEGER[],
    "limit"       INTEGER,                              -- NULL = no limit
    done_count    INTEGER        NOT NULL DEFAULT 0,
    pending_count INTEGER        NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ad_campaign_tasks_campaign ON ad_campaign_tasks (campaign_id);

CREATE TABLE IF NOT EXISTS ad_completions (
    id                  SERIAL PRIMARY KEY,
    campaign_task_id    INTEGER        NOT NULL REFERENCES ad_campaign_tasks(id) ON DELETE CASCADE,
    campaign_id         INTEGER        NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    user_id             UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id           INTEGER        NOT NULL,
    review_id           INTEGER,                        -- the review being moderated (review tasks)
    status              VARCHAR(10)    NOT NULL,        -- pending | approved | rejected
    price               DECIMAL(12, 2) NOT NULL,
    ball                INTEGER        NOT NULL,
    coin_transaction_id INTEGER        REFERENCES coin_transactions(id) ON DELETE SET NULL,
    comment             TEXT,
    moderated_at        TIMESTAMPTZ,
    "createdAt"         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
-- One paid (or pending) completion per user per object per task; a rejected one may be redone
CREATE UNIQUE INDEX IF NOT EXISTS uq_ad_completions_once
    ON ad_completions (campaign_task_id, user_id, target_id) WHERE status <> 'rejected';
CREATE INDEX IF NOT EXISTS idx_ad_completions_campaign ON ad_completions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_completions_user     ON ad_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_ad_completions_status   ON ad_completions (status);

ALTER TABLE configurations ADD COLUMN IF NOT EXISTS ad_min_budget DECIMAL(12, 2) NOT NULL DEFAULT 100;
ALTER TABLE configurations ADD COLUMN IF NOT EXISTS ball_rate     DECIMAL(12, 2) NOT NULL DEFAULT 0.10;

INSERT INTO ad_task_types (code, name, name_ru, name_eng, target_type, min_price, needs_moderation)
SELECT * FROM (VALUES
    ('shop_follow', 'Dükany halamak',     'Подписаться на магазин', 'Follow the shop', 'shop',    0.50, FALSE),
    ('reel_like',   'Reelse like goýmak', 'Лайкнуть reels',         'Like a reel',     'reel',    0.50, FALSE),
    ('review',      'Teswir ýazmak',      'Написать отзыв',         'Write a review',  'product', 0.50, TRUE)
) AS v(code, name, name_ru, name_eng, target_type, min_price, needs_moderation)
WHERE NOT EXISTS (SELECT 1 FROM ad_task_types);

-- AD_GET/POST/PUT/DELETE (371–374) for superadmin; other roles get them on the Roles page
UPDATE roles
SET permissions = permissions || ARRAY[371, 372, 373, 374],
    modules     = modules     || ARRAY[371, 372, 373, 374]
WHERE slug = 'superadmin' AND NOT (371 = ANY(permissions));
