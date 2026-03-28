-- Activity logs for tracking client navigation
CREATE TABLE user_activity_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT        NOT NULL, -- 'navigation' | 'click'
  page_label  TEXT,                 -- human-readable label e.g. "Dashboard"
  path        TEXT        NOT NULL, -- URL path e.g. "/metricas"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_activity_logs_user_id_idx ON user_activity_logs(user_id);
CREATE INDEX user_activity_logs_created_at_idx ON user_activity_logs(created_at DESC);

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own logs
CREATE POLICY "users_insert_own_activity" ON user_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins can read all logs
CREATE POLICY "admins_read_all_activity" ON user_activity_logs
  FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');
