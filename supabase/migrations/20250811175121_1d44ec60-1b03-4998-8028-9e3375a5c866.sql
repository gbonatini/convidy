-- Limpeza completa do banco para produção
-- Manter apenas estrutura essencial e planos corretos

-- 1. Limpar dados de teste/desenvolvimento
DELETE FROM payment_transactions;
DELETE FROM invites; 
DELETE FROM registrations;
DELETE FROM events;
DELETE FROM message_templates;
DELETE FROM notification_settings;
DELETE FROM user_behavior_stats;
DELETE FROM system_logs;

-- 2. Limpar empresas e perfis de teste
DELETE FROM profiles;
DELETE FROM companies;

-- 3. Garantir que apenas os 3 planos corretos existam
-- Primeiro desativa todos
UPDATE system_plans SET is_active = false;

-- Remove planos desnecessários se existirem
DELETE FROM system_plans WHERE slug NOT IN ('free', 'pro', 'empresarial');

-- Garante que os 3 planos estão corretos
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

-- Se algum plano não existir, criar
INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
SELECT 'Gratuito', 'free', 'Plano gratuito para começar', 0.00, 1, 10, 10,
       '["1 evento ativo simultâneo", "Até 10 convidados por evento", "Check-in básico com QR Code", "Página pública simples", "Sem suporte"]'::jsonb,
       true, 1
WHERE NOT EXISTS (SELECT 1 FROM system_plans WHERE slug = 'free');

INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
SELECT 'Pro', 'pro', 'Para organizadores profissionais', 99.00, 5, NULL, 100,
       '["5 eventos ativos simultâneos", "Até 100 convidados por mês", "Analytics básicos (funil, projeções)", "Personalização da página pública", "Templates de mensagens WhatsApp", "Convites automáticos", "Suporte prioritário"]'::jsonb,
       true, 2
WHERE NOT EXISTS (SELECT 1 FROM system_plans WHERE slug = 'pro');

INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order)
SELECT 'Empresarial', 'empresarial', 'Para empresas de grande porte', 299.00, NULL, NULL, NULL,
       '["Eventos ilimitados", "Convidados ilimitados", "🤖 Módulo IA/Análise Comportamental (EXCLUSIVO)", "Analytics avançados com insights", "API básica para integrações", "White-label (sem marca do sistema)", "Notificações automáticas avançadas", "Suporte via WhatsApp", "Relatórios personalizados"]'::jsonb,
       true, 3
WHERE NOT EXISTS (SELECT 1 FROM system_plans WHERE slug = 'empresarial');