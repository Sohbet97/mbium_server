-- 076: ÖTS ("Öz teklibiňi saýla") — RFQ/negotiation on top of buyer_requests (043).
-- Lets a buyer request optionally target one shop/product instead of only city-broadcast,
-- and adds structured priced offer-rounds between buyer and seller (Alibaba-RFQ style).

ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS shop_id    INTEGER REFERENCES shops(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_buyer_requests_product_id ON buyer_requests (product_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_shop_id    ON buyer_requests (shop_id);

CREATE TABLE IF NOT EXISTS buyer_request_offers (
    id                SERIAL PRIMARY KEY,
    buyer_request_id  INTEGER        NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
    shop_id           INTEGER        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id        INTEGER                 REFERENCES products(id) ON DELETE SET NULL,
    variant_id        INTEGER                 REFERENCES product_variants(id) ON DELETE SET NULL,
    variant_size_id   INTEGER                 REFERENCES product_variant_sizes(id) ON DELETE SET NULL,
    parent_offer_id   INTEGER                 REFERENCES buyer_request_offers(id) ON DELETE SET NULL,
    from_role         VARCHAR(10)    NOT NULL, -- 'SELLER' | 'BUYER'
    unit_price        DECIMAL(12,2)  NOT NULL,
    quantity          INTEGER        NOT NULL DEFAULT 1,
    currency          VARCHAR(10)    NOT NULL DEFAULT 'TMT',
    note              TEXT,
    status            VARCHAR(20)    NOT NULL DEFAULT 'PENDING', -- PENDING|COUNTERED|ACCEPTED|REJECTED|EXPIRED
    expires_at        TIMESTAMPTZ,
    consumed_at       TIMESTAMPTZ,
    consumed_order_id INTEGER                 REFERENCES orders(id) ON DELETE SET NULL,
    "createdAt"       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bro_buyer_request_id ON buyer_request_offers (buyer_request_id);
CREATE INDEX IF NOT EXISTS idx_bro_shop_id          ON buyer_request_offers (shop_id);
CREATE INDEX IF NOT EXISTS idx_bro_status           ON buyer_request_offers (status);
CREATE INDEX IF NOT EXISTS idx_bro_parent_offer_id  ON buyer_request_offers (parent_offer_id);

-- Only one live accepted offer per request+shop pair, so order-creation can unambiguously
-- resolve which offer's price applies.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bro_one_accepted_per_request_shop
    ON buyer_request_offers (buyer_request_id, shop_id) WHERE status = 'ACCEPTED';
