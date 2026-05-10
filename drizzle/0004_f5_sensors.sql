-- F5: Sensor Devices, Sensor Readings, Growth Measurements
-- Adds three new tables: sensor_devices, sensor_readings, growth_measurements.
-- All CREATE TABLE statements use IF NOT EXISTS for idempotency.

CREATE TABLE IF NOT EXISTS sensor_devices (
  id                text PRIMARY KEY,
  user_id           text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          text NOT NULL,
  api_key_encrypted text,
  label             text NOT NULL,
  target_plant_id   text REFERENCES plants(id) ON DELETE SET NULL,
  target_tent_id    text REFERENCES tents(id) ON DELETE SET NULL,
  last_poll_at      timestamp with time zone,
  last_error        text,
  created_at        timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_sensor_devices_user_id ON sensor_devices(user_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS sensor_readings (
  id               text PRIMARY KEY,
  sensor_device_id text NOT NULL REFERENCES sensor_devices(id) ON DELETE CASCADE,
  plant_id         text REFERENCES plants(id) ON DELETE SET NULL,
  tent_id          text REFERENCES tents(id) ON DELETE SET NULL,
  metric           text NOT NULL,
  value            numeric(10,4) NOT NULL,
  unit             text NOT NULL,
  recorded_at      timestamp with time zone NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_sensor_readings_metric_recorded_at
  ON sensor_readings(metric, recorded_at);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_sensor_readings_plant_metric_recorded
  ON sensor_readings(plant_id, metric, recorded_at)
  WHERE plant_id IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS growth_measurements (
  id          text PRIMARY KEY,
  plant_id    text NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  metric      text NOT NULL,
  value       numeric(10,2) NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_growth_measurements_plant_id
  ON growth_measurements(plant_id, recorded_at);
