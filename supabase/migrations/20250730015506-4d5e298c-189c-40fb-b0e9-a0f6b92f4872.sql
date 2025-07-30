-- Corrigir políticas RLS para notification_settings
-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can manage notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Company users can manage notification settings" ON public.notification_settings;

-- Criar políticas RLS corretas para notification_settings
CREATE POLICY "Users can view own company notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own company notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own company notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own company notification settings" 
ON public.notification_settings 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);