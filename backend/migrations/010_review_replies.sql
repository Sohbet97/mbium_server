CREATE TABLE IF NOT EXISTS review_replies (
    id          SERIAL        PRIMARY KEY,
    review_id   INTEGER       NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    shop_id     INTEGER       NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    content     TEXT          NOT NULL,
    "createdBy" UUID          REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ   DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies (review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_shop_id          ON review_replies (shop_id);
