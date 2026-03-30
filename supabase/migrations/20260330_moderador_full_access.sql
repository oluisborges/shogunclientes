-- Garantir que moderador tenha acesso TOTAL a todas as contas de clientes
-- Isso inclui todas as tabelas relacionadas a clientes

-- ============================================
-- TABELAS PRINCIPAIS (já existem em add_moderador_role.sql, mas garantimos que estão atualizadas)
-- ============================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "moderadores_all_access_clients" ON public.clients;
DROP POLICY IF EXISTS "moderadores_all_access_goals" ON public.goals;
DROP POLICY IF EXISTS "moderadores_all_access_goal_progress" ON public.goal_progress;
DROP POLICY IF EXISTS "moderadores_all_access_sales_history" ON public.sales_history;
DROP POLICY IF EXISTS "moderadores_all_access_meta_cache" ON public.meta_cache;

-- Recriar policies para moderadores com acesso TOTAL (igual admin)

-- Profiles: moderadores veem TODOS os perfis
CREATE POLICY "moderadores_all_access_profiles" ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Clients: moderadores acessam TODOS os clientes (view, insert, update, delete)
CREATE POLICY "moderadores_all_access_clients" ON public.clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Goals: moderadores acessam TODAS as metas
CREATE POLICY "moderadores_all_access_goals" ON public.goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Goal progress: moderadores acessam TODO o progresso
CREATE POLICY "moderadores_all_access_goal_progress" ON public.goal_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Sales history: moderadores acessam TODO o histórico
CREATE POLICY "moderadores_all_access_sales_history" ON public.sales_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Meta cache: moderadores acessam TODO o cache
CREATE POLICY "moderadores_all_access_meta_cache" ON public.meta_cache
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- ============================================
-- TABELAS ADICIONAIS (app_settings, ai_agents, etc.)
-- ============================================

-- App settings: moderadores podem ver (mas não alterar, igual gestor)
DROP POLICY IF EXISTS "moderadores_view_app_settings" ON public.app_settings;
CREATE POLICY "moderadores_view_app_settings" ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- AI agents: moderadores podem ver ativos (igual todos os usuários autenticados)
-- Já existe policy "users_read_active_agents" que permite isso

-- ============================================
-- TABELAS DE AGENDAMENTO (booking/agendamento)
-- ============================================

-- Agendamentos: moderadores acessam TODOS
DROP POLICY IF EXISTS "moderadores_all_access_agendamentos" ON public.agendamentos;
CREATE POLICY "moderadores_all_access_agendamentos" ON public.agendamentos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Booking blocked dates: moderadores acessam TODOS
DROP POLICY IF EXISTS "moderadores_all_access_booking_blocked_dates" ON public.booking_blocked_dates;
CREATE POLICY "moderadores_all_access_booking_blocked_dates" ON public.booking_blocked_dates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Booking slots: moderadores acessam TODOS
DROP POLICY IF EXISTS "moderadores_all_access_booking_slots" ON public.booking_slots;
CREATE POLICY "moderadores_all_access_booking_slots" ON public.booking_slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- ============================================
-- TABELAS DE LOG E MONITORAMENTO
-- ============================================

-- Activity logs: moderadores veem TODOS os logs
DROP POLICY IF EXISTS "moderadores_all_access_activity_logs" ON public.activity_logs;
CREATE POLICY "moderadores_all_access_activity_logs" ON public.activity_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Activity details: moderadores veem TODOS
DROP POLICY IF EXISTS "moderadores_all_access_activity_details" ON public.activity_details;
CREATE POLICY "moderadores_all_access_activity_details" ON public.activity_details
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Login attempts: moderadores veem TODOS
DROP POLICY IF EXISTS "moderadores_all_access_login_attempts" ON public.login_attempts;
CREATE POLICY "moderadores_all_access_login_attempts" ON public.login_attempts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- ============================================
-- TABELAS DE GESTORES E NICHO
-- ============================================

-- Gestores nicho: moderadores acessam TODOS
DROP POLICY IF EXISTS "moderadores_all_access_gestores_nicho" ON public.gestores_nicho;
CREATE POLICY "moderadores_all_access_gestores_nicho" ON public.gestores_nicho
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Pending registrations: moderadores acessam TODOS
DROP POLICY IF EXISTS "moderadores_all_access_pending_registrations" ON public.pending_registrations;
CREATE POLICY "moderadores_all_access_pending_registrations" ON public.pending_registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Agent conversations: moderadores veem TODAS as conversas
DROP POLICY IF EXISTS "moderadores_all_access_agent_conversations" ON public.agent_conversations;
CREATE POLICY "moderadores_all_access_agent_conversations" ON public.agent_conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- ============================================
-- RESUMO DAS PERMISSÕES DO MODERADOR
-- ============================================
-- Moderador tem acesso TOTAL (CRUD) a:
-- - profiles (todos os perfis)
-- - clients (todos os clientes)
-- - goals (todas as metas)
-- - goal_progress (todo o progresso)
-- - sales_history (todo o histórico)
-- - meta_cache (todo o cache)
-- - agendamentos (todos os agendamentos)
-- - booking_blocked_dates (todas as datas bloqueadas)
-- - booking_slots (todos os slots)
-- - activity_logs (todos os logs)
-- - activity_details (todos os detalhes)
-- - login_attempts (todas as tentativas)
-- - gestores_nicho (todos os gestores)
-- - pending_registrations (todas as pendências)
-- - agent_conversations (todas as conversas)
-- - app_settings (visualização apenas)
-- - ai_agents (visualização de ativos)

COMMENT ON TABLE public.profiles IS 'Perfis de usuário. Moderadores têm acesso total igual a admins';
