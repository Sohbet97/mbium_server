-- 020: Add slug + is_system to roles for programmatic role identification

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS slug      VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles (slug) WHERE slug IS NOT NULL;
