-- Atualizar planos existentes e adicionar novos
-- Primeiro, vamos desativar todos os planos existentes
UPDATE system_plans SET is_active = false;

-- Atualizar o plano gratuito existente
UPDATE system_plans 
SET 
  name = 'Gratuito',
  slug = 'free',
  description = 'Plano gratuito para começar',
  price = 0.00,
  max_events = 1,
  max_registrations_per_event = 50,
  max_total_registrations = 50,
  features = '["1 evento ativo", "Até 50 confirmações", "Check-in com QR Code", "Página pública do evento"]'::jsonb,
  is_active = true,
  sort_order = 1
WHERE slug = 'free';

-- Inserir plano profissional (se não existir)
INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
SELECT 'Profissional', 'profissional', 'Para organizadores de eventos regulares', 29.90, 10, 100, 1000,
       '["Até 10 eventos ativos", "100 confirmações por evento", "Até 1.000 confirmações total", "Check-in com QR Code", "Relatórios básicos", "Página personalizada", "Convites WhatsApp"]'::jsonb,
       true, 2
WHERE NOT EXISTS (SELECT 1 FROM system_plans WHERE slug = 'profissional');

-- Inserir plano empresarial (se não existir)
INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
SELECT 'Empresarial', 'empresarial', 'Para empresas com eventos de grande porte', 79.90, NULL, 500, NULL,
       '["Eventos ilimitados", "Até 500 confirmações por evento", "Confirmações ilimitadas", "Analytics avançado", "Relatórios detalhados", "API personalizada", "Suporte prioritário", "Convites em massa"]'::jsonb,
       true, 3
WHERE NOT EXISTS (SELECT 1 FROM system_plans WHERE slug = 'empresarial');