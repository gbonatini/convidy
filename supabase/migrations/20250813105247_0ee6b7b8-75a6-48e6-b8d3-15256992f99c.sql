-- Atualizar o trigger para usar a função simples do QR code
CREATE OR REPLACE FUNCTION public.generate_qr_code_on_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Gerar QR code apenas se não existir e se document não for nulo
  IF (NEW.qr_code IS NULL OR NEW.qr_code = '') AND NEW.document IS NOT NULL THEN
    NEW.qr_code = public.generate_qr_data_simple(NEW.event_id, NEW.document);
  END IF;
  RETURN NEW;
END;
$function$;