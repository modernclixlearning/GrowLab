-- F4 — Plant Photos migration (DOWN)
--
-- Drop the plant_photos table. hero_photo_url on `plants` was added in
-- 0001 (F2), so we do NOT drop it here — it stays for F2 compatibility.

DROP TABLE IF EXISTS "plant_photos";
