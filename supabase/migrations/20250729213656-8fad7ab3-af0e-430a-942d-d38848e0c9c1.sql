-- Criar perfil para o usuário gabrielbonatini@gmail.com
INSERT INTO public.profiles (user_id, name, email, role)
VALUES (
  '719ad8ca-b0a5-420d-a087-d76e80cfab7a',
  'Gabriel Bonatini',
  'gabrielbonatini@gmail.com',
  'admin'
) ON CONFLICT (user_id) DO NOTHING;