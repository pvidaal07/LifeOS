-- Convert auth verification timestamps to timezone-aware columns.
-- Existing values are interpreted as UTC instants to preserve current semantics.
ALTER TABLE "users"
ALTER COLUMN "verification_code_expires_at"
TYPE TIMESTAMPTZ(3)
USING "verification_code_expires_at" AT TIME ZONE 'UTC',
ALTER COLUMN "verification_last_sent_at"
TYPE TIMESTAMPTZ(3)
USING "verification_last_sent_at" AT TIME ZONE 'UTC';
