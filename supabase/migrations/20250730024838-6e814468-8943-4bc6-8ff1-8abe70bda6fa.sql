-- Create invites table
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  event_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_invites_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_invites_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_invites_company_id ON public.invites(company_id);
CREATE INDEX idx_invites_event_id ON public.invites(event_id);
CREATE INDEX idx_invites_status ON public.invites(status);

-- Enable Row Level Security
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company users can manage their invites"
ON public.invites
FOR ALL
USING (
  auth.uid() IN (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.company_id = invites.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.company_id = invites.company_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON public.invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();