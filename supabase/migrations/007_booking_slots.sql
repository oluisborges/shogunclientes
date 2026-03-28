-- Configuração da janela de agendamento por mês
CREATE TABLE IF NOT EXISTS public.booking_window_config (
  target_month TEXT NOT NULL PRIMARY KEY, -- "YYYY-MM"
  window_end   DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.booking_window_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "window_config_admin" ON public.booking_window_config
  FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "window_config_read" ON public.booking_window_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Slots bloqueados (dia inteiro ou horário específico)
-- blocked_time NULL = dia inteiro bloqueado; "09:00" = apenas aquele slot
CREATE TABLE IF NOT EXISTS public.booking_blocked_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL,
  blocked_time TEXT,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.booking_blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_slots_admin" ON public.booking_blocked_slots
  FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "blocked_slots_read" ON public.booking_blocked_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Índice único: apenas um registro de "dia inteiro" por data
CREATE UNIQUE INDEX IF NOT EXISTS booking_blocked_slots_fullday
  ON public.booking_blocked_slots(blocked_date) WHERE blocked_time IS NULL;
-- Índice único: apenas um registro por (data, horário)
CREATE UNIQUE INDEX IF NOT EXISTS booking_blocked_slots_timeslot
  ON public.booking_blocked_slots(blocked_date, blocked_time) WHERE blocked_time IS NOT NULL;

-- Migra dados existentes de booking_blocked_dates
INSERT INTO public.booking_blocked_slots (blocked_date, reason, created_at)
SELECT blocked_date, reason, created_at FROM public.booking_blocked_dates
ON CONFLICT DO NOTHING;
