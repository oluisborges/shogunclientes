-- CORREÇÃO: Garantir que moderadores vejam todos os clientes no seletor
-- O problema é que as policies existentes podem estar bloqueando o acesso

-- ============================================
-- 1. PRIMEIRO: Remover TODAS as policies antigas de moderador para evitar conflitos
-- ============================================

-- Remover policies antigas de moderador (tanto as do add_moderador_role.sql quanto as novas)
DROP POLICY IF EXISTS "moderadores_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "moderadores_view_all_clients" ON public.clients;
DROP POLICY IF EXISTS "moderadores_update_clients" ON public.clients;
DROP POLICY IF EXISTS "moderadores_view_goals" ON public.goals;
DROP POLICY IF EXISTS "moderadores_view_goal_progress" ON public.goal_progress;
DROP POLICY IF EXISTS "moderadores_view_sales_history" ON public.sales_history;
DROP POLICY IF EXISTS "moderadores_view_meta_cache" ON public.meta_cache;
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "moderadores_all_access_clients" ON public.clients;
DROP POLICY IF EXISTS "moderadores_all_access_goals" ON public.goals;
DROP POLICY IF EXISTS "moderadores_all_access_goal_progress" ON public.goal_progress;
DROP POLICY IF EXISTS "moderadores_all_access_sales_history" ON public.sales_history;
DROP POLICY IF EXISTS "moderadores_all_access_meta_cache" ON public.meta_cache;

-- ============================================
-- 2. CRIAR POLICY SIMPLES E DIRETA para moderadores
-- ============================================

-- Profiles: Moderadores veem todos os perfis (SELECT apenas)
CREATE POLICY "moderadores_select_profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Clients: Moderadores veem TODOS os clientes (SELECT apenas - essencial para o seletor)
CREATE POLICY "moderadores_select_all_clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Clients: Moderadores podem atualizar clientes
CREATE POLICY "moderadores_update_clients" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Goals: Moderadores veem todas as metas
CREATE POLICY "moderadores_select_goals" ON public.goals
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Goal progress: Moderadores veem todo o progresso
CREATE POLICY "moderadores_select_goal_progress" ON public.goal_progress
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Sales history: Moderadores veem todo o histórico
CREATE POLICY "moderadores_select_sales_history" ON public.sales_history
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Meta cache: Moderadores veem todo o cache
CREATE POLICY "moderadores_select_meta_cache" ON public.meta_cache
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'moderador'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- 3. VERIFICAR SE O USUÁRIO TEM ROLE CORRETA
-- ============================================

-- Comando para verificar (execute no SQL Editor):
-- SELECT id, email, role FROM profiles WHERE email LIKE '%leonardo%' OR full_name LIKE '%Leonardo%';

-- Comando para corrigir se necessário:
-- UPDATE profiles SET role = 'moderador' WHERE email = 'email_do_leonardo';

-- ============================================
-- 4. TESTE: Verificar se moderador consegue ver clientes
-- ============================================

-- Execute este teste no SQL Editor como usuário moderador:
-- SELECT COUNT(*) FROM clients;
-- SELECT * FROM clients LIMIT 5;

-- Se retornar 0 ou erro, há problema na policy
-- Se retornar os clientes, está funcionando

COMMENT ON TABLE public.clients IS 'Clientes. Moderadores têm acesso total de visualização (SELECT)';
