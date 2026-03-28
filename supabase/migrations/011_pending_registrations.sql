-- Table for self-registered users awaiting admin approval
CREATE TABLE IF NOT EXISTS pending_registrations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text        NOT NULL,
  business_name text        NOT NULL,
  cnpj          text,
  email         text        NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- Only accessible via service_role (admin client), no public RLS policies needed
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
