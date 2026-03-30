-- CORREÇÃO FINAL: Moderador acesso a todos os clientes
-- A tabela profiles não tem coluna email, ela está em auth.users

-- ============================================
-- PASSO 1: Verificar qual é a role do usuário Leonardo (sem coluna email)
SELECT 
  p.id, 
  p.full_name, 
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin'
    WHEN p.role = 'moderador' THEN '✅ Moderador'
    WHEN p.role = 'gestor' THEN '⚠️ Gestor'
    WHEN p.role = 'cliente' THEN '⚠️ Cliente'
    ELSE '❌ Sem role ou role inválida: ' || COALESCE(p.role, 'NULL')
  END as status
FROM profiles p
WHERE p.full_name ILIKE '%leonardo%' 
   OR p.full_name ILIKE '%moderador%';

-- ============================================
-- PASSO 2: Se a role estiver errada, corrija (substitua o ID correto)
-- ============================================
-- UPDATE profiles SET role = 'moderador' WHERE id = 'ID_DO_LEONARDO_AQUI';

-- ============================================
-- PASSO 3: Verificar se há clients no sistema
-- ============================================
SELECT COUNT(*) as total_clientes FROM clients;

-- Ver os primeiros clientes
SELECT id, business_name, profile_id, active FROM clients LIMIT 5;

-- ============================================
-- PASSO 4: LIMPAR E RECRIAR POLICIES (EXECUTE ISSO)
-- ============================================

-- Desabilitar RLS temporariamente
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as policies existentes de clients
DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_view_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_update_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_all_access_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_select_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_select_clients" ON clients;
DROP POLICY IF EXISTS "admins_moderadores_all_clients" ON clients;

-- Reabilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy 1: Clientes veem seus próprios dados
CREATE POLICY "clients_own_data" ON clients
  FOR ALL
  USING (profile_id = auth.uid());

-- Policy 2: Admins e Moderadores veem TUDO (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admins_moderadores_all_clients" ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- ============================================
-- PASSO 5: Aplicar a mesma correção para GOALS
-- ============================================
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals_own" ON goals;
DROP POLICY IF EXISTS "goals_gestores" ON goals;
DROP POLICY IF EXISTS "moderadores_view_goals" ON goals;
DROP POLICY IF EXISTS "moderadores_all_access_goals" ON goals;
DROP POLICY IF EXISTS "moderadores_select_goals" ON goals;
DROP POLICY IF EXISTS "admins_moderadores_all_goals" ON goals;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_own" ON goals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = goals.client_id 
      AND clients.profile_id = auth.uid()
    )
  );

CREATE POLICY "admins_moderadores_all_goals" ON goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- ============================================
-- PASSO 6: Confirmar
-- ============================================
SELECT '✅ Policies recriadas com sucesso!' as status;

-- Verificar policies atuais
SELECT policyname, permissive, roles::text, cmd, qual
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;
