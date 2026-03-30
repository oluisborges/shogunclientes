-- MODERADOR COM PODERES DE ADMIN COMPLETO (CORRIGIDO)
-- Permite moderador criar usuários, criar outros moderadores e configurar agenda

-- ============================================
-- 1. POLICIES PARA PROFILES (criar/editar usuários)
-- ============================================

-- Remover policies antigas de profiles
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_gestores" ON profiles;
DROP POLICY IF EXISTS "moderadores_select_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_all_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON profiles;

-- Policy: Usuários veem seu próprio perfil
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

-- Policy: Admins e moderadores gerenciam TODOS os perfis
CREATE POLICY "admins_moderadores_manage_profiles" ON profiles
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- ============================================
-- 2. POLICIES PARA CLIENTES
-- ============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
DROP POLICY IF EXISTS "admins_moderadores_all_clients" ON clients;

-- Policy: Clientes veem seus próprios dados
CREATE POLICY "clients_own_data" ON clients
  FOR ALL
  USING (profile_id = auth.uid());

-- Policy: Admins e moderadores gerenciam TODOS os clientes
CREATE POLICY "admins_moderadores_all_clients" ON clients
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- ============================================
-- 3. POLICIES PARA BOOKINGS/AGENDAMENTO
-- ============================================

-- Bookings (agendamentos)
DROP POLICY IF EXISTS "bookings_own" ON bookings;
DROP POLICY IF EXISTS "bookings_gestores" ON bookings;
DROP POLICY IF EXISTS "admins_moderadores_all_bookings" ON bookings;

CREATE POLICY "admins_moderadores_all_bookings" ON bookings
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Booking blocked dates
DROP POLICY IF EXISTS "booking_blocked_own" ON booking_blocked_dates;
DROP POLICY IF EXISTS "booking_blocked_gestores" ON booking_blocked_dates;
DROP POLICY IF EXISTS "admins_moderadores_all_booking_blocked" ON booking_blocked_dates;

CREATE POLICY "admins_moderadores_all_booking_blocked" ON booking_blocked_dates
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Booking slots
DROP POLICY IF EXISTS "booking_slots_own" ON booking_slots;
DROP POLICY IF EXISTS "booking_slots_gestores" ON booking_slots;
DROP POLICY IF EXISTS "admins_moderadores_all_booking_slots" ON booking_slots;

CREATE POLICY "admins_moderadores_all_booking_slots" ON booking_slots
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- ============================================
-- 4. POLICIES PARA CONFIGURAÇÕES GLOBAIS
-- ============================================

-- App settings (configs globais)
DROP POLICY IF EXISTS "admins_manage_settings" ON app_settings;
DROP POLICY IF EXISTS "moderadores_view_app_settings" ON app_settings;

CREATE POLICY "admins_moderadores_manage_settings" ON app_settings
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- AI agents
DROP POLICY IF EXISTS "admins_manage_agents" ON ai_agents;
DROP POLICY IF EXISTS "users_read_active_agents" ON ai_agents;

CREATE POLICY "admins_moderadores_manage_agents" ON ai_agents
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- ============================================
-- 5. POLICIES PARA TABELAS DE GESTÃO
-- ============================================

-- Goals
DROP POLICY IF EXISTS "goals_own" ON goals;
DROP POLICY IF EXISTS "goals_gestores" ON goals;
DROP POLICY IF EXISTS "admins_moderadores_all_goals" ON goals;

CREATE POLICY "admins_moderadores_all_goals" ON goals
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Goal progress
DROP POLICY IF EXISTS "goal_progress_own" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_gestores" ON goal_progress;
DROP POLICY IF EXISTS "admins_moderadores_all_goal_progress" ON goal_progress;

CREATE POLICY "admins_moderadores_all_goal_progress" ON goal_progress
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Sales history
DROP POLICY IF EXISTS "sales_history_own" ON sales_history;
DROP POLICY IF EXISTS "sales_history_gestores" ON sales_history;
DROP POLICY IF EXISTS "admins_moderadores_all_sales_history" ON sales_history;

CREATE POLICY "admins_moderadores_all_sales_history" ON sales_history
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Meta cache
DROP POLICY IF EXISTS "meta_cache_own" ON meta_cache;
DROP POLICY IF EXISTS "meta_cache_gestores" ON meta_cache;
DROP POLICY IF EXISTS "admins_moderadores_all_meta_cache" ON meta_cache;

CREATE POLICY "admins_moderadores_all_meta_cache" ON meta_cache
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Activity logs
DROP POLICY IF EXISTS "activity_logs_own" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_gestores" ON activity_logs;
DROP POLICY IF EXISTS "admins_moderadores_all_activity_logs" ON activity_logs;

CREATE POLICY "admins_moderadores_all_activity_logs" ON activity_logs
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- Gestores nicho
DROP POLICY IF EXISTS "gestores_nicho_own" ON gestores_nicho;
DROP POLICY IF EXISTS "admins_moderadores_all_gestores_nicho" ON gestores_nicho;

CREATE POLICY "admins_moderadores_all_gestores_nicho" ON gestores_nicho
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

-- ============================================
-- 6. CONFIRMAÇÃO
-- ============================================

SELECT '✅ Moderador agora tem poderes de admin completo!' as status;

-- Listar todas as tabelas que moderador pode gerenciar
SELECT tablename, policyname
FROM pg_policies 
WHERE policyname LIKE '%moderadores%' OR policyname LIKE '%admins_moderadores%'
ORDER BY tablename, policyname;
