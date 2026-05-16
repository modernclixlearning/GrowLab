-- F6: Notifications, Push Subscriptions, and Tent tolerance columns
-- Uses IF NOT EXISTS / IF NOT EXISTS ADD COLUMN for idempotency.

CREATE TABLE IF NOT EXISTS notifications (
  id             text PRIMARY KEY,
  user_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           text NOT NULL,
  title          text NOT NULL,
  body           text NOT NULL,
  reference_id   text,
  reference_type text,
  channel_key    text,
  read_at        timestamp with time zone,
  created_at     timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, read_at);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_notifications_channel_key
  ON notifications(user_id, channel_key, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh_key  text NOT NULL,
  auth_key    text NOT NULL,
  user_agent  text,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);
--> statement-breakpoint

ALTER TABLE tents
  ADD COLUMN IF NOT EXISTS humidity_tolerance_pct numeric(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS temp_tolerance_c       numeric(5,2) DEFAULT 2.00;
