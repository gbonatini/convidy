-- Desativar planos antigos (Starter, Pro, Enterprise)
UPDATE public.system_plans 
SET is_active = false, updated_at = now()
WHERE slug IN ('starter', 'pro', 'enterprise');

-- Atualizar plano Gratuito: 1 evento, 5 confirmações
UPDATE public.system_plans 
SET 
  max_events = 1,
  max_guests_per_event = 5,
  description = 'Ideal para experimentar a plataforma',
  features = '["1 evento ativo", "5 confirmações por evento", "Check-in com QR Code", "Página pública do evento"]'::jsonb,
  updated_at = now()
WHERE slug = 'free';

-- Criar plano Avançado
INSERT INTO public.system_plans (name, slug, description, price, max_events, max_guests_per_event, features, is_active)
VALUES (
  'Avançado',
  'avancado',
  'Para quem precisa de recursos completos sem limites',
  149.90,
  -1,
  -1,
  '["Eventos ilimitados", "Confirmações ilimitadas", "Check-in com QR Code", "Relatórios completos", "Suporte prioritário", "Página pública personalizada"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  max_events = EXCLUDED.max_events,
  max_guests_per_event = EXCLUDED.max_guests_per_event,
  features = EXCLUDED.features,
  is_active = true,
  updated_at = now();

-- Migrar empresas dos planos antigos pagos para o novo plano Avançado
UPDATE public.companies 
SET 
  plan_id = (SELECT id FROM public.system_plans WHERE slug = 'avancado'),
  updated_at = now()
WHERE plan_id IN (
  SELECT id FROM public.system_plans WHERE slug IN ('starter', 'pro', 'enterprise')
);