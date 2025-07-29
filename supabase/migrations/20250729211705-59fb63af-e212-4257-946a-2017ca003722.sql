-- Criar profile/empresa para usuários autenticados
-- Substituir o sistema de auth customizado pelo Supabase Auth

-- 1. Criar tabela de profiles ligada ao Supabase Auth
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name character varying NOT NULL,
  email character varying NOT NULL,
  role character varying DEFAULT 'admin'::character varying,
  company_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins podem ver todos os perfis" 
ON public.profiles 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins
  )
));

-- 4. Atualizar foreign keys das empresas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.system_plans(id);

-- 5. Criar função para automaticamente criar profile quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- 6. Trigger para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Inserir alguns planos básicos se não existirem
INSERT INTO public.system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
VALUES 
  (
    'Gratuito', 
    'free', 
    'Ideal para pequenos eventos e testes', 
    0, 
    3, 
    50, 
    150, 
    '["Até 3 eventos simultâneos", "50 participantes por evento", "QR Code básico", "Dashboard simples"]'::jsonb,
    true,
    1
  ),
  (
    'Empresarial', 
    'business', 
    'Para empresas que organizam eventos regulares', 
    49.90, 
    NULL, 
    500, 
    NULL, 
    '["Eventos ilimitados", "500 participantes por evento", "QR Code avançado", "Analytics detalhado", "Página personalizada", "Suporte prioritário"]'::jsonb,
    true,
    2
  ),
  (
    'Enterprise', 
    'enterprise', 
    'Solução completa para grandes corporações', 
    199.90, 
    NULL, 
    NULL, 
    NULL, 
    '["Eventos ilimitados", "Participantes ilimitados", "White-label", "API personalizada", "Integração avançada", "Suporte dedicado", "Relatórios customizados"]'::jsonb,
    true,
    3
  )
ON CONFLICT (slug) DO NOTHING;