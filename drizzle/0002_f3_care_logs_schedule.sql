-- F3: Care Logs Scheduling columns
-- Adds scheduledAt, completedAt, recurrenceRule, and parentScheduleId to care_logs.
-- Backfills completedAt = loggedAt for all existing historical rows.
-- All ADD COLUMN statements use IF NOT EXISTS for idempotency.

ALTER TABLE "care_logs" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "care_logs" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "care_logs" ADD COLUMN IF NOT EXISTS "recurrence_rule" jsonb;
--> statement-breakpoint
ALTER TABLE "care_logs" ADD COLUMN IF NOT EXISTS "parent_schedule_id" text;
--> statement-breakpoint

-- Self-FK: parent_schedule_id → care_logs.id ON DELETE SET NULL
-- Wrapped in duplicate_object guard for idempotency (same pattern as F2).
DO $$ BEGIN
 ALTER TABLE "care_logs" ADD CONSTRAINT "care_logs_parent_schedule_id_fk"
   FOREIGN KEY ("parent_schedule_id") REFERENCES "public"."care_logs"("id")
   ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Backfill: existing rows that were already logged (loggedAt < now()) get
-- completedAt set to loggedAt so they appear in the "done" bucket rather
-- than the pending queue. This is a one-way migration; the down script
-- does NOT attempt to undo it (see 0002_f3_care_logs_schedule.down.sql).
UPDATE "care_logs"
SET "completed_at" = "logged_at"
WHERE "logged_at" < now()
  AND "completed_at" IS NULL;
--> statement-breakpoint

-- Index to support scheduled-window queries efficiently
CREATE INDEX IF NOT EXISTS "idx_care_logs_scheduled_at"
  ON "care_logs" USING btree ("scheduled_at");
