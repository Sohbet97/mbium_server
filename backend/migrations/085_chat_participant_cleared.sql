-- Per-participant "hide conversation": messages with id <= cleared_up_to are hidden for that
-- participant only. The room reappears in their list when a newer message arrives.
ALTER TABLE chat_room_participants ADD COLUMN IF NOT EXISTS cleared_up_to INTEGER;
