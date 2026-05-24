CREATE TABLE ai_conversations (
  id         SERIAL    PRIMARY KEY,
  user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL DEFAULT 'New chat',
  messages   JSONB     NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ON ai_conversations(user_id);
CREATE INDEX ON ai_conversations(created_at);
