-- Corrigir search_path nas funções para melhorar segurança
CREATE OR REPLACE FUNCTION generate_qr_data(event_uuid UUID, document_text TEXT)
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
        'document_hash', encode(digest(document_text, 'sha256'), 'hex')
      )::text,
      'UTF8'
    ),
    'base64'
  );
END;
$$;

-- Corrigir a função do trigger também
CREATE OR REPLACE FUNCTION generate_qr_code_on_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = generate_qr_data(NEW.event_id, NEW.document);
  END IF;
  RETURN NEW;
END;
$$;