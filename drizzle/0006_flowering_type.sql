-- Migration: separate flowering mechanism from genetic strain type
-- strainType: indica | sativa | hybrid  (genetic dominance)
-- floweringType: photoperiod | auto     (flowering trigger — orthogonal)

ALTER TABLE plants ADD COLUMN flowering_type text NOT NULL DEFAULT 'photoperiod';

-- Plants stored as strain_type='auto' were auto-flowering hybrids by convention.
UPDATE plants SET flowering_type = 'auto' WHERE strain_type = 'auto';
UPDATE plants SET strain_type = 'hybrid' WHERE strain_type = 'auto';
