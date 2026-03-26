-- Adiciona campo CNPJ na tabela de clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cnpj TEXT;
