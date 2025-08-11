-- Ajustar a função de auto-inativação para ser menos agressiva
CREATE OR REPLACE FUNCTION public.auto_inactivate_expired_events()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Inactivate events that are 7 days past their date and still active
  -- Mudou de 3 para 7 dias para ser menos agressivo
  UPDATE events 
  SET status = 'inactive', updated_at = NOW()
  WHERE status = 'active' 
    AND date < (CURRENT_DATE - INTERVAL '7 days');
    
  -- Log the changes made
  INSERT INTO system_logs (action, entity_type, details, created_at)
  SELECT 
    'auto_inactivate',
    'event',
    json_build_object(
      'inactivated_count', COUNT(*),
      'cutoff_date', (CURRENT_DATE - INTERVAL '7 days')::text
    ),
    NOW()
  FROM events 
  WHERE status = 'inactive' 
    AND updated_at::date = CURRENT_DATE
    AND date < (CURRENT_DATE - INTERVAL '7 days');
END;
$function$