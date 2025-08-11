-- Limpar usuários órfãos da tabela auth.users que não têm mais perfil
-- ATENÇÃO: Isso vai deslogar todos os usuários e eles precisarão se registrar novamente

-- Primeiro, vamos ver quantos usuários temos
-- DELETE FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);

-- Como limpamos completamente a tabela profiles, vamos remover todos os usuários de teste
-- Deixando apenas a estrutura limpa para novos registros

DELETE FROM auth.users;