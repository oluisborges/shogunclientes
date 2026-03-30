-- RECRIAÇÃO SEGURA: Moderador com acesso igual a Admin, exceto gerenciar admins
-- Verifica se tabelas existem antes de criar policies

DO $$
DECLARE
  v_count INT;
BEGIN
  -- ============================================
  -- 1. FUNÇÕES HELPER
  -- ============================================
  
  -- Criar funções se não existirem
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
  -- 2. PROFILES (sempre existe)
  -- ============================================
  
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  -- Limpar policies antigas
  DROP POLICY IF EXISTS "profiles_own_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_admin_moderador_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_admin_moderador_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_admin_moderador_update" ON profiles;
  DROP POLICY IF EXISTS "profiles_admin_only_delete" ON profiles;
  
  -- Criar novas policies
  CREATE POLICY "profiles_own_select" ON profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

  CREATE POLICY "profiles_admin_moderador_select" ON profiles
    FOR SELECT
    TO authenticated
    USING (is_admin_or_moderador());

  CREATE POLICY "profiles_admin_moderador_insert" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
      is_admin_or_moderador()
      AND (
        (get_user_role() = 'moderador' AND role != 'admin')
        OR get_user_role() = 'admin'
      )
    );

  CREATE POLICY "profiles_admin_moderador_update" ON profiles
    FOR UPDATE
    TO authenticated
    USING (
      is_admin_or_moderador()
      AND (
        (get_user_role() = 'moderador' AND (
          (SELECT role FROM profiles p2 WHERE p2.id = profiles.id) != 'admin'
          AND role != 'admin'
        ))
        OR get_user_role() = 'admin'
      )
    )
    WITH CHECK (
      is_admin_or_moderador()
      AND (
        (get_user_role() = 'moderador' AND role != 'admin')
        OR get_user_role() = 'admin'
      )
    );

  CREATE POLICY "profiles_admin_only_delete" ON profiles
    FOR DELETE
    TO authenticated
    USING (
      is_admin_only()
      OR id = auth.uid()
    );

  -- ============================================
  -- 3. CLIENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "clients_own" ON clients;
    DROP POLICY IF EXISTS "clients_admin_moderador" ON clients;
    
    CREATE POLICY "clients_own" ON clients
      FOR ALL
      USING (profile_id = auth.uid());
    
    CREATE POLICY "clients_admin_moderador" ON clients
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 4. GOALS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals' AND table_schema = 'public') THEN
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "goals_own" ON goals;
    DROP POLICY IF EXISTS "goals_admin_moderador" ON goals;
    
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
  END IF;

  -- ============================================
  -- 5. GOAL PROGRESS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_progress' AND table_schema = 'public') THEN
    ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "goal_progress_own" ON goal_progress;
    DROP POLICY IF EXISTS "goal_progress_admin_moderador" ON goal_progress;
    
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
  END IF;

  -- ============================================
  -- 6. SALES HISTORY
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_history' AND table_schema = 'public') THEN
    ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "sales_history_own" ON sales_history;
    DROP POLICY IF EXISTS "sales_history_admin_moderador" ON sales_history;
    
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
  END IF;

  -- ============================================
  -- 7. META CACHE
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meta_cache' AND table_schema = 'public') THEN
    ALTER TABLE meta_cache ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "meta_cache_own" ON meta_cache;
    DROP POLICY IF EXISTS "meta_cache_admin_moderador" ON meta_cache;
    
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
  END IF;

  -- ============================================
  -- 8. APP SETTINGS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings' AND table_schema = 'public') THEN
    ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "app_settings_public_read" ON app_settings;
    DROP POLICY IF EXISTS "app_settings_admin_moderador" ON app_settings;
    
    CREATE POLICY "app_settings_public_read" ON app_settings
      FOR SELECT
      USING (true);
    
    CREATE POLICY "app_settings_admin_moderador" ON app_settings
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 9. AI AGENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agents' AND table_schema = 'public') THEN
    ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "ai_agents_public_read" ON ai_agents;
    DROP POLICY IF EXISTS "ai_agents_admin_moderador" ON ai_agents;
    
    CREATE POLICY "ai_agents_public_read" ON ai_agents
      FOR SELECT
      USING (active = true);
    
    CREATE POLICY "ai_agents_admin_moderador" ON ai_agents
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 10. BOOKINGS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "bookings_own" ON bookings;
    DROP POLICY IF EXISTS "bookings_admin_moderador" ON bookings;
    
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
  END IF;

  -- ============================================
  -- 11. BOOKING BLOCKED SLOTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_blocked_slots' AND table_schema = 'public') THEN
    ALTER TABLE booking_blocked_slots ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "booking_blocked_slots_public_read" ON booking_blocked_slots;
    DROP POLICY IF EXISTS "booking_blocked_slots_admin_moderador" ON booking_blocked_slots;
    
    CREATE POLICY "booking_blocked_slots_public_read" ON booking_blocked_slots
      FOR SELECT
      USING (true);
    
    CREATE POLICY "booking_blocked_slots_admin_moderador" ON booking_blocked_slots
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 12. BOOKING WINDOW CONFIG
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_window_config' AND table_schema = 'public') THEN
    ALTER TABLE booking_window_config ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "booking_window_config_public_read" ON booking_window_config;
    DROP POLICY IF EXISTS "booking_window_config_admin_moderador" ON booking_window_config;
    
    CREATE POLICY "booking_window_config_public_read" ON booking_window_config
      FOR SELECT
      USING (true);
    
    CREATE POLICY "booking_window_config_admin_moderador" ON booking_window_config
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 13. USER CLIENT ACCESS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_client_access' AND table_schema = 'public') THEN
    ALTER TABLE user_client_access ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "user_client_access_own" ON user_client_access;
    DROP POLICY IF EXISTS "user_client_access_admin_moderador" ON user_client_access;
    
    CREATE POLICY "user_client_access_own" ON user_client_access
      FOR SELECT
      USING (user_id = auth.uid());
    
    CREATE POLICY "user_client_access_admin_moderador" ON user_client_access
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 14. PENDING REGISTRATIONS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_registrations' AND table_schema = 'public') THEN
    ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "pending_registrations_admin_moderador" ON pending_registrations;
    
    CREATE POLICY "pending_registrations_admin_moderador" ON pending_registrations
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 15. GESTORES NICHO
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gestores_nicho' AND table_schema = 'public') THEN
    ALTER TABLE gestores_nicho ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "gestores_nicho_admin_moderador" ON gestores_nicho;
    
    CREATE POLICY "gestores_nicho_admin_moderador" ON gestores_nicho
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- ============================================
  -- 16. TABELAS OPCIONAIS (se existirem)
  -- ============================================
  
  -- Activity Logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
    ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "activity_logs_admin_moderador" ON activity_logs;
    CREATE POLICY "activity_logs_admin_moderador" ON activity_logs
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- Activity Details
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_details' AND table_schema = 'public') THEN
    ALTER TABLE activity_details ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "activity_details_admin_moderador" ON activity_details;
    CREATE POLICY "activity_details_admin_moderador" ON activity_details
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- Login Attempts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_attempts' AND table_schema = 'public') THEN
    ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "login_attempts_admin_moderador" ON login_attempts;
    CREATE POLICY "login_attempts_admin_moderador" ON login_attempts
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- Agent Conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_conversations' AND table_schema = 'public') THEN
    ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "agent_conversations_admin_moderador" ON agent_conversations;
    CREATE POLICY "agent_conversations_admin_moderador" ON agent_conversations
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

  -- Booking Blocked Dates (tabela antiga)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_blocked_dates' AND table_schema = 'public') THEN
    ALTER TABLE booking_blocked_dates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "booking_blocked_dates_admin_moderador" ON booking_blocked_dates;
    CREATE POLICY "booking_blocked_dates_admin_moderador" ON booking_blocked_dates
      FOR ALL
      TO authenticated
      USING (is_admin_or_moderador());
  END IF;

END $$;

SELECT '✅ Sistema de permissões recriado com sucesso!' as mensagem;
SELECT '✅ Moderador tem acesso a TUDO igual ao Admin' as mensagem2;
SELECT '✅ Exceto: Moderador não pode criar/alterar/remover outros admins' as mensagem3;
