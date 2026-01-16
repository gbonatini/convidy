-- =============================================
-- RLS POLICIES para companies
-- =============================================

-- Função auxiliar para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND company_id = _company_id
  )
$$;

CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (public.user_belongs_to_company(id));

CREATE POLICY "Users can update their own company" ON public.companies
  FOR UPDATE USING (public.user_belongs_to_company(id));

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- RLS POLICIES para events
-- =============================================
CREATE POLICY "Users can view events from their company" ON public.events
  FOR SELECT USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can create events for their company" ON public.events
  FOR INSERT WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can update events from their company" ON public.events
  FOR UPDATE USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can delete events from their company" ON public.events
  FOR DELETE USING (public.user_belongs_to_company(company_id));

-- =============================================
-- RLS POLICIES para registrations
-- =============================================
CREATE OR REPLACE FUNCTION public.user_owns_event(_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.profiles p ON p.company_id = e.company_id
    WHERE e.id = _event_id AND p.user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view registrations for their events" ON public.registrations
  FOR SELECT USING (public.user_owns_event(event_id));

CREATE POLICY "Anyone can create registrations" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update registrations for their events" ON public.registrations
  FOR UPDATE USING (public.user_owns_event(event_id));

CREATE POLICY "Users can delete registrations for their events" ON public.registrations
  FOR DELETE USING (public.user_owns_event(event_id));

-- =============================================
-- RLS POLICIES para invites
-- =============================================
CREATE POLICY "Users can view invites from their company" ON public.invites
  FOR SELECT USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can create invites for their company" ON public.invites
  FOR INSERT WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can update invites from their company" ON public.invites
  FOR UPDATE USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can delete invites from their company" ON public.invites
  FOR DELETE USING (public.user_belongs_to_company(company_id));

-- =============================================
-- RLS POLICIES para message_templates
-- =============================================
CREATE POLICY "Users can view templates from their company" ON public.message_templates
  FOR SELECT USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can create templates for their company" ON public.message_templates
  FOR INSERT WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can update templates from their company" ON public.message_templates
  FOR UPDATE USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can delete templates from their company" ON public.message_templates
  FOR DELETE USING (public.user_belongs_to_company(company_id));

-- =============================================
-- RLS POLICIES para notification_settings
-- =============================================
CREATE POLICY "Users can view settings from their company" ON public.notification_settings
  FOR SELECT USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can create settings for their company" ON public.notification_settings
  FOR INSERT WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can update settings from their company" ON public.notification_settings
  FOR UPDATE USING (public.user_belongs_to_company(company_id));

-- =============================================
-- RLS POLICIES para payment_transactions
-- =============================================
CREATE POLICY "Users can view transactions from their company" ON public.payment_transactions
  FOR SELECT USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can create transactions for their company" ON public.payment_transactions
  FOR INSERT WITH CHECK (public.user_belongs_to_company(company_id));

-- =============================================
-- RLS POLICIES para super_admins
-- =============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = auth.uid()
  )
$$;

CREATE POLICY "Super admins can view all super admins" ON public.super_admins
  FOR SELECT USING (public.is_super_admin());

-- =============================================
-- RLS POLICIES para system_logs
-- =============================================
CREATE POLICY "Super admins can view all logs" ON public.system_logs
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can create logs" ON public.system_logs
  FOR INSERT WITH CHECK (public.is_super_admin());

-- =============================================
-- RLS POLICIES para user_behavior_stats
-- =============================================
CREATE POLICY "Users can view stats for their events" ON public.user_behavior_stats
  FOR SELECT USING (public.user_owns_event(event_id));

CREATE POLICY "Anyone can create behavior stats" ON public.user_behavior_stats
  FOR INSERT WITH CHECK (true);

-- =============================================
-- RLS POLICIES para users (legacy)
-- =============================================
CREATE POLICY "Users can view users from their company" ON public.users
  FOR SELECT USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can create users for their company" ON public.users
  FOR INSERT WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can update users from their company" ON public.users
  FOR UPDATE USING (public.user_belongs_to_company(company_id));