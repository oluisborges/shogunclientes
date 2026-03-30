-- Atualizar policy RLS da tabela app_settings para incluir moderador

-- Remover policy antiga
DROP POLICY IF EXISTS "admins_manage_settings" ON app_settings;

-- Criar nova policy que inclui admin e moderador
CREATE POLICY "admins_and_moderators_manage_settings" ON app_settings
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'moderador'))
  WITH CHECK (get_my_role() IN ('admin', 'moderador'));
