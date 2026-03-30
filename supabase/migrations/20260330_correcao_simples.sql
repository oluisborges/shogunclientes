-- CORREÇÃO DEFINITIVA SIMPLES
-- Execute no Supabase SQL Editor

-- 1. LIMPAR policies de profiles
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_access" ON profiles;
DROP POLICY IF EXISTS "profiles_access_v1" ON profiles;
DROP POLICY IF EXISTS "profiles_modify_v1" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_select_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_all_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON profiles;

-- 2. LIMPAR policies de clients
DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "clients_own_v1" ON clients;
DROP POLICY IF EXISTS "clients_admin_v1" ON clients;
DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
DROP POLICY IF EXISTS "admins_moderadores_all_clients" ON clients;

-- 3. RECRIAR POLICY SIMPLES para profiles
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- 4. RECRIAR POLICY SIMPLES para clients  
CREATE POLICY "clients_select" ON clients
  FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

SELECT '✅ Correção aplicada!' as mensagem;
