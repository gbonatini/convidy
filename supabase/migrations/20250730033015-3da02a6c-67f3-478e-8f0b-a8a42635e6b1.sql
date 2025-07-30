-- Tornar qr_code opcional temporariamente para permitir inserção
ALTER TABLE public.registrations 
ALTER COLUMN qr_code DROP NOT NULL;