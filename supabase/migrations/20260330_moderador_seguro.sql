-- MODERADOR COM PODERES DE ADMIN COMPLETO (VERSÃO SEGURA)
-- Apenas para tabelas que existem

DO $$
DECLARE
  v_role TEXT;
BEGIN
  -- Verificar se tabela profiles existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    
    -- Remover policies antigas de profiles
    DROP POLICY IF EXISTS "profiles_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_gestores" ON profiles;
    DROP POLICY IF EXISTS "moderadores_select_profiles" ON profiles;
    DROP POLICY IF EXISTS "admins_moderadores_all_profiles" ON profiles;
    DROP POLICY IF EXISTS "moderadores_all_access_profiles" ON profiles;
    DROP POLICY IF EXISTS "admins_moderadores_manage_profiles" ON profiles;
    
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
      
  END IF;
  
  -- Verificar se tabela clients existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    
    DROP POLICY IF EXISTS "clients_own_data" ON clients;
    DROP POLICY IF EXISTS "gestores_all_clients" ON clients;
    DROP POLICY IF EXISTS "admins_moderadores_all_clients" ON clients;
    
    CREATE POLICY "clients_own_data" ON clients
      FOR ALL
      USING (profile_id = auth.uid());
    
    CREATE POLICY "admins_moderadores_all_clients" ON clients
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      );
      
  END IF;
  
  -- Verificar se tabela bookings existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela booking_blocked_dates existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_blocked_dates' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela booking_blocked_slots existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_blocked_slots' AND table_schema = 'public') THEN
    
    DROP POLICY IF EXISTS "blocked_slots_admin" ON booking_blocked_slots;
    DROP POLICY IF EXISTS "blocked_slots_read" ON booking_blocked_slots;
    DROP POLICY IF EXISTS "admins_moderadores_all_blocked_slots" ON booking_blocked_slots;
    
    CREATE POLICY "admins_moderadores_all_blocked_slots" ON booking_blocked_slots
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      );
      
  END IF;
  
  -- Verificar se tabela booking_window_config existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_window_config' AND table_schema = 'public') THEN
    
    DROP POLICY IF EXISTS "window_config_admin" ON booking_window_config;
    DROP POLICY IF EXISTS "window_config_read" ON booking_window_config;
    DROP POLICY IF EXISTS "admins_moderadores_window_config" ON booking_window_config;
    
    CREATE POLICY "admins_moderadores_window_config" ON booking_window_config
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      );
      
  END IF;
  
  -- Verificar se tabela app_settings existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings' AND table_schema = 'public') THEN
    
    DROP POLICY IF EXISTS "admins_manage_settings" ON app_settings;
    DROP POLICY IF EXISTS "moderadores_view_app_settings" ON app_settings;
    DROP POLICY IF EXISTS "admins_moderadores_manage_settings" ON app_settings;
    
    CREATE POLICY "admins_moderadores_manage_settings" ON app_settings
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      );
      
  END IF;
  
  -- Verificar se tabela ai_agents existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agents' AND table_schema = 'public') THEN
    
    DROP POLICY IF EXISTS "admins_manage_agents" ON ai_agents;
    DROP POLICY IF EXISTS "users_read_active_agents" ON ai_agents;
    DROP POLICY IF EXISTS "admins_moderadores_manage_agents" ON ai_agents;
    
    CREATE POLICY "admins_moderadores_manage_agents" ON ai_agents
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
      );
      
  END IF;
  
  -- Verificar se tabela goals existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela goal_progress existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_progress' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela sales_history existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_history' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela meta_cache existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meta_cache' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela activity_logs existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
    
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
      
  END IF;
  
  -- Verificar se tabela gestores_nicho existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gestores_nicho' AND table_schema = 'public') THEN
    
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
      
  END IF;

END $$;

SELECT '✅ Moderador agora tem poderes de admin completo!' as status;
