-- AlterTable
ALTER TABLE "users"
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verification_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "verification_code_expires_at" TIMESTAMP(3),
ADD COLUMN "verification_code_hash" TEXT,
ADD COLUMN "verification_last_sent_at" TIMESTAMP(3),
ADD COLUMN "verification_resend_count" INTEGER NOT NULL DEFAULT 0;
