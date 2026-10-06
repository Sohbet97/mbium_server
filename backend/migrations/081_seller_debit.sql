-- External debits of a shop balance (e.g. Live project). reference_id makes a debit idempotent.
ALTER TABLE seller_transactions ADD COLUMN IF NOT EXISTS reason       VARCHAR(50);
ALTER TABLE seller_transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_seller_transactions_shop_reference
    ON seller_transactions (shop_id, reference_id)
    WHERE reference_id IS NOT NULL AND type = 'EXTERNAL_DEBIT';
