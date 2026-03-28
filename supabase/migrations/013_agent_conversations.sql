CREATE TABLE IF NOT EXISTS agent_conversations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id    TEXT        NOT NULL,
  agent_name  TEXT        NOT NULL,
  messages    JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX agent_conversations_user_id_idx ON agent_conversations(user_id);
CREATE INDEX agent_conversations_created_at_idx ON agent_conversations(created_at DESC);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own conversations
CREATE POLICY "users_insert_own_conversations" ON agent_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "users_update_own_conversations" ON agent_conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all conversations
CREATE POLICY "admins_read_all_conversations" ON agent_conversations
  FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');
