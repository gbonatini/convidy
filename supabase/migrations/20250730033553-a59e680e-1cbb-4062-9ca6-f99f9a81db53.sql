-- Habilitar extensão pgcrypto para função digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Corrigir o trigger - ele deve funcionar tanto para INSERT quanto UPDATE
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON public.registrations;

-- Recrear a função do trigger com melhor lógica
CREATE OR REPLACE FUNCTION generate_qr_code_on_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Gerar QR code apenas se não existir e se document não for nulo
  IF (NEW.qr_code IS NULL OR NEW.qr_code = '') AND NEW.document IS NOT NULL THEN
    NEW.qr_code = generate_qr_data(NEW.event_id, NEW.document);
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT OR UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_on_registration();

-- Atualizar registro que não tem QR code
UPDATE public.registrations 
SET qr_code = generate_qr_data(event_id, document)
WHERE (qr_code IS NULL OR qr_code = '') AND document IS NOT NULL;