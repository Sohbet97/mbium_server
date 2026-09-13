-- Monthly reel-posting quota per plan, mirroring push_notif_monthly's convention
-- but NULL-able: NULL = unlimited (unlike push, which has no unlimited tier today).
ALTER TABLE plans ADD COLUMN IF NOT EXISTS reel_monthly INTEGER;

UPDATE plans SET reel_monthly = 0 WHERE name = 'basic';
UPDATE plans SET reel_monthly = 10 WHERE name = 'vip';
UPDATE plans SET reel_monthly = NULL WHERE name = 'premium';
