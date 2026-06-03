-- Buyer requests (RFQ/tender): buyer posts what they need → matching shops get notified

CREATE TABLE buyer_requests (
    id         SERIAL PRIMARY KEY,
    user_id    UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id    INTEGER          REFERENCES cities(id) ON DELETE SET NULL,
    text       TEXT,
    images     TEXT[]  NOT NULL DEFAULT '{}',
    budget     DECIMAL(12,2),
    quantity   INTEGER NOT NULL DEFAULT 1,
    status     SMALLINT NOT NULL DEFAULT 0,  -- 0=active, 1=closed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_buyer_requests_user_id ON buyer_requests(user_id);
CREATE INDEX idx_buyer_requests_city_id ON buyer_requests(city_id);
CREATE INDEX idx_buyer_requests_status  ON buyer_requests(status);
CREATE INDEX idx_buyer_requests_created ON buyer_requests(created_at DESC);
