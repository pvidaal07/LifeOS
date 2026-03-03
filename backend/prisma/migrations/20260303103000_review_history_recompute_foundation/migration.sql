-- Foundation indexes/constraints for history-edit recomputation.
-- Ensures deterministic per-topic ordering and uniqueness per review number.

-- CreateIndex
CREATE UNIQUE INDEX "review_schedule_user_id_topic_id_review_number_key"
ON "review_schedule"("user_id", "topic_id", "review_number");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_topic_id_studied_at_created_at_id_idx"
ON "study_sessions"("user_id", "topic_id", "studied_at", "created_at", "id");
