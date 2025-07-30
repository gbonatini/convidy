-- Recriar função de geração de QR code de forma mais simples
CREATE OR REPLACE FUNCTION generate_qr_data(event_uuid UUID, document_text TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Usar uma abordagem mais simples sem digest para agora
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

-- Atualizar registrations que não têm QR code
UPDATE public.registrations 
SET qr_code = generate_qr_data(event_id, document)
WHERE (qr_code IS NULL OR qr_code = '') AND document IS NOT NULL;