-- CORREÇÃO DEFINITIVA SIMPLES - Execute no Supabase SQL Editor

-- ============================================
-- 1. LIMPAR TUDO E RECOMEÇAR (PROFILES)
-- ============================================

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_gestores" ON profiles;
DROP POLICY IF EXISTS "profiles_access" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_select_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_all_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON profiles;

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Policy simples: usuário vê seu próprio perfil OU admin/moderador vê tudo
CREATE POLICY "profiles_access_v1" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('admin', 'moderador'))
  );

-- Policy para inserir/atualizar: só admin/moderador
CREATE POLICY "profiles_modify_v1" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('admin', 'moderador'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('admin', 'moderador'))
  );

-- ============================================
-- 2. LIMPAR E RECRIAR (CLIENTS)
-- ============================================

ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
DROP POLICY IF EXISTS "admins_moderadores_all_clients" ON clients;

ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;

-- Cliente vê seus próprios clientes
CREATE POLICY "clients_own_v1" ON clients
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid());

-- Admin/Moderador vê tudo
CREATE POLICY "clients_admin_v1" ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderador'))
  );

-- ============================================
-- 3. CONFIRMAÇÃO
-- ============================================

SELECT '✅ Policies recriadas com sucesso!' as mensagem;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'clients')
ORDER BY tablename, policyname;
