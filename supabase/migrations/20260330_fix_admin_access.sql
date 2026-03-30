-- Fix admin access for current user
-- This migration ensures the user has proper admin role

-- Check current user profiles and their roles (email is in auth.users, not profiles)
SELECT p.id, u.email, p.full_name, p.role, p.created_at 
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;

-- If your email is not set to admin, update it here
-- Replace 'your-email@example.com' with your actual email

-- Uncomment and update with your email if needed:
-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- For now, ensure all known admin users have correct role
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('xluisborges@gmail.com', 'leandrotogawa@gmail.com')
);

-- Show result
SELECT p.id, u.email, p.full_name, p.role, p.created_at 
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'moderador')
ORDER BY p.created_at DESC;
