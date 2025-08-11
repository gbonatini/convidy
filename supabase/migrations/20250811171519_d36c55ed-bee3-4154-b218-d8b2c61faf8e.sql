-- Criar tabela de transações de pagamento para histórico e polling
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.system_plans(id),
  transaction_id VARCHAR NOT NULL UNIQUE,
  payment_method VARCHAR NOT NULL CHECK (payment_method IN ('pix', 'card')),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'cancelled')),
  payment_provider_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Companies can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Companies can create their own payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Trigger para updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos para controle de pagamento nas companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS next_payment_due TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'active' CHECK (payment_status IN ('active', 'expired', 'suspended')),
ADD COLUMN IF NOT EXISTS max_monthly_guests INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS monthly_usage JSONB DEFAULT '{"guests": 0, "reset_date": null}'::jsonb;