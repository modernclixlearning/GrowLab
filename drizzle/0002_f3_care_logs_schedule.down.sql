-- F3 Down migration: drop F3 columns from care_logs.
-- Note: the completedAt backfill from the up migration is one-way and
-- cannot be safely reversed without risking data loss. This script only
-- drops the structural additions.
--
-- Run order: index first, then FK, then columns (reverse of up migration).

DROP INDEX IF EXISTS "idx_care_logs_scheduled_at";
--> statement-breakpoint

ALTER TABLE "care_logs" DROP CONSTRAINT IF EXISTS "care_logs_parent_schedule_id_fk";
--> statement-breakpoint

ALTER TABLE "care_logs" DROP COLUMN IF EXISTS "parent_schedule_id";
--> statement-breakpoint
ALTER TABLE "care_logs" DROP COLUMN IF EXISTS "recurrence_rule";
--> statement-breakpoint
ALTER TABLE "care_logs" DROP COLUMN IF EXISTS "completed_at";
--> statement-breakpoint
ALTER TABLE "care_logs" DROP COLUMN IF EXISTS "scheduled_at";
