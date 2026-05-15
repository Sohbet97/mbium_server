CREATE TABLE IF NOT EXISTS disputes (
    id            SERIAL        PRIMARY KEY,
    order_id      INTEGER       NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    opened_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
    reason        TEXT          NOT NULL,
    status        VARCHAR(30)   NOT NULL DEFAULT 'OPEN',
    resolution    TEXT          DEFAULT NULL,
    resolved_by   UUID          REFERENCES users(id) ON DELETE SET NULL,
    resolved_at   TIMESTAMPTZ   DEFAULT NULL,
    "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "deletedAt"   TIMESTAMPTZ   DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id   ON disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by  ON disputes (opened_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status     ON disputes (status);

-- Dispute status values:
--   OPEN          – filed, awaiting review
--   UNDER_REVIEW  – admin is investigating
--   RESOLVED      – settled with a resolution; resolved_by + resolved_at set
--   CLOSED        – closed without resolution (e.g. buyer withdrew)
