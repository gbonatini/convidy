-- Adicionar política para permitir que usuários autenticados criem empresas
CREATE POLICY "Authenticated users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (true);