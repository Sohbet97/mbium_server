-- ============================================================
-- 030_coins.sql  —  Coin Economy
-- ============================================================

-- 1. User wallets (one row per user)
CREATE TABLE IF NOT EXISTS user_coin_balances (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance      INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ucb_user_id ON user_coin_balances(user_id);

-- 2. Earning condition rules (admin-configurable)
CREATE TABLE IF NOT EXISTS coin_conditions (
  id                   SERIAL PRIMARY KEY,
  name                 VARCHAR(100) NOT NULL,
  source_event         VARCHAR(50)  NOT NULL,
  coins_amount         INTEGER      NOT NULL CHECK (coins_amount > 0),
  multiplier_priority  DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  max_per_user_per_day INTEGER,
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Immutable transaction ledger
CREATE TABLE IF NOT EXISTS coin_transactions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID         NOT NULL REFERENCES users(id),
  amount        INTEGER      NOT NULL,
  type          VARCHAR(20)  NOT NULL,
  source        VARCHAR(50)  NOT NULL,
  reference_id  VARCHAR(100),
  balance_after INTEGER      NOT NULL,
  note          TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ct_user_id    ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ct_created_at ON coin_transactions(created_at DESC);

-- 4. Top-up requests
CREATE TABLE IF NOT EXISTS coin_topups (
  id               SERIAL PRIMARY KEY,
  user_id          UUID           NOT NULL REFERENCES users(id),
  amount_tmt       DECIMAL(10,2)  NOT NULL CHECK (amount_tmt > 0),
  coins_requested  INTEGER        NOT NULL,
  status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
  receipt_url      VARCHAR(500),
  note             TEXT,
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ctu_user_id ON coin_topups(user_id);
CREATE INDEX IF NOT EXISTS idx_ctu_status  ON coin_topups(status);

-- 5. Global coin rate in configurations
INSERT INTO configurations (key, value, description)
VALUES ('coin_tmt_rate', '0.01', '1 coin = N TMT  (100 coins = 1 TMT)')
ON CONFLICT (key) DO NOTHING;
