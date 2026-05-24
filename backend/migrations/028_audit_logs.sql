CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL    PRIMARY KEY,
    entity_type VARCHAR(60)  NOT NULL,
    entity_id   VARCHAR(100),
    action      VARCHAR(40)  NOT NULL,
    actor_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    ip_address  VARCHAR(100),
    description TEXT,
    "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_al_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_al_actor_id    ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_al_action      ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_al_createdat   ON audit_logs ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_al_type_date   ON audit_logs (entity_type, "createdAt" DESC);
