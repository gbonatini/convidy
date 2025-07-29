-- Remover temporariamente o trigger que está causando problemas
DROP TRIGGER IF EXISTS trigger_update_behavior_stats ON public.registrations;

-- Também vou simplificar a função ou removê-la por enquanto
DROP FUNCTION IF EXISTS public.update_user_behavior_stats();