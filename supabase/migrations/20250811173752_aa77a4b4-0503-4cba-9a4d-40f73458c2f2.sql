-- Atualizar o plano Pro com as especificações corretas
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

-- Se não existir, inserir o plano Pro
INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
SELECT 'Pro', 'pro', 'Para organizadores profissionais', 99.00, 5, NULL, 100,
       '["5 eventos ativos simultâneos", "Até 100 convidados por mês", "Analytics básicos (funil, projeções)", "Personalização da página pública", "Templates de mensagens WhatsApp", "Convites automáticos", "Suporte prioritário"]'::jsonb,
       true, 2
WHERE NOT EXISTS (SELECT 1 FROM system_plans WHERE slug = 'pro');