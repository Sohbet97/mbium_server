-- 055: Vendor wallet — available/pending balance split, transaction ledger,
-- payout method (card/cash), and a minimum payout threshold.

ALTER TABLE seller_balances RENAME COLUMN balance TO available_balance;
ALTER TABLE seller_balances ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS seller_transactions (
    id                 SERIAL PRIMARY KEY,
    shop_id            INTEGER        NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    type               VARCHAR(20)    NOT NULL, -- ORDER_CREDIT | COMMISSION | PAYOUT_DEBIT | PAYOUT_REVERSAL
    amount             DECIMAL(12, 2) NOT NULL, -- signed: positive = credit, negative = debit
    status             VARCHAR(20)    NOT NULL DEFAULT 'AVAILABLE', -- PENDING | AVAILABLE (meaningful for ORDER_CREDIT only)
    available_at       TIMESTAMPTZ,
    order_id           INTEGER        REFERENCES orders(id) ON DELETE SET NULL,
    payout_request_id  INTEGER        REFERENCES payout_requests(id) ON DELETE SET NULL,
    balance_after       DECIMAL(12, 2),
    note               TEXT,
    "createdAt"        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_transactions_shop_id ON seller_transactions (shop_id);
CREATE INDEX IF NOT EXISTS idx_seller_transactions_status ON seller_transactions (status);
CREATE INDEX IF NOT EXISTS idx_seller_transactions_order_id ON seller_transactions (order_id);

ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS method      VARCHAR(10); -- CARD | CASH
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS card_number VARCHAR(50);

ALTER TABLE configurations ADD COLUMN IF NOT EXISTS min_payout_amount DECIMAL(12, 2) NOT NULL DEFAULT 100;
