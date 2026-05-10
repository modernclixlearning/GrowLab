CREATE TABLE IF NOT EXISTS "tents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"light_target" text,
	"humidity_target_pct" numeric(5, 2),
	"temp_target_c" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "strain_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"strain_type" text NOT NULL,
	"stage_durations" jsonb,
	"default_light_schedule" jsonb,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "strain_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stage_mode" text DEFAULT 'expert' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "units_preference" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_prefs" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_tent_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "tent_id" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "strain_template_id" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "strain_name" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "stage_duration_override" jsonb;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "light_schedule" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "hero_photo_url" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "week_delta_cache" numeric(6, 2);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tents" ADD CONSTRAINT "tents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tents_user_id" ON "tents" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_default_tent_id_tents_id_fk" FOREIGN KEY ("default_tent_id") REFERENCES "public"."tents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plants" ADD CONSTRAINT "plants_tent_id_tents_id_fk" FOREIGN KEY ("tent_id") REFERENCES "public"."tents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plants" ADD CONSTRAINT "plants_strain_template_id_strain_templates_id_fk" FOREIGN KEY ("strain_template_id") REFERENCES "public"."strain_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
