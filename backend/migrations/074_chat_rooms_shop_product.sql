-- Buyer <-> shop chat dialogs: chat_rooms/chat_messages/chat_room_participants/
-- chat_message_reads already exist (created out-of-band, no prior migration file).
-- This adds the shop/product linkage needed for buyer<->shop dialogs (type = 20),
-- distinct from existing support (type = 1) and group (type = 10) rooms.

ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS shop_id    INTEGER REFERENCES shops(id) ON DELETE SET NULL;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_rooms_shop ON chat_rooms (shop_id);

-- One dialog per buyer + shop + product combination (NULL product_id normalised to 0).
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_buyer_shop_product
  ON chat_rooms (shop_id, "createdBy", COALESCE(product_id, 0))
  WHERE type = 20 AND shop_id IS NOT NULL;
