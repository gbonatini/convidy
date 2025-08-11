-- Desativar todos os planos existentes
UPDATE system_plans SET is_active = false;

-- Deletar planos duplicados e desnecessários (mantendo apenas os IDs que vamos reutilizar)
DELETE FROM system_plans WHERE slug IN ('enterprise', 'business', 'profissional');

-- Atualizar o plano gratuito existente
UPDATE system_plans 
SET 
  name = 'Gratuito',
  slug = 'free',
  description = 'Plano gratuito para começar',
  price = 0.00,
  max_events = 1,
  max_registrations_per_event = 10,
  max_total_registrations = 10,
  features = '["1 evento ativo simultâneo", "Até 10 convidados por evento", "Check-in básico com QR Code", "Página pública simples", "Sem suporte"]'::jsonb,
  is_active = true,
  sort_order = 1
WHERE slug = 'free';

-- Atualizar o plano Pro existente
UPDATE system_plans 
SET 
  name = 'Pro',
  slug = 'pro',
  description = 'Para organizadores profissionais',
  price = 99.00,
  max_events = 5,
  max_registrations_per_event = NULL,
  max_total_registrations = 100,
  features = '["5 eventos ativos simultâneos", "Até 100 convidados por mês", "Analytics básicos (funil, projeções)", "Personalização da página pública", "Templates de mensagens WhatsApp", "Convites automáticos", "Suporte prioritário"]'::jsonb,
  is_active = true,
  sort_order = 2
WHERE slug = 'pro';

-- Atualizar o plano Empresarial existente  
UPDATE system_plans 
SET 
  name = 'Empresarial',
  slug = 'empresarial',
  description = 'Para empresas de grande porte',
  price = 299.00,
  max_events = NULL,
  max_registrations_per_event = NULL,
  max_total_registrations = NULL,
  features = '["Eventos ilimitados", "Convidados ilimitados", "🤖 Módulo IA/Análise Comportamental (EXCLUSIVO)", "Analytics avançados com insights", "API básica para integrações", "White-label (sem marca do sistema)", "Notificações automáticas avançadas", "Suporte via WhatsApp", "Relatórios personalizados"]'::jsonb,
  is_active = true,
  sort_order = 3
WHERE slug = 'empresarial';