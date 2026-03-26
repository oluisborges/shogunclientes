-- Cria função SECURITY DEFINER para ler o role sem passar por RLS
-- (evita recursão infinita nas policies)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Recria todas as policies que consultavam profiles dentro de si mesmas

-- profiles
DROP POLICY IF EXISTS "profiles_gestores" ON public.profiles;
CREATE POLICY "profiles_gestores" ON public.profiles
  FOR SELECT USING (public.get_my_role() IN ('admin', 'gestor'));

-- clients
DROP POLICY IF EXISTS "gestores_all_clients" ON public.clients;
CREATE POLICY "gestores_all_clients" ON public.clients
  FOR ALL USING (public.get_my_role() IN ('admin', 'gestor'));

-- goals
DROP POLICY IF EXISTS "goals_gestores" ON public.goals;
CREATE POLICY "goals_gestores" ON public.goals
  FOR ALL USING (public.get_my_role() IN ('admin', 'gestor'));

-- goal_progress
DROP POLICY IF EXISTS "goal_progress_gestores" ON public.goal_progress;
CREATE POLICY "goal_progress_gestores" ON public.goal_progress
  FOR ALL USING (public.get_my_role() IN ('admin', 'gestor'));

-- sales_history
DROP POLICY IF EXISTS "sales_history_gestores" ON public.sales_history;
CREATE POLICY "sales_history_gestores" ON public.sales_history
  FOR ALL USING (public.get_my_role() IN ('admin', 'gestor'));

-- meta_cache
DROP POLICY IF EXISTS "meta_cache_gestores" ON public.meta_cache;
CREATE POLICY "meta_cache_gestores" ON public.meta_cache
  FOR ALL USING (public.get_my_role() IN ('admin', 'gestor'));
