-- 037: Product comments (threaded, moderation-gated)

CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    parent_id  INTEGER      REFERENCES comments(id)          ON DELETE CASCADE,
    body       TEXT         NOT NULL,
    status     VARCHAR(20)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
    createdAt  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updatedAt  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_product ON comments (product_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_user    ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent  ON comments (parent_id);
