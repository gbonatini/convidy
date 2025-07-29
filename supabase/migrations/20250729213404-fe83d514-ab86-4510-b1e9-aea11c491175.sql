-- Remove políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "Super admins can manage super admin accounts" ON public.super_admins;

-- Criar função security definer para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE email = user_email
  );
$$;

-- Recriar política usando a função security definer
CREATE POLICY "Super admins can manage super admin accounts" 
ON public.super_admins
FOR ALL 
TO authenticated
USING (
  public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  public.is_super_admin(auth.jwt() ->> 'email')
);

-- Corrigir outras políticas que podem ter o mesmo problema
-- Remover políticas problemáticas dos profiles
DROP POLICY IF EXISTS "Super admins podem ver todos os perfis" ON public.profiles;

-- Recriar política de profiles usando a função security definer
CREATE POLICY "Super admins podem ver todos os perfis" 
ON public.profiles
FOR ALL 
TO authenticated
USING (
  auth.uid() = user_id OR public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  auth.uid() = user_id OR public.is_super_admin(auth.jwt() ->> 'email')
);

-- Corrigir política de companies também
DROP POLICY IF EXISTS "Super admins can manage all companies" ON public.companies;

CREATE POLICY "Super admins can manage all companies" 
ON public.companies
FOR ALL 
TO authenticated
USING (
  public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  public.is_super_admin(auth.jwt() ->> 'email')
);

-- Corrigir policy de system_logs
DROP POLICY IF EXISTS "Super admins can access system logs" ON public.system_logs;

CREATE POLICY "Super admins can access system logs" 
ON public.system_logs
FOR ALL 
TO authenticated
USING (
  public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  public.is_super_admin(auth.jwt() ->> 'email')
);

-- Corrigir policy de system_plans
DROP POLICY IF EXISTS "Super admins can manage plans" ON public.system_plans;

CREATE POLICY "Super admins can manage plans" 
ON public.system_plans
FOR ALL 
TO authenticated
USING (
  public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  public.is_super_admin(auth.jwt() ->> 'email')
);

-- Corrigir policy de system_settings
DROP POLICY IF EXISTS "Super admins can access system settings" ON public.system_settings;

CREATE POLICY "Super admins can access system settings" 
ON public.system_settings
FOR ALL 
TO authenticated
USING (
  public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  public.is_super_admin(auth.jwt() ->> 'email')
);

-- Corrigir policy de user_behavior_stats
DROP POLICY IF EXISTS "Super admins can access all behavior stats" ON public.user_behavior_stats;

CREATE POLICY "Super admins can access all behavior stats" 
ON public.user_behavior_stats
FOR ALL 
TO authenticated
USING (
  public.is_super_admin(auth.jwt() ->> 'email')
)
WITH CHECK (
  public.is_super_admin(auth.jwt() ->> 'email')
);