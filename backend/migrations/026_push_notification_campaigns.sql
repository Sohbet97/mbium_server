CREATE TABLE push_notification_campaigns (
  id              SERIAL PRIMARY KEY,
  shop_id         INTEGER   NOT NULL REFERENCES shops(id),
  created_by      UUID      NOT NULL REFERENCES users(id),
  title           VARCHAR(200) NOT NULL,
  body            TEXT      NOT NULL,
  image_url       TEXT,
  data            JSONB,
  status          SMALLINT  NOT NULL DEFAULT 0,  -- 0=pending 1=sent 2=failed
  recipient_count INTEGER   NOT NULL DEFAULT 0,
  success_count   INTEGER   NOT NULL DEFAULT 0,
  fail_count      INTEGER   NOT NULL DEFAULT 0,
  sent_at         TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ON push_notification_campaigns(shop_id);
CREATE INDEX ON push_notification_campaigns(created_at);
