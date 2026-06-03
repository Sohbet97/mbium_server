-- OTP relay service tables
-- otp_codes: tracks pending/delivered OTP send requests from the backend
-- device_tokens: FCM tokens for relay phones (fallback when no phone is connected via Socket.IO)

CREATE TABLE IF NOT EXISTS otp_codes (
  id         SERIAL      PRIMARY KEY,
  phone      VARCHAR(20) NOT NULL,
  code       VARCHAR(10) NOT NULL,
  is_sended  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_tokens (
  phone      VARCHAR(20) PRIMARY KEY,
  fcm_token  TEXT        NOT NULL,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
