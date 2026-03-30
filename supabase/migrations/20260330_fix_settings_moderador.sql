-- CORREÇÃO: Moderador pode ver configurações

-- Remover policies antigas de app_settings
DROP POLICY IF EXISTS "admins_manage_settings" ON app_settings;
DROP POLICY IF EXISTS "moderadores_view_app_settings" ON app_settings;
DROP POLICY IF EXISTS "admins_moderadores_manage_settings" ON app_settings;

-- Criar policy para admin e moderador
CREATE POLICY "admins_moderadores_settings" ON app_settings
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'moderador')
  );

SELECT '✅ Configurações liberadas para moderador!' as mensagem;
