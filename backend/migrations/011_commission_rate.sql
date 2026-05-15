-- Add platform commission rate to global config (default 5%)
ALTER TABLE configurations ADD COLUMN IF NOT EXISTS platform_commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0500;

-- Ensure at least one config row exists so the engine always has a rate to read
INSERT INTO configurations ("createdAt", "updatedAt")
SELECT NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM configurations);
