-- Adicionar campos para bloqueio de perfis
-- Usado quando cliente deixa de pagar

ALTER TABLE public.profiles 
ADD COLUMN blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN blocked_at TIMESTAMPTZ;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON public.profiles(blocked);

-- RLS policy para bloqueio
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins podem bloquear/desbloquear perfis
CREATE POLICY "Admins can manage blocked status" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
