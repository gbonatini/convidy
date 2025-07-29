-- Alterar apenas a coluna qr_code que é onde provavelmente está o problema
ALTER TABLE public.registrations 
ALTER COLUMN qr_code TYPE text;