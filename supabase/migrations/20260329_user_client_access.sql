-- Tabela de relacionamento para permitir que um usuário acesse múltiplas contas de anúncio
-- Isso permite que um usuário veja dashboard, campanhas e metas de múltiplos clientes

CREATE TABLE IF NOT EXISTS user_client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Cada usuário só pode ter um registro de acesso por cliente
  UNIQUE(user_id, client_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_client_access_user_id ON user_client_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_client_access_client_id ON user_client_access(client_id);

-- RLS policies
ALTER TABLE user_client_access ENABLE ROW LEVEL SECURITY;

-- Admins podem ver e gerenciar todos os acessos
CREATE POLICY "Admins can manage all access" ON user_client_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Usuários podem ver seus próprios acessos
CREATE POLICY "Users can view own access" ON user_client_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Comentário explicativo
COMMENT ON TABLE user_client_access IS 'Permite que usuários acessem múltiplas contas de anúncio (clientes)';
COMMENT ON COLUMN user_client_access.access_level IS 'Nível de acesso: viewer (somente leitura), editor (pode editar), admin (acesso total)';
