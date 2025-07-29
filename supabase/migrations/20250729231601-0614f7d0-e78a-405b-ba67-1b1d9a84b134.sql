-- Verificar e corrigir as políticas RLS para registrations
-- A política de inserção pública não está funcionando corretamente

-- Remover a política atual de inserção pública se existir
DROP POLICY IF EXISTS "Public can create registrations" ON public.registrations;

-- Criar nova política que permite inserção pública para eventos ativos
CREATE POLICY "Public can create registrations" 
ON public.registrations 
FOR INSERT 
WITH CHECK (
  -- Permitir inserção se o evento existe e está ativo
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = registrations.event_id 
    AND events.status = 'active'
  )
);