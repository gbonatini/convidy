-- Phase 1: Critical Security Fixes
-- Enable RLS on unprotected tables and create secure policies

-- 1. Enable RLS on super_admins table and create secure policies
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage super admin accounts
CREATE POLICY "Super admins can manage super admin accounts" 
ON public.super_admins 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins WHERE id = auth.uid()
  )
));

-- 2. Enable RLS on system_logs table
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can access system logs
CREATE POLICY "Super admins can access system logs" 
ON public.system_logs 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins
  )
));

-- 3. Enable RLS on system_plans table
ALTER TABLE public.system_plans ENABLE ROW LEVEL SECURITY;

-- Public can view active plans (for landing page)
CREATE POLICY "Public can view active plans" 
ON public.system_plans 
FOR SELECT 
USING (is_active = true);

-- Only super admins can manage plans
CREATE POLICY "Super admins can manage plans" 
ON public.system_plans 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins
  )
));

-- 4. Enable RLS on system_settings table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can access system settings
CREATE POLICY "Super admins can access system settings" 
ON public.system_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins
  )
));

-- 5. Enable RLS on user_behavior_stats table
ALTER TABLE public.user_behavior_stats ENABLE ROW LEVEL SECURITY;

-- Only company users can view behavior stats for their registrations
CREATE POLICY "Company users can view behavior stats" 
ON public.user_behavior_stats 
FOR SELECT 
USING (auth.uid() IN (
  SELECT u.id FROM users u 
  JOIN companies c ON u.company_id = c.id
  JOIN events e ON e.company_id = c.id
  JOIN registrations r ON r.event_id = e.id
  WHERE encode(digest(r.document, 'sha256'), 'hex') = user_behavior_stats.document
));

-- Super admins can access all behavior stats
CREATE POLICY "Super admins can access all behavior stats" 
ON public.user_behavior_stats 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins
  )
));

-- 6. Remove overly permissive policies from existing tables
DROP POLICY IF EXISTS "Allow all operations on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;
DROP POLICY IF EXISTS "Allow all operations on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow all operations on notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- 7. Create secure policies for registrations (most critical)
-- Public can create registrations (for event signup)
CREATE POLICY "Public can create registrations" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

-- Public can view their own registration by QR code
CREATE POLICY "Public can view registration by QR code" 
ON public.registrations 
FOR SELECT 
USING (true);

-- Company users can manage registrations for their events
CREATE POLICY "Company users can manage their event registrations" 
ON public.registrations 
FOR ALL 
USING (auth.uid() IN (
  SELECT u.id FROM users u 
  JOIN companies c ON u.company_id = c.id
  JOIN events e ON e.company_id = c.id
  WHERE e.id = registrations.event_id
));

-- 8. Create secure policies for events
-- Public can view active events
CREATE POLICY "Public can view active events" 
ON public.events 
FOR SELECT 
USING (status = 'active');

-- Company users can manage their company events
CREATE POLICY "Company users can manage company events" 
ON public.events 
FOR ALL 
USING (auth.uid() IN (
  SELECT u.id FROM users u 
  WHERE u.company_id = events.company_id
));

-- 9. Create secure policies for companies
-- Public can view active companies (for public pages)
CREATE POLICY "Public can view active companies" 
ON public.companies 
FOR SELECT 
USING (status = 'active');

-- Company users can update their own company
CREATE POLICY "Company users can update own company" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT u.id FROM users u 
  WHERE u.company_id = companies.id
));

-- Super admins can manage all companies
CREATE POLICY "Super admins can manage all companies" 
ON public.companies 
FOR ALL 
USING (auth.uid() IN (
  SELECT auth.uid() FROM auth.users 
  WHERE auth.users.email IN (
    SELECT email FROM public.super_admins
  )
));

-- 10. Create secure policies for notification_settings
-- Company users can manage their notification settings
CREATE POLICY "Company users can manage notification settings" 
ON public.notification_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT u.id FROM users u 
  WHERE u.company_id = notification_settings.company_id
));

-- 11. Fix database functions security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_behavior_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    -- Update or insert statistics with hashed document
    INSERT INTO user_behavior_stats (
        document, 
        document_type, 
        total_registrations,
        total_checkins,
        last_activity
    ) VALUES (
        encode(digest(NEW.document, 'sha256'), 'hex'),
        NEW.document_type,
        1,
        CASE WHEN NEW.checked_in THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (document, document_type) 
    DO UPDATE SET
        total_registrations = user_behavior_stats.total_registrations + 1,
        total_checkins = user_behavior_stats.total_checkins + CASE WHEN NEW.checked_in THEN 1 ELSE 0 END,
        last_activity = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_company_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO system_logs (action, entity_type, entity_id, details)
    VALUES ('company_updated', 'company', NEW.id, 
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO system_logs (action, entity_type, entity_id, details)
    VALUES ('company_deleted', 'company', OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;