-- Corrigir a última função que ainda não tem search_path definido
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE email = user_email
  );
$function$;