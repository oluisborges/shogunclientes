-- CORREÇÃO URGENTE: Profiles - Moderador consegue ver seu próprio perfil

-- Remover TODAS as policies de profiles
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_gestores" ON profiles;
DROP POLICY IF EXISTS "moderadores_select_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_all_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_manage_profiles" ON profiles;

-- Criar policy única e simples:
-- 1. Usuário vê seu próprio perfil
-- 2. Admin/Moderador vê TODOS os perfis
CREATE POLICY "profiles_access" ON profiles
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid()  -- Próprio perfil
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')  -- Admin/Moderador vê tudo
  )
  WITH CHECK (
    id = auth.uid()  -- Próprio perfil
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')  -- Admin/Moderador edita tudo
  );

SELECT '✅ Policy de profiles corrigida!' as status;
