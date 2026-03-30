-- Corrigir roles dos usuários admin existentes

-- Atualizar xluisborges@gmail.com para admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'xluisborges@gmail.com';

-- Atualizar leandrotogawa@gmail.com para admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'leandrotogawa@gmail.com';

-- Verificar se há outros usuários sem role definido e definir como 'cliente'
UPDATE public.profiles 
SET role = 'cliente', updated_at = now()
WHERE role IS NULL;

-- Mostrar todos os perfis admin e moderador
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE role IN ('admin', 'moderador')
ORDER BY created_at DESC;
