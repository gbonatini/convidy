-- Corrigir políticas RLS da tabela companies para usar profiles ao invés de users
DROP POLICY IF EXISTS "Company users can update own company" ON companies;
DROP POLICY IF EXISTS "Users can update own company" ON companies;
DROP POLICY IF EXISTS "Users can view own company" ON companies;

-- Criar políticas corretas usando a tabela profiles
CREATE POLICY "Profile users can update own company" 
ON companies 
FOR UPDATE 
USING (auth.uid() IN ( 
  SELECT profiles.user_id 
  FROM profiles 
  WHERE profiles.company_id = companies.id
));

CREATE POLICY "Profile users can view own company" 
ON companies 
FOR SELECT 
USING (auth.uid() IN ( 
  SELECT profiles.user_id 
  FROM profiles 
  WHERE profiles.company_id = companies.id
));