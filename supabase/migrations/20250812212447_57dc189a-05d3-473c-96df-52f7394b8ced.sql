
-- 1) Garantir TRIGGER de geração de QR ao inserir em registrations
DROP TRIGGER IF EXISTS trg_generate_qr_on_registration ON public.registrations;

CREATE TRIGGER trg_generate_qr_on_registration
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_qr_code_on_registration();

-- 2) Backfill dos QR codes existentes
UPDATE public.registrations
SET qr_code = public.generate_qr_data(event_id, document)
WHERE (qr_code IS NULL OR qr_code = '')
  AND document IS NOT NULL;

-- 3a) RPC para buscar registro por event_id + hash do documento (MD5)
CREATE OR REPLACE FUNCTION public.find_registration_by_hash(event_uuid uuid, doc_hash text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  name text,
  email text,
  phone text,
  status text,
  qr_code text,
  checked_in boolean,
  checkin_time timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT r.id, r.event_id, r.name, r.email, r.phone, r.status, r.qr_code, r.checked_in, r.checkin_time, r.created_at
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  JOIN public.profiles p ON p.company_id = e.company_id
  WHERE r.event_id = event_uuid
    AND md5(coalesce(r.document,'')) = doc_hash
    AND p.user_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT 1;
$$;

-- 3b) RPC para buscar registro por hash do documento (MD5) em qualquer evento da empresa do usuário
CREATE OR REPLACE FUNCTION public.find_registration_by_hash_company(doc_hash text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  name text,
  email text,
  phone text,
  status text,
  qr_code text,
  checked_in boolean,
  checkin_time timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT r.id, r.event_id, r.name, r.email, r.phone, r.status, r.qr_code, r.checked_in, r.checkin_time, r.created_at
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  JOIN public.profiles p ON p.company_id = e.company_id
  WHERE md5(coalesce(r.document,'')) = doc_hash
    AND p.user_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT 1;
$$;
