-- Remover o trigger primeiro
DROP TRIGGER IF EXISTS company_changes_log ON companies;

-- Agora remover a função
DROP FUNCTION IF EXISTS public.log_company_changes();