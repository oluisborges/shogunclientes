-- Datas bloqueadas para agendamento (controladas pelo admin)
CREATE TABLE IF NOT EXISTS public.booking_blocked_dates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Apenas admins/gestores podem gerenciar
CREATE POLICY "blocked_dates_admin" ON public.booking_blocked_dates
  FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

-- Qualquer autenticado pode ler (para o sistema de slots)
CREATE POLICY "blocked_dates_read" ON public.booking_blocked_dates
  FOR SELECT USING (auth.uid() IS NOT NULL);
