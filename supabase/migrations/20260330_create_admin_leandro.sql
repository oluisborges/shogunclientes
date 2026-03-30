-- Criar usuário admin: leandrotogawa@gmail.com

-- Primeiro, vamos criar o usuário no auth.users
-- Nota: A senha será 'mudar@1234' (hash será gerado pelo Supabase)

-- Inserir usuário na tabela auth.users
-- O Supabase vai gerar o hash da senha automaticamente quando você usar o dashboard
-- ou você pode usar a função do Supabase para criar o usuário

-- Como não podemos criar usuários diretamente via SQL (precisa do Supabase Auth),
-- vamos preparar o perfil para quando o usuário for criado

-- Criar uma função temporária para criar o usuário admin
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Tentar encontrar o usuário se já existir
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'leandrotogawa@gmail.com';

  -- Se o usuário não existir, vamos criar o perfil com um ID fixo
  -- que será associado quando o usuário for criado
  IF new_user_id IS NULL THEN
    -- Gerar um UUID fixo para este usuário
    new_user_id := gen_random_uuid();
    
    -- Inserir o perfil antecipadamente
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      new_user_id,
      'leandrotogawa@gmail.com',
      'Leandro Togawa',
      'admin',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        email = 'leandrotogawa@gmail.com',
        full_name = 'Leandro Togawa',
        updated_at = now();

    RAISE NOTICE 'Perfil criado para leandrotogawa@gmail.com com ID: %', new_user_id;
    RAISE NOTICE 'IMPORTANTE: Você precisa criar o usuário no Supabase Dashboard com este email';
  ELSE
    -- Se o usuário já existe, apenas atualizar o perfil para admin
    UPDATE public.profiles
    SET role = 'admin',
        full_name = 'Leandro Togawa',
        updated_at = now()
    WHERE id = new_user_id;

    RAISE NOTICE 'Usuário já existe. Perfil atualizado para admin.';
  END IF;
END $$;
