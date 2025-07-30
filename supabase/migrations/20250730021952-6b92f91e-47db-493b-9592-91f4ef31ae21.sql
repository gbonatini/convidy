-- Remover qualquer trigger problemático na tabela companies
DROP TRIGGER IF EXISTS log_company_changes ON companies;

-- Remover a função também se existir
DROP FUNCTION IF EXISTS public.log_company_changes();