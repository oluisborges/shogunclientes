-- DIAGNÓSTICO E CORREÇÃO PARA MODERADOR NÃO VER CLIENTES
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PASSO 1: Verificar qual é a role do Leonardo
-- ============================================
SELECT 
  id, 
  full_name, 
  email, 
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin'
    WHEN role = 'moderador' THEN '✅ Moderador'
    WHEN role = 'gestor' THEN '⚠️ Gestor'
    WHEN role = 'cliente' THEN '⚠️ Cliente'
    ELSE '❌ Sem role ou role inválida'
  END as status
FROM profiles 
WHERE full_name ILIKE '%leonardo%' 
   OR email ILIKE '%leonardo%';

-- Se o Leonardo aparecer como 'cliente' ou NULL, execute:
-- UPDATE profiles SET role = 'moderador' WHERE email = 'email_do_leonardo@exemplo.com';

-- ============================================
-- PASSO 2: Verificar policies existentes na tabela clients
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'clients';

-- ============================================
-- PASSO 3: Remover TODAS as policies de clients e recriar
-- ============================================

-- Desabilitar RLS temporariamente
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies existentes
DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_view_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_update_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_all_access_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_select_all_clients" ON clients;

-- Reabilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Criar policy para clientes verem seus próprios dados
CREATE POLICY "clients_own_data" ON clients
  FOR ALL
  USING (profile_id = auth.uid());

-- Criar policy para admins e moderadores verem TUDO
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
-- PASSO 4: Testar acesso
-- ============================================

-- Contar quantos clientes existem
SELECT COUNT(*) as total_clientes FROM clients;

-- Verificar se o moderador consegue selecionar
-- (Execute como usuário autenticado)
SELECT 'Teste de acesso' as teste, 
       (SELECT role FROM profiles WHERE id = auth.uid()) as minha_role,
       (SELECT COUNT(*) FROM clients) as total_clientes_visiveis;

-- ============================================
-- PASSO 5: Aplicar a mesma correção para outras tabelas principais
-- ============================================

-- GOALS - Remover e recriar policies
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals_own" ON goals;
DROP POLICY IF EXISTS "goals_gestores" ON goals;
DROP POLICY IF EXISTS "moderadores_view_goals" ON goals;
DROP POLICY IF EXISTS "moderadores_all_access_goals" ON goals;
DROP POLICY IF EXISTS "moderadores_select_goals" ON goals;
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

-- SALES_HISTORY - Remover e recriar policies
ALTER TABLE sales_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_history_own" ON sales_history;
DROP POLICY IF EXISTS "sales_history_gestores" ON sales_history;
DROP POLICY IF EXISTS "moderadores_view_sales_history" ON sales_history;
DROP POLICY IF EXISTS "moderadores_all_access_sales_history" ON sales_history;
DROP POLICY IF EXISTS "moderadores_select_sales_history" ON sales_history;
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_history_own" ON sales_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = sales_history.client_id 
      AND clients.profile_id = auth.uid()
    )
  );

CREATE POLICY "admins_moderadores_all_sales_history" ON sales_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- META_CACHE - Remover e recriar policies
ALTER TABLE meta_cache DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meta_cache_own" ON meta_cache;
DROP POLICY IF EXISTS "meta_cache_gestores" ON meta_cache;
DROP POLICY IF EXISTS "moderadores_view_meta_cache" ON meta_cache;
DROP POLICY IF EXISTS "moderadores_all_access_meta_cache" ON meta_cache;
DROP POLICY IF EXISTS "moderadores_select_meta_cache" ON meta_cache;
ALTER TABLE meta_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_cache_own" ON meta_cache
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = meta_cache.client_id 
      AND clients.profile_id = auth.uid()
    )
  );

CREATE POLICY "admins_moderadores_all_meta_cache" ON meta_cache
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
-- PASSO 6: Confirmar que está tudo certo
-- ============================================

SELECT 'Policies recriadas com sucesso!' as status;

-- Listar todas as policies da tabela clients para confirmar
SELECT policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;
