-- Adicionar suporte para role "moderador"

-- Remover TODAS as constraints de role que possam existir
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN 
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
    AND rel.relname = 'profiles'
    AND con.contype = 'c'
    AND con.conname LIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

-- Atualizar qualquer role inválido para 'cliente'
UPDATE public.profiles 
SET role = 'cliente' 
WHERE role IS NULL OR role NOT IN ('admin', 'moderador', 'gestor', 'cliente');

-- Adicionar nova constraint com moderador
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'moderador', 'gestor', 'cliente'));

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "moderadores_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "moderadores_view_all_clients" ON public.clients;
DROP POLICY IF EXISTS "moderadores_update_clients" ON public.clients;
DROP POLICY IF EXISTS "moderadores_view_goals" ON public.goals;
DROP POLICY IF EXISTS "moderadores_view_goal_progress" ON public.goal_progress;
DROP POLICY IF EXISTS "moderadores_view_sales_history" ON public.sales_history;
DROP POLICY IF EXISTS "moderadores_view_meta_cache" ON public.meta_cache;

-- Criar policies para moderadores verem todos os clientes (igual admin)
CREATE POLICY "moderadores_view_all_profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Moderadores podem ver todos os clientes
CREATE POLICY "moderadores_view_all_clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Moderadores podem atualizar clientes (mas não criar/deletar)
CREATE POLICY "moderadores_update_clients" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Moderadores podem ver todas as metas
CREATE POLICY "moderadores_view_goals" ON public.goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Moderadores podem ver todo o progresso de metas
CREATE POLICY "moderadores_view_goal_progress" ON public.goal_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Moderadores podem ver histórico de vendas
CREATE POLICY "moderadores_view_sales_history" ON public.sales_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

-- Moderadores podem ver cache da Meta
CREATE POLICY "moderadores_view_meta_cache" ON public.meta_cache
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderador')
    )
  );

COMMENT ON COLUMN public.profiles.role IS 'Role do usuário: admin (acesso total), moderador (visualiza tudo mas não gerencia admins), gestor, cliente';
