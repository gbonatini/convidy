-- Fix RLS for registrations to use profiles instead of users and add QR trigger

-- Ensure RLS is enabled
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop outdated policies referencing the users table
DROP POLICY IF EXISTS "Company users can manage their event registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can manage event registrations" ON public.registrations;

-- Keep existing INSERT policy for public (already present). Add precise company policies using profiles

-- View
CREATE POLICY "Company users can view registrations"
ON public.registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.events e ON e.company_id = p.company_id
    WHERE e.id = registrations.event_id
      AND p.user_id = auth.uid()
  )
);

-- Update
CREATE POLICY "Company users can update registrations"
ON public.registrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.events e ON e.company_id = p.company_id
    WHERE e.id = registrations.event_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.events e ON e.company_id = p.company_id
    WHERE e.id = registrations.event_id
      AND p.user_id = auth.uid()
  )
);

-- Delete
CREATE POLICY "Company users can delete registrations"
ON public.registrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.events e ON e.company_id = p.company_id
    WHERE e.id = registrations.event_id
      AND p.user_id = auth.uid()
  )
);

-- Create QR code trigger so registrations automatically get a QR payload
DROP TRIGGER IF EXISTS trg_generate_qr_on_registration ON public.registrations;
CREATE TRIGGER trg_generate_qr_on_registration
BEFORE INSERT OR UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_qr_code_on_registration();