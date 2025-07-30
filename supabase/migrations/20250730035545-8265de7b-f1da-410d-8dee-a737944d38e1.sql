-- Remover função existente e recriar com tipos corretos
DROP FUNCTION IF EXISTS public.generate_qr_data(uuid, text);
DROP FUNCTION IF EXISTS public.generate_qr_data(uuid, character varying);

-- Criar função com ambos os tipos para compatibilidade
CREATE OR REPLACE FUNCTION public.generate_qr_data(event_uuid UUID, document_text VARCHAR)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  RETURN encode(
    convert_to(
      json_build_object(
        'event_id', event_uuid,
        'document_hash', md5(document_text)
      )::text,
      'UTF8'
    ),
    'base64'
  );
END;
$$;

-- Criar sobrecarga para TEXT também
CREATE OR REPLACE FUNCTION public.generate_qr_data(event_uuid UUID, document_text TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  RETURN encode(
    convert_to(
      json_build_object(
        'event_id', event_uuid,
        'document_hash', md5(document_text)
      )::text,
      'UTF8'
    ),
    'base64'
  );
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON public.registrations;

CREATE OR REPLACE FUNCTION generate_qr_code_on_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Gerar QR code apenas se não existir e se document não for nulo
  IF (NEW.qr_code IS NULL OR NEW.qr_code = '') AND NEW.document IS NOT NULL THEN
    NEW.qr_code = public.generate_qr_data(NEW.event_id, NEW.document);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT OR UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_on_registration();