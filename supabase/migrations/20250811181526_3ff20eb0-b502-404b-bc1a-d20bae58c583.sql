-- Primeiro, verificar se existe o trigger para criar profiles
-- Criar o profile para o usuário atual que está com problema
INSERT INTO public.profiles (user_id, name, email, role, company_id)
SELECT 
  'efed2895-ba2b-4766-88a7-88d2b43f0ed7',
  'xxcxcx',
  'xcxc@sdssd.com',
  'admin',
  (SELECT id FROM companies ORDER BY created_at DESC LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = 'efed2895-ba2b-4766-88a7-88d2b43f0ed7'
);

-- Verificar se o trigger existe para criação automática de profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), 
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$$;

-- Criar o trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();