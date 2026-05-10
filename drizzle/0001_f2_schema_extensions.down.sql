-- Down migration for 0001_f2_schema_extensions.sql
-- Reverses every change in the up script in strict reverse order so FKs
-- are dropped before their target tables.
--
-- Apply manually with `psql -f drizzle/0001_f2_schema_extensions.down.sql`.
-- Drizzle's `db:migrate` does not run down scripts automatically.
--
-- Idempotent: each statement uses IF EXISTS so it can be re-run after a
-- partial rollback. Order:
--   1. Drop FKs that reference tents/strain_templates from plants/users.
--   2. Drop the index on tents.user_id and the FK from tents → users.
--   3. Drop columns added to plants.
--   4. Drop columns added to users (defaultTentId before tents table drop).
--   5. Drop strain_templates table (no inbound FKs once plants column gone).
--   6. Drop tents table.

-- 1. FKs from plants → tents/strain_templates
ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "plants_strain_template_id_strain_templates_id_fk";
ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "plants_tent_id_tents_id_fk";

-- 2. FK from users → tents (so we can drop tents safely)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_default_tent_id_tents_id_fk";

-- 3. Drop F2 columns from plants
ALTER TABLE "plants" DROP COLUMN IF EXISTS "week_delta_cache";
ALTER TABLE "plants" DROP COLUMN IF EXISTS "hero_photo_url";
ALTER TABLE "plants" DROP COLUMN IF EXISTS "light_schedule";
ALTER TABLE "plants" DROP COLUMN IF EXISTS "stage_duration_override";
ALTER TABLE "plants" DROP COLUMN IF EXISTS "strain_name";
ALTER TABLE "plants" DROP COLUMN IF EXISTS "strain_template_id";
ALTER TABLE "plants" DROP COLUMN IF EXISTS "tent_id";

-- 4. Drop F2 columns from users (defaultTentId already detached above)
ALTER TABLE "users" DROP COLUMN IF EXISTS "has_onboarded";
ALTER TABLE "users" DROP COLUMN IF EXISTS "default_tent_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "notification_prefs";
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url";
ALTER TABLE "users" DROP COLUMN IF EXISTS "units_preference";
ALTER TABLE "users" DROP COLUMN IF EXISTS "stage_mode";

-- 5. Drop strain_templates (no remaining FKs)
DROP TABLE IF EXISTS "strain_templates";

-- 6. Drop tents (FK to users.id was cascade-from-users-side, but the
--    constraint lives on tents itself; dropping the table removes it).
DROP INDEX IF EXISTS "idx_tents_user_id";
DROP TABLE IF EXISTS "tents";
