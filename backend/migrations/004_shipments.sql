CREATE TABLE IF NOT EXISTS shipments (
    id                SERIAL          PRIMARY KEY,
    order_id          INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier           VARCHAR(100)    DEFAULT NULL,
    tracking_number   VARCHAR(100)    DEFAULT NULL,
    status            VARCHAR(30)     NOT NULL DEFAULT 'PENDING',
    shipped_at        TIMESTAMPTZ     DEFAULT NULL,
    delivered_at      TIMESTAMPTZ     DEFAULT NULL,
    notes             TEXT            DEFAULT NULL,
    "createdAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id         ON shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status           ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number  ON shipments (tracking_number);
