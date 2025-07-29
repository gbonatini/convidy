-- Primeiro, remover o trigger que está impedindo a alteração
DROP TRIGGER IF EXISTS trigger_update_behavior_stats ON public.registrations;

-- Agora alterar os tipos das colunas
ALTER TABLE public.registrations 
ALTER COLUMN qr_code TYPE character varying(255);

ALTER TABLE public.registrations 
ALTER COLUMN phone TYPE character varying(20);

ALTER TABLE public.registrations 
ALTER COLUMN document TYPE character varying(20);

-- Recriar o trigger
CREATE TRIGGER trigger_update_behavior_stats
    AFTER INSERT ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_behavior_stats();