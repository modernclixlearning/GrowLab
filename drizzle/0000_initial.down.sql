-- Down migration for 0000_initial.sql
-- Drops the entire baseline schema (pre-F2 state). Order is reverse of up:
-- 1. care_logs (FK to plants)
-- 2. plants (FK to users)
-- 3. refresh_tokens (FK to users)
-- 4. users
--
-- Drizzle's `db:migrate` does not run down scripts automatically — apply
-- this manually with `psql -f drizzle/0000_initial.down.sql` when rolling
-- back the baseline.

DROP INDEX IF EXISTS "idx_care_logs_plant_id_logged_at";
DROP TABLE IF EXISTS "care_logs";

DROP INDEX IF EXISTS "idx_plants_growth_stage";
DROP INDEX IF EXISTS "idx_plants_user_id";
DROP TABLE IF EXISTS "plants";

DROP TABLE IF EXISTS "refresh_tokens";
DROP TABLE IF EXISTS "users";
