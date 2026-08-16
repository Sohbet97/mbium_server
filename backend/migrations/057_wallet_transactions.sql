-- 057: Unified wallet-purchase ledger — records every paid-feature purchase
-- (Turbo boost, and future paid features) regardless of which underlying
-- wallet funded it (Coin or TMT), so purchase history can be shown as one feed.

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id                   SERIAL PRIMARY KEY,
    user_id              UUID           NOT NULL REFERENCES users(id),
    shop_id              INTEGER        REFERENCES shops(id) ON DELETE SET NULL,
    feature              VARCHAR(50)    NOT NULL, -- e.g. TURBO_BOOST
    reference_id         VARCHAR(100),
    currency             VARCHAR(10)    NOT NULL, -- TMT | COIN
    amount               DECIMAL(12, 2) NOT NULL,
    status               VARCHAR(20)    NOT NULL DEFAULT 'COMPLETED', -- COMPLETED | FAILED | REFUNDED
    coin_transaction_id  INTEGER        REFERENCES coin_transactions(id) ON DELETE SET NULL,
    seller_transaction_id INTEGER       REFERENCES seller_transactions(id) ON DELETE SET NULL,
    note                 TEXT,
    "createdAt"          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_shop_id ON wallet_transactions (shop_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_feature ON wallet_transactions (feature);

-- SellerTransaction.type is a free-form VARCHAR(20), not a DB enum/check constraint,
-- so no migration is needed to allow the new "PURCHASE_DEBIT" type — it's added to
-- the JS-side SELLER_TRANSACTION_TYPES constant in SellerTransaction.model.js.
