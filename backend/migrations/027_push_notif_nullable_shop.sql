-- Allow platform-wide push notification campaigns (sent by admin, not tied to a shop)
ALTER TABLE push_notification_campaigns ALTER COLUMN shop_id DROP NOT NULL;
