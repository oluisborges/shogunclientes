-- Adiciona colunas de créditos de agendamento aos clientes
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS booking_credits INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS booking_credits_cycle TEXT; -- formato: "2026-04" (mês alvo)

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  google_event_id TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Clientes veem apenas seus próprios agendamentos (clients usa profile_id, não user_id)
CREATE POLICY "bookings_client_own" ON public.bookings
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE profile_id = auth.uid()
    )
  );

-- Admins e gestores veem todos
CREATE POLICY "bookings_admin_gestor" ON public.bookings
  FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
