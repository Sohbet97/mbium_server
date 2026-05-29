-- 038: KYC document tracking per shop

CREATE TABLE IF NOT EXISTS kyc_documents (
    id           SERIAL       PRIMARY KEY,
    shop_id      INTEGER      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    type         VARCHAR(30)  NOT NULL CHECK (type IN ('PASSPORT', 'TAX_ID', 'BUSINESS_REG', 'BANK_STATEMENT', 'OTHER')),
    file_url     TEXT         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at  TIMESTAMPTZ,
    note         TEXT,
    createdAt    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updatedAt    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_shop   ON kyc_documents (shop_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents (status);
