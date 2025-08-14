-- Atualizar função para gerar código de barras simples ao invés de QR code
CREATE OR REPLACE FUNCTION public.generate_barcode_data_simple(event_uuid uuid, document_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  clean_document text;
  barcode_value text;
BEGIN
  -- Limpar o documento removendo caracteres não numéricos
  clean_document := regexp_replace(document_text, '[^0-9]', '', 'g');
  
  -- Gerar código de barras simples usando CPF + Event ID (primeiros 8 chars)
  -- Formato: CPF + primeiros 8 chars do event_id (apenas números/letras)
  barcode_value := clean_document || substring(replace(event_uuid::text, '-', ''), 1, 8);
  
  RETURN barcode_value;
END;
$function$;

-- Atualizar trigger para gerar código de barras
CREATE OR REPLACE FUNCTION public.generate_barcode_on_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Gerar código de barras apenas se não existir e se document não for nulo
  IF (NEW.qr_code IS NULL OR NEW.qr_code = '') AND NEW.document IS NOT NULL THEN
    NEW.qr_code = public.generate_barcode_data_simple(NEW.event_id, NEW.document);
  END IF;
  RETURN NEW;
END;
$function$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS generate_qr_code_on_registration_trigger ON public.registrations;

-- Criar novo trigger para código de barras
CREATE TRIGGER generate_barcode_on_registration_trigger
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_barcode_on_registration();

-- Atualizar registros existentes para ter códigos de barras
UPDATE public.registrations 
SET qr_code = public.generate_barcode_data_simple(event_id, document)
WHERE document IS NOT NULL;

-- Atualizar função de busca para código de barras
CREATE OR REPLACE FUNCTION public.find_registration_by_barcode(event_uuid uuid, barcode_value text)
RETURNS TABLE(id uuid, event_id uuid, name text, email text, phone text, status text, qr_code text, checked_in boolean, checkin_time timestamp with time zone, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT r.id, r.event_id, r.name, r.email, r.phone, r.status, r.qr_code, r.checked_in, r.checkin_time, r.created_at
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  JOIN public.profiles p ON p.company_id = e.company_id
  WHERE r.event_id = event_uuid
    AND r.qr_code = barcode_value
    AND p.user_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT 1;
$function$;