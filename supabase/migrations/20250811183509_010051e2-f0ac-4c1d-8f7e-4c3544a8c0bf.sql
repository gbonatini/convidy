-- Remover foreign key duplicada que está causando o erro PGRST201
-- O PostgREST não consegue decidir qual foreign key usar quando há múltiplas

-- Verificar as foreign keys existentes
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'companies'
  AND kcu.column_name = 'plan_id';

-- Remover uma das foreign keys duplicadas (manter apenas companies_plan_id_fkey)
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS fk_companies_plan_id;

-- Verificar se ainda existe a foreign key principal
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'companies_plan_id_fkey' 
    AND table_name = 'companies'
  ) THEN
    -- Recriar a foreign key se necessário
    ALTER TABLE public.companies 
    ADD CONSTRAINT companies_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.system_plans(id);
  END IF;
END $$;