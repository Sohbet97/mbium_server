-- New OTP purpose for the phone-only request-otp/verify-otp flow (added
-- alongside the existing session_id-keyed login/register/2FA flow, which is
-- untouched). Postgres requires ADD VALUE to run outside any other DDL in the
-- same transaction, so this migration does nothing else.
ALTER TYPE enum_user_otp_sessions_purpose ADD VALUE IF NOT EXISTS 'PHONE_LOGIN';
