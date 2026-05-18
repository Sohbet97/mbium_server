-- ── Plans ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(50)    NOT NULL UNIQUE,
    display_name_tm       VARCHAR(100),
    display_name_ru       VARCHAR(100),
    display_name_en       VARCHAR(100),
    price_monthly         DECIMAL(10,2)  NOT NULL DEFAULT 0,
    commission_rate       DECIMAL(5,4)   NOT NULL DEFAULT 0.15,
    -- Product listing
    product_limit         INTEGER,                         -- NULL = unlimited
    -- Hotspot / featured slot
    hotspot_per_month     SMALLINT       NOT NULL DEFAULT 0,
    hotspot_duration_hrs  SMALLINT       NOT NULL DEFAULT 0,
    -- AI assistant
    ai_credits_monthly    INTEGER        NOT NULL DEFAULT 5,
    -- Auction
    auction_per_week      SMALLINT,                        -- NULL = unlimited, 0 = none
    -- Live stream: 0=none, 1=view_only, 2=limited, 3=unlimited
    live_stream_mode      SMALLINT       NOT NULL DEFAULT 0,
    -- Boolean feature flags
    ads_dashboard         BOOLEAN        NOT NULL DEFAULT FALSE,
    coin_earn             BOOLEAN        NOT NULL DEFAULT FALSE,
    coin_earn_priority    BOOLEAN        NOT NULL DEFAULT FALSE,
    verified_badge        BOOLEAN        NOT NULL DEFAULT FALSE,
    virtual_tour          BOOLEAN        NOT NULL DEFAULT FALSE,
    oem_odm_support       BOOLEAN        NOT NULL DEFAULT FALSE,
    -- Revenue share (user's %)
    revenue_share_user    SMALLINT       NOT NULL DEFAULT 0,
    -- Push notifications per month
    push_notif_monthly    SMALLINT       NOT NULL DEFAULT 0,
    is_active             BOOLEAN        NOT NULL DEFAULT TRUE,
    sort_order            SMALLINT       NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Shop Subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_subscriptions (
    id            SERIAL PRIMARY KEY,
    shop_id       INTEGER      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_id       INTEGER      NOT NULL REFERENCES plans(id),
    -- 0=pending, 1=active, 2=cancelled, 3=expired
    status        SMALLINT     NOT NULL DEFAULT 1,
    starts_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ends_at       TIMESTAMPTZ,           -- NULL = no auto-expiry
    note          TEXT,
    assigned_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
    "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_subs_shop_id ON shop_subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_subs_status  ON shop_subscriptions(status);

-- Add plan_id reference to shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL;

-- ── Seed default plans ──────────────────────────────────────────────────────────
INSERT INTO plans (
    name, display_name_tm, display_name_ru, display_name_en,
    price_monthly, commission_rate,
    product_limit, hotspot_per_month, hotspot_duration_hrs, ai_credits_monthly,
    auction_per_week, live_stream_mode,
    ads_dashboard, coin_earn, coin_earn_priority,
    revenue_share_user, verified_badge, virtual_tour, oem_odm_support,
    push_notif_monthly, sort_order
) VALUES
(
    'basic', 'Sada', 'Базовый', 'Basic',
    0, 0.15,
    50, 0, 0, 5,
    0, 1,
    false, false, false,
    0, false, false, false,
    0, 1
),
(
    'vip', 'VIP', 'VIP', 'VIP',
    200, 0.09,
    NULL, 2, 24, 50,
    1, 2,
    true, true, false,
    50, false, false, false,
    1, 2
),
(
    'premium', 'Premium (Verified PRO)', 'Премиум (Verified PRO)', 'Premium (Verified PRO)',
    500, 0.05,
    NULL, 5, 48, 200,
    NULL, 3,
    true, true, true,
    60, true, true, true,
    4, 3
)
ON CONFLICT (name) DO NOTHING;
