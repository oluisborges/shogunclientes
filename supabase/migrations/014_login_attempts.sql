-- Login attempts log for security monitoring
CREATE TABLE IF NOT EXISTS login_attempts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT        NOT NULL,
  success     BOOLEAN     NOT NULL DEFAULT false,
  ip          TEXT,
  country     TEXT,
  region      TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX login_attempts_created_at_idx ON login_attempts(created_at DESC);
CREATE INDEX login_attempts_email_idx ON login_attempts(email);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "admins_read_login_attempts" ON login_attempts
  FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');

-- Anyone (including unauthenticated) can insert — needed for failed login logging
CREATE POLICY "anyone_insert_login_attempts" ON login_attempts
  FOR INSERT
  WITH CHECK (true);
