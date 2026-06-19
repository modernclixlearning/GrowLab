-- Rollback: drop the AI style column from plant_photos.
ALTER TABLE "plant_photos" DROP COLUMN IF EXISTS "ai_style";
