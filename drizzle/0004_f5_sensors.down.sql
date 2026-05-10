-- F5 down migration: remove sensor tables
DROP TABLE IF EXISTS growth_measurements;
DROP TABLE IF EXISTS sensor_readings;
DROP TABLE IF EXISTS sensor_devices;
