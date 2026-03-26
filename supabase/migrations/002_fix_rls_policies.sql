-- Fix: RLS policies that query public.profiles from within RLS-protected tables
-- cause recursion issues. Use auth.jwt() directly to check role instead.

-- Drop existing policies that reference public.profiles for role checks
DROP POLICY IF EXISTS "gestores_all_clients" ON public.clients;
DROP POLICY IF EXISTS "goals_gestores" ON public.goals;
DROP POLICY IF EXISTS "goal_progress_gestores" ON public.goal_progress;
DROP POLICY IF EXISTS "sales_history_gestores" ON public.sales_history;
DROP POLICY IF EXISTS "meta_cache_gestores" ON public.meta_cache;
DROP POLICY IF EXISTS "profiles_gestores" ON public.profiles;

-- Helper function to get user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Recreate policies using the helper function

CREATE POLICY "profiles_gestores" ON public.profiles
  FOR SELECT USING (
    public.get_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY "gestores_all_clients" ON public.clients
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY "goals_gestores" ON public.goals
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY "goal_progress_gestores" ON public.goal_progress
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY "sales_history_gestores" ON public.sales_history
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY "meta_cache_gestores" ON public.meta_cache
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'gestor')
  );
