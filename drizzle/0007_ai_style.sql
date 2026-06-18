-- #26 — AI style templates: persist the chosen style key on each photo.
--
-- Nullable text column on plant_photos. Null for uploads and for AI photos
-- generated before this migration. The final aiPrompt already embeds the
-- style modifier, so existing rows keep minimal traceability (REG-3).

ALTER TABLE "plant_photos" ADD COLUMN IF NOT EXISTS "ai_style" text;
