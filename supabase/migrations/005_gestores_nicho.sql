-- Tabela de gestores (admin-only, não visível aos clientes)
CREATE TABLE IF NOT EXISTS public.gestores (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Só admins/gestores podem ver/editar
ALTER TABLE public.gestores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gestores_admin_only" ON public.gestores
  FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

-- Insere gestores iniciais (emails a editar no painel)
INSERT INTO public.gestores (name, email) VALUES
  ('Amannda', 'amanndaviick@gmail.com'),
  ('Vitor',   'otvitor.gt@gmail.com'),
  ('Aléssia', 'alessiacostademelo@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Adiciona nicho e gestor aos clientes
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS niche     TEXT CHECK (niche IN ('marmitarias', 'delivery', 'generica')),
  ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.gestores(id);
