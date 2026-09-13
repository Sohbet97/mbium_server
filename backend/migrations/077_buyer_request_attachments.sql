-- 077: Replace buyer_requests.images (ARRAY(TEXT)) with a proper attachments table
-- supporting more file types (image/video/excel/word/pdf), and add the equivalent
-- table for ÖTS offer attachments (buyer_request_offers had none before).

CREATE TABLE IF NOT EXISTS buyer_request_attachments (
    id                SERIAL PRIMARY KEY,
    buyer_request_id  INTEGER      NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
    url               TEXT         NOT NULL,
    file_type         VARCHAR(20)  NOT NULL, -- IMAGE|VIDEO|EXCEL|WORD|PDF
    mime_type         VARCHAR(120),
    original_name     TEXT,
    size              BIGINT,
    "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bra_buyer_request_id ON buyer_request_attachments (buyer_request_id);

CREATE TABLE IF NOT EXISTS buyer_request_offer_attachments (
    id                       SERIAL PRIMARY KEY,
    buyer_request_offer_id   INTEGER      NOT NULL REFERENCES buyer_request_offers(id) ON DELETE CASCADE,
    url                      TEXT         NOT NULL,
    file_type                VARCHAR(20)  NOT NULL, -- IMAGE|VIDEO|EXCEL|WORD|PDF
    mime_type                VARCHAR(120),
    original_name            TEXT,
    size                     BIGINT,
    "createdAt"              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broa_buyer_request_offer_id ON buyer_request_offer_attachments (buyer_request_offer_id);

-- Migrate existing images (always plain image URLs) into the new table, then drop the column.
INSERT INTO buyer_request_attachments (buyer_request_id, url, file_type)
SELECT br.id, img, 'IMAGE'
FROM buyer_requests br, unnest(br.images) AS img
WHERE br.images IS NOT NULL AND array_length(br.images, 1) > 0;

ALTER TABLE buyer_requests DROP COLUMN IF EXISTS images;
