-- Remover trigger antigo
DROP TRIGGER IF EXISTS generate_qr_code_on_registration_trigger ON public.registrations;

-- Verificar se existe o trigger de código de barras
DROP TRIGGER IF EXISTS generate_barcode_on_registration_trigger ON public.registrations;

-- Recriar trigger correto para código de barras
CREATE TRIGGER generate_barcode_on_registration_trigger
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_barcode_on_registration();

-- Atualizar todos os registros existentes para usar códigos de barras simples
UPDATE public.registrations 
SET qr_code = public.generate_barcode_data_simple(event_id, document)
WHERE document IS NOT NULL;