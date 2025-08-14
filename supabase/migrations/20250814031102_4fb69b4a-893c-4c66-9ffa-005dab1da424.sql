-- Criar função para buscar convite público (sem autenticação)
CREATE OR REPLACE FUNCTION public.get_invite_public(invite_uuid uuid)
RETURNS TABLE(
  id uuid,
  company_id uuid,
  event_id uuid,
  full_name text,
  cpf character varying,
  whatsapp character varying,
  email character varying,
  status character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  message_sent text,
  event_title text,
  event_date date,
  event_time time,
  event_location character varying,
  event_address text,
  event_capacity integer,
  event_status character varying
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT 
    i.id,
    i.company_id,
    i.event_id,
    i.full_name,
    i.cpf,
    i.whatsapp,
    i.email,
    i.status,
    i.created_at,
    i.updated_at,
    i.message_sent,
    e.title as event_title,
    e.date as event_date,
    e.time as event_time,
    e.location as event_location,
    e.address as event_address,
    e.capacity as event_capacity,
    e.status as event_status
  FROM public.invites i
  JOIN public.events e ON e.id = i.event_id
  WHERE i.id = invite_uuid
    AND e.status = 'active'
  LIMIT 1;
$$;