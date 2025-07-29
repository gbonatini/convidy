-- Remover políticas antigas que usam a tabela users
DROP POLICY IF EXISTS "Users can manage company events" ON public.events;
DROP POLICY IF EXISTS "Company users can manage company events" ON public.events;

-- Criar novas políticas usando a tabela profiles
CREATE POLICY "Profile users can manage company events"
ON public.events
FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles 
  WHERE company_id = events.company_id
))
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles 
  WHERE company_id = events.company_id
));