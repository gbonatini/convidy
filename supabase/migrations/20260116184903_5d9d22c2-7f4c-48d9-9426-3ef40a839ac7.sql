-- =============================================
-- FUNÇÕES SQL PARA O SISTEMA
-- =============================================

-- Função para gerar dados do QR code
CREATE OR REPLACE FUNCTION public.generate_qr_data(p_registration_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  v_hash := encode(sha256(p_registration_id::text::bytea), 'hex');
  RETURN substring(v_hash from 1 for 16);
END;
$$;

-- Função simplificada para gerar QR data
CREATE OR REPLACE FUNCTION public.generate_qr_data_simple(p_registration_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(p_registration_id::text::bytea), 'hex');
$$;

-- Função para gerar código de barras
CREATE OR REPLACE FUNCTION public.generate_barcode_data_simple(p_registration_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numeric TEXT;
BEGIN
  v_numeric := regexp_replace(p_registration_id::text, '[^0-9]', '', 'g');
  RETURN substring(v_numeric from 1 for 12);
END;
$$;

-- Função para buscar registro por hash
CREATE OR REPLACE FUNCTION public.find_registration_by_hash(p_hash TEXT)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  status public.registration_status,
  qr_code TEXT,
  barcode TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.event_id, r.name, r.email, r.phone, r.cpf, 
         r.status, r.qr_code, r.barcode, r.checked_in_at
  FROM public.registrations r
  WHERE r.qr_code = p_hash OR r.barcode = p_hash
  LIMIT 1;
$$;

-- Função para buscar registro por código de barras
CREATE OR REPLACE FUNCTION public.find_registration_by_barcode(p_barcode TEXT)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  name TEXT,
  email TEXT,
  status public.registration_status,
  checked_in_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.event_id, r.name, r.email, r.status, r.checked_in_at
  FROM public.registrations r
  WHERE r.barcode = p_barcode
  LIMIT 1;
$$;

-- Função para realizar check-in
CREATE OR REPLACE FUNCTION public.perform_checkin(p_registration_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  registration_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration RECORD;
BEGIN
  SELECT * INTO v_registration
  FROM public.registrations
  WHERE id = p_registration_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Registro não encontrado'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  IF v_registration.status = 'checked_in' THEN
    RETURN QUERY SELECT false, 'Check-in já realizado'::TEXT, v_registration.name;
    RETURN;
  END IF;
  
  UPDATE public.registrations
  SET status = 'checked_in', checked_in_at = now()
  WHERE id = p_registration_id;
  
  RETURN QUERY SELECT true, 'Check-in realizado com sucesso'::TEXT, v_registration.name;
END;
$$;

-- Função para check-in por CPF
CREATE OR REPLACE FUNCTION public.checkin_by_cpf(p_event_id UUID, p_cpf TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  registration_id UUID,
  registration_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration RECORD;
BEGIN
  SELECT * INTO v_registration
  FROM public.registrations
  WHERE event_id = p_event_id AND cpf = p_cpf;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'CPF não encontrado neste evento'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  IF v_registration.status = 'checked_in' THEN
    RETURN QUERY SELECT false, 'Check-in já realizado'::TEXT, v_registration.id, v_registration.name;
    RETURN;
  END IF;
  
  UPDATE public.registrations
  SET status = 'checked_in', checked_in_at = now()
  WHERE id = v_registration.id;
  
  RETURN QUERY SELECT true, 'Check-in realizado com sucesso'::TEXT, v_registration.id, v_registration.name;
END;
$$;

-- Função para obter dados públicos da empresa
CREATE OR REPLACE FUNCTION public.get_company_public(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url
  FROM public.companies c
  WHERE c.slug = p_slug;
$$;

-- Função para obter dados públicos do convite
CREATE OR REPLACE FUNCTION public.get_invite_public(p_invite_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  event_title TEXT,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  company_name TEXT,
  company_logo TEXT,
  status public.invite_status
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.name, e.title, e.date, e.time, e.location, c.name, c.logo_url, i.status
  FROM public.invites i
  LEFT JOIN public.events e ON e.id = i.event_id
  LEFT JOIN public.companies c ON c.id = i.company_id
  WHERE i.id = p_invite_id;
$$;

-- Função para obter dados públicos do registro
CREATE OR REPLACE FUNCTION public.get_registration_public(p_registration_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  event_title TEXT,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  company_name TEXT,
  status public.registration_status,
  qr_code TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.name, e.title, e.date, e.time, e.location, c.name, r.status, r.qr_code
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  JOIN public.companies c ON c.id = e.company_id
  WHERE r.id = p_registration_id;
$$;

-- Função para inativar eventos expirados
CREATE OR REPLACE FUNCTION public.auto_inactivate_expired_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.events
  SET status = 'inactive'
  WHERE status = 'active' AND date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Função para atualizar estatísticas de comportamento
CREATE OR REPLACE FUNCTION public.update_user_behavior_stats(
  p_event_id UUID,
  p_registration_id UUID,
  p_metric_type TEXT,
  p_metric_value NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_behavior_stats (event_id, registration_id, metric_type, metric_value)
  VALUES (p_event_id, p_registration_id, p_metric_type, p_metric_value);
END;
$$;

-- Função para log de mudanças em empresas
CREATE OR REPLACE FUNCTION public.log_company_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_logs (action, entity_type, entity_id, old_data, new_data)
  VALUES (TG_OP, 'company', COALESCE(NEW.id, OLD.id), to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

-- Trigger para log de mudanças em empresas
CREATE TRIGGER log_company_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.log_company_changes();

-- Política para eventos públicos (permitir visualização de eventos ativos)
CREATE POLICY "Anyone can view active events for registration" ON public.events
  FOR SELECT USING (status = 'active');

-- Atualizar registrations para gerar QR e barcode automaticamente
CREATE OR REPLACE FUNCTION public.generate_registration_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := public.generate_qr_data_simple(NEW.id);
  END IF;
  IF NEW.barcode IS NULL THEN
    NEW.barcode := public.generate_barcode_data_simple(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_registration_codes_trigger
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.generate_registration_codes();