-- Adicionar constraint única correta: mesmo documento não pode se registrar múltiplas vezes no mesmo evento
ALTER TABLE public.registrations 
ADD CONSTRAINT registrations_event_document_unique 
UNIQUE (event_id, document);