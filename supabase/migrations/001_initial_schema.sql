-- 1. Perfis de usuário (extensão da auth.users do Supabase)
CREATE TABLE public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'gestor', 'client')),
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clientes (donos de delivery)
CREATE TABLE public.clients (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name       TEXT NOT NULL,
  meta_account_id     TEXT,
  meta_access_token   TEXT,
  meta_token_expires  TIMESTAMPTZ,
  active              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Metas mensais
CREATE TABLE public.goals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_units    INTEGER NOT NULL,
  target_revenue  NUMERIC(12,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month)
);

-- 4. Progresso semanal das metas
CREATE TABLE public.goal_progress (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id       UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  week_number   INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 5),
  units_sold    INTEGER DEFAULT 0,
  revenue       NUMERIC(12,2) DEFAULT 0,
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, week_number)
);

-- 5. Histórico de vendas (planilha manual)
CREATE TABLE public.sales_history (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  week_ref        TEXT NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  units_sold      INTEGER,
  revenue         NUMERIC(12,2),
  avg_ticket      NUMERIC(8,2),
  meta_spend      NUMERIC(12,2),
  meta_synced_at  TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, week_ref)
);

-- 6. Cache de dados da Meta Ads API
CREATE TABLE public.meta_cache (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  cache_key     TEXT NOT NULL,
  payload       JSONB NOT NULL,
  fetched_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  UNIQUE(client_id, cache_key)
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_cache ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own profile
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (id = auth.uid());

-- Profiles: gestores/admins see all profiles
CREATE POLICY "profiles_gestores" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Clients: own data
CREATE POLICY "clients_own_data" ON public.clients
  FOR ALL USING (profile_id = auth.uid());

-- Clients: gestores see all
CREATE POLICY "gestores_all_clients" ON public.clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Goals: via client ownership
CREATE POLICY "goals_own" ON public.goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = goals.client_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "goals_gestores" ON public.goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Goal progress: via goal -> client ownership
CREATE POLICY "goal_progress_own" ON public.goal_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals g
      JOIN public.clients c ON c.id = g.client_id
      WHERE g.id = goal_progress.goal_id AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "goal_progress_gestores" ON public.goal_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Sales history: via client ownership
CREATE POLICY "sales_history_own" ON public.sales_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = sales_history.client_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "sales_history_gestores" ON public.sales_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Meta cache: via client ownership
CREATE POLICY "meta_cache_own" ON public.meta_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = meta_cache.client_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "meta_cache_gestores" ON public.meta_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );
