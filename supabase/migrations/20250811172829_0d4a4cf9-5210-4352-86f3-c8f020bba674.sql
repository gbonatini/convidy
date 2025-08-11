-- Limpar planos existentes e criar os 3 planos padrão
DELETE FROM system_plans;

-- Inserir os 3 planos padrão
INSERT INTO system_plans (name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features, is_active, sort_order) VALUES
-- Plano Gratuito
('Gratuito', 'free', 'Plano gratuito para começar', 0.00, 1, 50, 50, 
 '["1 evento ativo", "Até 50 confirmações", "Check-in com QR Code", "Página pública do evento"]'::jsonb, 
 true, 1),

-- Plano Profissional  
('Profissional', 'profissional', 'Para organizadores de eventos regulares', 29.90, 10, 100, 1000,
 '["Até 10 eventos ativos", "100 confirmações por evento", "Até 1.000 confirmações total", "Check-in com QR Code", "Relatórios básicos", "Página personalizada", "Convites WhatsApp"]'::jsonb,
 true, 2),

-- Plano Empresarial
('Empresarial', 'empresarial', 'Para empresas com eventos de grande porte', 79.90, NULL, 500, NULL,
 '["Eventos ilimitados", "Até 500 confirmações por evento", "Confirmações ilimitadas", "Analytics avançado", "Relatórios detalhados", "API personalizada", "Suporte prioritário", "Convites em massa"]'::jsonb,
 true, 3);