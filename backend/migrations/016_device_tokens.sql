-- 016: FCM device tokens on users for push notifications

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS device_tokens JSONB NOT NULL DEFAULT '[]';
