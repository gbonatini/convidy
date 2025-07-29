-- Verificar e ajustar os tamanhos das colunas que podem estar causando o erro
-- O erro "value too long for type character varying(50)" indica limitação de tamanho

-- Aumentar o tamanho das colunas que podem estar limitadas
ALTER TABLE public.registrations 
ALTER COLUMN qr_code TYPE character varying(255);

-- Verificar se outras colunas precisam de ajuste também
ALTER TABLE public.registrations 
ALTER COLUMN phone TYPE character varying(20);

ALTER TABLE public.registrations 
ALTER COLUMN document TYPE character varying(20);