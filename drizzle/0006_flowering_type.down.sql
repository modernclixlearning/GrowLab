-- Rollback: re-merge flowering type back into strain_type='auto'
UPDATE plants SET strain_type = 'auto' WHERE flowering_type = 'auto';
ALTER TABLE plants DROP COLUMN flowering_type;
