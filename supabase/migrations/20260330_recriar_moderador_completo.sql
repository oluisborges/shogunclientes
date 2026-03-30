-- RECRIAÇÃO COMPLETA: Moderador com acesso igual a Admin, exceto gerenciar admins
-- Execute este arquivo no SQL Editor do Supabase

-- ============================================
-- 1. LIMPAR TODAS AS POLICIES EXISTENTES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_gestores" ON profiles;
DROP POLICY IF EXISTS "profiles_access" ON profiles;
DROP POLICY IF EXISTS "profiles_access_v1" ON profiles;
DROP POLICY IF EXISTS "profiles_modify_v1" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_all_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_select_profiles" ON profiles;
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_moderadores_select_profiles" ON profiles;

-- Clients
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "clients_own_v1" ON clients;
DROP POLICY IF EXISTS "clients_admin_v1" ON clients;
DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
DROP POLICY IF EXISTS "admins_moderadores_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_view_all_clients" ON clients;
DROP POLICY IF EXISTS "moderadores_update_clients" ON clients;

-- App Settings
DROP POLICY IF EXISTS "admins_manage_settings" ON app_settings;
DROP POLICY IF EXISTS "moderadores_view_app_settings" ON app_settings;
DROP POLICY IF EXISTS "admins_moderadores_manage_settings" ON app_settings;
DROP POLICY IF EXISTS "admins_moderadores_settings" ON app_settings;

-- AI Agents
DROP POLICY IF EXISTS "admins_manage_agents" ON ai_agents;
DROP POLICY IF EXISTS "users_read_active_agents" ON ai_agents;
DROP POLICY IF EXISTS "admins_moderadores_manage_agents" ON ai_agents;

-- Goals
DROP POLICY IF EXISTS "goals_own" ON goals;
DROP POLICY IF EXISTS "goals_gestores" ON goals;
DROP POLICY IF EXISTS "admins_moderadores_all_goals" ON goals;
DROP POLICY IF EXISTS "moderadores_view_goals" ON goals;

-- Goal Progress
DROP POLICY IF EXISTS "goal_progress_own" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_gestores" ON goal_progress;
DROP POLICY IF EXISTS "admins_moderadores_all_goal_progress" ON goal_progress;
DROP POLICY IF EXISTS "moderadores_view_goal_progress" ON goal_progress;

-- Sales History
DROP POLICY IF EXISTS "sales_history_own" ON sales_history;
DROP POLICY IF EXISTS "sales_history_gestores" ON sales_history;
DROP POLICY IF EXISTS "admins_moderadores_all_sales_history" ON sales_history;
DROP POLICY IF EXISTS "moderadores_view_sales_history" ON sales_history;

-- Meta Cache
DROP POLICY IF EXISTS "meta_cache_own" ON meta_cache;
DROP POLICY IF EXISTS "meta_cache_gestores" ON meta_cache;
DROP POLICY IF EXISTS "admins_moderadores_all_meta_cache" ON meta_cache;
DROP POLICY IF EXISTS "moderadores_view_meta_cache" ON meta_cache;

-- Activity Logs
DROP POLICY IF EXISTS "activity_logs_own" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_gestores" ON activity_logs;
DROP POLICY IF EXISTS "admins_moderadores_all_activity_logs" ON activity_logs;

-- Activity Details
DROP POLICY IF EXISTS "activity_details_own" ON activity_details;
DROP POLICY IF EXISTS "admins_moderadores_all_activity_details" ON activity_details;

-- Login Attempts
DROP POLICY IF EXISTS "login_attempts_own" ON login_attempts;
DROP POLICY IF EXISTS "admins_moderadores_all_login_attempts" ON login_attempts;

-- Gestores Nicho
DROP POLICY IF EXISTS "gestores_nicho_own" ON gestores_nicho;
DROP POLICY IF EXISTS "admins_moderadores_all_gestores_nicho" ON gestores_nicho;

-- Pending Registrations
DROP POLICY IF EXISTS "pending_registrations_own" ON pending_registrations;
DROP POLICY IF EXISTS "admins_moderadores_all_pending_registrations" ON pending_registrations;

-- Agent Conversations
DROP POLICY IF EXISTS "agent_conversations_own" ON agent_conversations;
DROP POLICY IF EXISTS "admins_moderadores_all_agent_conversations" ON agent_conversations;

-- Bookings
DROP POLICY IF EXISTS "bookings_own" ON bookings;
DROP POLICY IF EXISTS "admins_moderadores_all_bookings" ON bookings;

-- Booking Blocked Dates
DROP POLICY IF EXISTS "booking_blocked_own" ON booking_blocked_dates;
DROP POLICY IF EXISTS "booking_blocked_gestores" ON booking_blocked_dates;
DROP POLICY IF EXISTS "admins_moderadores_all_booking_blocked" ON booking_blocked_dates;

-- Booking Blocked Slots
DROP POLICY IF EXISTS "blocked_slots_admin" ON booking_blocked_slots;
DROP POLICY IF EXISTS "blocked_slots_read" ON booking_blocked_slots;
DROP POLICY IF EXISTS "admins_moderadores_all_blocked_slots" ON booking_blocked_slots;

-- Booking Window Config
DROP POLICY IF EXISTS "window_config_admin" ON booking_window_config;
DROP POLICY IF EXISTS "window_config_read" ON booking_window_config;
DROP POLICY IF EXISTS "admins_moderadores_window_config" ON booking_window_config;

-- User Client Access
DROP POLICY IF EXISTS "user_client_access_own" ON user_client_access;
DROP POLICY IF EXISTS "admins_moderadores_all_user_client_access" ON user_client_access;

-- ============================================
-- 2. FUNÇÃO HELPER PARA VERIFICAR SE É ADMIN OU MODERADOR
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_moderador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_only()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. POLICIES PARA PROFILES (COM RESTRIÇÃO DE ADMIN)
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados veem seu próprio perfil
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin e Moderador veem TODOS os perfis
CREATE POLICY "profiles_admin_moderador_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_or_moderador());

-- Admin e Moderador podem criar novos perfis (exceto outros admins)
CREATE POLICY "profiles_admin_moderador_insert" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_moderador()
    AND (
      -- Se for moderador, não pode criar admin
      (get_user_role() = 'moderador' AND role != 'admin')
      OR
      -- Se for admin, pode criar qualquer coisa
      get_user_role() = 'admin'
    )
  );

-- Admin e Moderador podem atualizar perfis
-- Moderador não pode: promover para admin, alterar role de admin existente, remover admin
CREATE POLICY "profiles_admin_moderador_update" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_moderator()
    AND (
      -- Se for moderador, não pode alterar admins
      (get_user_role() = 'moderador' AND (
        -- Não pode alterar perfis de admin
        (SELECT role FROM profiles WHERE id = profiles.id) != 'admin'
        AND 
        -- Não pode promover alguém para admin
        role != 'admin'
      ))
      OR
      -- Se for admin, pode fazer tudo
      get_user_role() = 'admin'
    )
  )
  WITH CHECK (
    is_admin_or_moderador()
    AND (
      (get_user_role() = 'moderador' AND role != 'admin')
      OR
      get_user_role() = 'admin'
    )
  );

-- Só admin pode deletar perfis
CREATE POLICY "profiles_admin_only_delete" ON profiles
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    OR
    -- Usuário pode deletar seu próprio perfil
    id = auth.uid()
  );

-- ============================================
-- 4. POLICIES PARA CLIENTES (ACESSO TOTAL)
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clientes veem seus próprios dados
CREATE POLICY "clients_own" ON clients
  FOR ALL
  USING (profile_id = auth.uid());

-- Admin e Moderador têm acesso TOTAL
CREATE POLICY "clients_admin_moderador" ON clients
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- ============================================
-- 5. POLICIES PARA GOALS (ACESSO TOTAL)
-- ============================================

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

CREATE POLICY "goals_admin_moderador" ON goals
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- ============================================
-- 6. POLICIES PARA OUTRAS TABELAS (ACESSO TOTAL ADMIN/MODERADOR)
-- ============================================

-- Goal Progress
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_progress_own" ON goal_progress
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM goals g
      JOIN clients c ON c.id = g.client_id
      WHERE g.id = goal_progress.goal_id AND c.profile_id = auth.uid()
    )
  );
CREATE POLICY "goal_progress_admin_moderador" ON goal_progress
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Sales History
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_history_own" ON sales_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = sales_history.client_id AND clients.profile_id = auth.uid()
    )
  );
CREATE POLICY "sales_history_admin_moderador" ON sales_history
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Meta Cache
ALTER TABLE meta_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_cache_own" ON meta_cache
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = meta_cache.client_id AND clients.profile_id = auth.uid()
    )
  );
CREATE POLICY "meta_cache_admin_moderador" ON meta_cache
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- App Settings (configurações globais)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_public_read" ON app_settings
  FOR SELECT
  USING (true);
CREATE POLICY "app_settings_admin_moderador" ON app_settings
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- AI Agents
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agents_public_read" ON ai_agents
  FOR SELECT
  USING (active = true);
CREATE POLICY "ai_agents_admin_moderador" ON ai_agents
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_admin_moderador" ON activity_logs
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_own" ON bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = bookings.client_id AND clients.profile_id = auth.uid()
    )
  );
CREATE POLICY "bookings_admin_moderador" ON bookings
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Booking Blocked Slots
ALTER TABLE booking_blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_blocked_slots_public_read" ON booking_blocked_slots
  FOR SELECT
  USING (true);
CREATE POLICY "booking_blocked_slots_admin_moderador" ON booking_blocked_slots
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Booking Window Config
ALTER TABLE booking_window_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_window_config_public_read" ON booking_window_config
  FOR SELECT
  USING (true);
CREATE POLICY "booking_window_config_admin_moderador" ON booking_window_config
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- User Client Access
ALTER TABLE user_client_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_client_access_own" ON user_client_access
  FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "user_client_access_admin_moderador" ON user_client_access
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Pending Registrations
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pending_registrations_admin_moderador" ON pending_registrations
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- Gestores Nicho
ALTER TABLE gestores_nicho ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gestores_nicho_admin_moderador" ON gestores_nicho
  FOR ALL
  TO authenticated
  USING (is_admin_or_moderador());

-- ============================================
-- 5. CONFIRMAÇÃO
-- ============================================

SELECT '✅ Sistema de permissões recriado com sucesso!' as mensagem;
SELECT '✅ Moderador tem acesso a TUDO igual ao Admin' as mensagem2;
SELECT '✅ Exceto: Moderador não pode criar/alterar/remover outros admins' as mensagem3;
