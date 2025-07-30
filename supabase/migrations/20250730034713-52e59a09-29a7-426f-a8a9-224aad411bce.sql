-- Remover constraint única do qr_code que está causando problemas
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_qr_code_key;