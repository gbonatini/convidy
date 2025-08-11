-- Corrigir problemas de segurança das funções existentes
-- 1. Corrigir search_path nas funções que não têm
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), 
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$function$;

-- 2. Corrigir search_path na função de auto-inativação
CREATE OR REPLACE FUNCTION public.auto_inactivate_expired_events()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Inactivate events that are 7 days past their date and still active
  UPDATE public.events 
  SET status = 'inactive', updated_at = NOW()
  WHERE status = 'active' 
    AND date < (CURRENT_DATE - INTERVAL '7 days');
    
  -- Log the changes made
  INSERT INTO public.system_logs (action, entity_type, details, created_at)
  SELECT 
    'auto_inactivate',
    'event',
    json_build_object(
      'inactivated_count', COUNT(*),
      'cutoff_date', (CURRENT_DATE - INTERVAL '7 days')::text
    ),
    NOW()
  FROM public.events 
  WHERE status = 'inactive' 
    AND updated_at::date = CURRENT_DATE
    AND date < (CURRENT_DATE - INTERVAL '7 days');
END;
$function$;