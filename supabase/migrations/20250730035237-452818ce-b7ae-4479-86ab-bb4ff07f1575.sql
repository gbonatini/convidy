-- Recriar o trigger do zero pois não está funcionando
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON public.registrations;

-- Recriar a função com logs para debug
CREATE OR REPLACE FUNCTION generate_qr_code_on_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE 'Trigger executado para registration: %, qr_code atual: %, document: %', NEW.id, NEW.qr_code, NEW.document;
  
  -- Gerar QR code apenas se não existir e se document não for nulo
  IF (NEW.qr_code IS NULL OR NEW.qr_code = '') AND NEW.document IS NOT NULL THEN
    NEW.qr_code = generate_qr_data(NEW.event_id, NEW.document);
    RAISE NOTICE 'QR code gerado: %', substring(NEW.qr_code, 1, 20);
  ELSE
    RAISE NOTICE 'QR code não gerado. Condições: qr_code null/empty: %, document not null: %', 
                 (NEW.qr_code IS NULL OR NEW.qr_code = ''), (NEW.document IS NOT NULL);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT OR UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_on_registration();

-- Atualizar registrations existentes que não têm QR code
UPDATE public.registrations 
SET qr_code = generate_qr_data(event_id, document)
WHERE (qr_code IS NULL OR qr_code = '') AND document IS NOT NULL;