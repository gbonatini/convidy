-- Habilitar a extensão pgcrypto necessária para a função digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Agora a função update_user_behavior_stats deve funcionar corretamente
-- Vamos testá-la recriando ela
DROP FUNCTION IF EXISTS public.update_user_behavior_stats();

CREATE OR REPLACE FUNCTION public.update_user_behavior_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert statistics with hashed document
    INSERT INTO public.user_behavior_stats (
        document, 
        document_type, 
        total_registrations,
        total_checkins,
        last_activity
    ) VALUES (
        encode(digest(NEW.document, 'sha256'), 'hex'),
        NEW.document_type,
        1,
        CASE WHEN NEW.checked_in THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (document, document_type) 
    DO UPDATE SET
        total_registrations = user_behavior_stats.total_registrations + 1,
        total_checkins = user_behavior_stats.total_checkins + CASE WHEN NEW.checked_in THEN 1 ELSE 0 END,
        last_activity = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';