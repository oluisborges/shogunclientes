-- Add details JSON column to activity logs for richer event data
ALTER TABLE user_activity_logs
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT NULL;
