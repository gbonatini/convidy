-- Criar índice único para impedir CPF duplicado no mesmo evento
CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_cpf_unique 
ON public.registrations (event_id, cpf) 
WHERE cpf IS NOT NULL;