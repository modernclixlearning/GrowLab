-- F4 — Plant Photos migration (UP)
--
-- hero_photo_url was already added to `plants` in 0001_f2_schema_extensions.sql
-- so we only need to create the `plant_photos` table here.

CREATE TABLE IF NOT EXISTS "plant_photos" (
  "id"          text PRIMARY KEY NOT NULL,
  "plant_id"    text NOT NULL,
  "stage"       text NOT NULL,
  "url"         text NOT NULL,
  "source_type" text NOT NULL,
  "ai_prompt"   text,
  "ai_provider" text,
  "width"       integer,
  "height"      integer,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "plant_photos"
    ADD CONSTRAINT "plant_photos_plant_id_plants_id_fk"
    FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_plant_photos_plant_id_stage"
  ON "plant_photos" USING btree ("plant_id", "stage");
