-- Criar profiles para usuários que não tem
INSERT INTO public.profiles (user_id, name, email, role, company_id)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  au.email,
  'admin',
  c.id
FROM auth.users au
CROSS JOIN LATERAL (
  SELECT id FROM companies 
  WHERE email = au.email 
  ORDER BY created_at DESC 
  LIMIT 1
) c
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = au.id
)
AND EXISTS (
  SELECT 1 FROM companies WHERE email = au.email
);