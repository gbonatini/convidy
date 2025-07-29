-- Desativar os planos extras, mantendo apenas Gratuito e Pro
UPDATE system_plans 
SET is_active = false 
WHERE slug IN ('enterprise', 'business');

-- Ajustar sort_order dos planos restantes
UPDATE system_plans 
SET sort_order = 1 
WHERE slug = 'free';

UPDATE system_plans 
SET sort_order = 2 
WHERE slug = 'pro';