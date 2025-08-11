-- Atualizar tabela system_plans com os novos planos
DELETE FROM public.system_plans;

INSERT INTO public.system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order) VALUES
('Gratuito', 'free', 'Ideal para testar a plataforma', 0, 1, 10, NULL, '["1 evento ativo simultâneo", "Até 10 convidados por evento", "Check-in básico com QR Code", "Página pública simples"]', true, 1),
('Pró', 'pro', 'Para empresas em crescimento', 99.00, 5, 100, 100, '["5 eventos ativos simultâneos", "Até 100 convidados por mês", "Analytics básicos (funil, projeções)", "Personalização da página pública", "Templates de mensagens WhatsApp", "Convites automáticos", "Suporte prioritário"]', true, 2),
('Empresarial', 'enterprise', 'Para grandes empresas', 299.00, NULL, NULL, NULL, '["Eventos ilimitados", "Convidados ilimitados", "🤖 Módulo IA/Análise Comportamental (EXCLUSIVO)", "Analytics avançados com insights", "API básica para integrações", "White-label (sem marca do sistema)", "Notificações automáticas avançadas", "Suporte via WhatsApp", "Relatórios personalizados"]', true, 3);

-- Adicionar campos de controle de pagamento na tabela companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_payment_due TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status CHARACTER VARYING DEFAULT 'active',
ADD COLUMN IF NOT EXISTS max_monthly_guests INTEGER DEFAULT 10;

-- Criar tabela payment_transactions para histórico
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  flows_transaction_id VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR NOT NULL, -- 'pix' ou 'credit_card'
  status VARCHAR NOT NULL DEFAULT 'waiting_payment', -- waiting_payment, pending, approved, refused, cancelled
  payment_data JSONB, -- dados completos da transação FlowsPay
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela monthly_usage para controle mensal
CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  month_year DATE NOT NULL, -- primeiro dia do mês (2024-01-01)
  total_guests_used INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, month_year)
);

-- Enable RLS nas novas tabelas
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payment_transactions
CREATE POLICY "Users can view their company payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (company_id IN (
  SELECT profiles.company_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert their company payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT profiles.company_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "System can update payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (true);

-- Políticas RLS para monthly_usage
CREATE POLICY "Users can view their company monthly usage" 
ON public.monthly_usage 
FOR SELECT 
USING (company_id IN (
  SELECT profiles.company_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can manage their company monthly usage" 
ON public.monthly_usage 
FOR ALL 
USING (company_id IN (
  SELECT profiles.company_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_usage_updated_at
BEFORE UPDATE ON public.monthly_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();