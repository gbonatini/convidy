-- Adicionar campos necessários para QR Code e check-in na tabela registrations
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE;

-- Criar função para gerar QR code data
CREATE OR REPLACE FUNCTION generate_qr_data(event_uuid UUID, document_text TEXT)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para gerar QR code automaticamente quando uma registration é criada
CREATE OR REPLACE FUNCTION generate_qr_code_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = generate_qr_data(NEW.event_id, NEW.document);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON public.registrations;
CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT OR UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_on_registration();

-- Atualizar registrations existentes com QR codes
UPDATE public.registrations 
SET qr_code = generate_qr_data(event_id, document)
WHERE qr_code IS NULL AND document IS NOT NULL;