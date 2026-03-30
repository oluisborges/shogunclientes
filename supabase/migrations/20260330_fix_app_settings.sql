-- CORREÇÃO: Policy para app_settings (tabela de configurações)

-- Remover policies antigas
DROP POLICY IF EXISTS "admins_manage_settings" ON app_settings;
DROP POLICY IF EXISTS "moderadores_view_app_settings" ON app_settings;
DROP POLICY IF EXISTS "admins_moderadores_manage_settings" ON app_settings;
DROP POLICY IF EXISTS "admins_moderadores_settings" ON app_settings;

-- Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings' AND table_schema = 'public') THEN
    
    -- Garantir que RLS está habilitado
    ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
    
    -- Criar policy para admin e moderador
    CREATE POLICY "admins_moderadores_settings" ON app_settings
      FOR ALL
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderador'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderador'))
      );
      
  END IF;
END $$;

SELECT '✅ Configurações liberadas para moderador!' as mensagem;
