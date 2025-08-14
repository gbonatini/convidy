-- Criar função simplificada para check-in por CPF
CREATE OR REPLACE FUNCTION public.checkin_by_cpf(
  cpf_input text,
  company_id_input uuid,
  event_id_input uuid DEFAULT NULL
)
RETURNS TABLE(
  registration_id uuid,
  participant_name text,
  event_title text,
  already_checked_in boolean,
  checkin_time_existing timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  clean_cpf text;
BEGIN
  -- Limpar CPF removendo caracteres especiais
  clean_cpf := regexp_replace(cpf_input, '[^0-9]', '', 'g');
  
  -- Buscar registro
  RETURN QUERY
  SELECT 
    r.id as registration_id,
    r.name as participant_name,
    e.title as event_title,
    r.checked_in as already_checked_in,
    r.checkin_time as checkin_time_existing
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.document = clean_cpf
    AND e.company_id = company_id_input
    AND e.status = 'active'
    AND (event_id_input IS NULL OR r.event_id = event_id_input)
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$;

-- Criar função para realizar check-in
CREATE OR REPLACE FUNCTION public.perform_checkin(
  registration_id_input uuid,
  company_id_input uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  success boolean := false;
BEGIN
  -- Realizar check-in apenas se o registro pertence à empresa
  UPDATE public.registrations r
  SET 
    checked_in = true,
    checkin_time = now()
  FROM public.events e
  WHERE r.id = registration_id_input
    AND e.id = r.event_id
    AND e.company_id = company_id_input
    AND r.checked_in = false;
    
  GET DIAGNOSTICS success = FOUND;
  RETURN success;
END;
$$;