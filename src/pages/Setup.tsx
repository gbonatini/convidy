import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, ArrowRight, CheckCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  features: string[]; // Array de strings
}

const Setup = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    planId: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Redirecionar se não autenticado (após todos os hooks)
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar se já tem empresa configurada (após todos os hooks)
  if (!loading && profile?.company_id) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('system_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;

      // Mapear dados para o formato correto
      const mappedPlans: Plan[] = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price: plan.price,
        features: Array.isArray(plan.features) 
          ? plan.features.map(f => typeof f === 'string' ? f : String(f))
          : []
      }));

      setPlans(mappedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os planos disponíveis.",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      planId: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Setup - Iniciando criação da empresa:', {
      formData,
      user: user?.id,
      profile: profile?.id
    });

    if (!formData.companyName || !formData.planId) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    // Verificar se o plano selecionado existe
    const selectedPlan = plans.find(p => p.id === formData.planId);
    if (!selectedPlan) {
      console.error('❌ Setup - Plano não encontrado:', formData.planId);
      toast({
        variant: "destructive",
        title: "Plano Inválido",
        description: "Por favor, selecione um plano válido.",
      });
      return;
    }

    console.log('✅ Setup - Plano selecionado:', selectedPlan);

    setIsLoading(true);

    try {
      // Gerar slug único para a empresa
      const baseSlug = formData.companyName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .replace(/^-|-$/g, ''); // Remove hífens do início e fim

      // Usar apenas campos que existem na tabela companies
      const companyData = {
        name: formData.companyName,
        email: formData.email || profile?.email,
        phone: formData.phone,
        plan_id: formData.planId,
        slug: baseSlug || 'empresa',
      };

      console.log('📝 Setup - Dados da empresa a serem criados:', companyData);

      const { error: companyError } = await supabase
        .from('companies')
        .insert([companyData]);

      if (companyError) {
        console.error('❌ Setup - Erro ao criar empresa:', companyError);
        throw companyError;
      }

      // Buscar empresa recém-criada via função pública (evita SELECT bloqueado por RLS)
      const { data: companyRpc, error: rpcError } = await supabase
        .rpc('get_company_public', { p_slug: companyData.slug });

      if (rpcError) {
        console.error('❌ Setup - Erro ao buscar empresa via RPC:', rpcError);
        throw rpcError;
      }

      const company = Array.isArray(companyRpc) ? companyRpc[0] : companyRpc;

      if (!company?.id) {
        throw new Error('Empresa criada, mas não foi possível recuperar o ID.');
      }

      console.log('✅ Setup - Empresa criada com sucesso:', company);

      // Atualizar profile com company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('user_id', user!.id);

      if (profileError) {
        console.error('❌ Setup - Erro ao atualizar profile:', profileError);
        throw profileError;
      }

      console.log('✅ Setup - Profile atualizado com company_id:', company.id);

      // Verificar se o profile foi atualizado corretamente
      const { data: updatedProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (checkError) {
        console.error('❌ Setup - Erro ao verificar profile:', checkError);
      } else {
        console.log('✅ Setup - Profile verificado:', updatedProfile);
      }

      // Atualizar contexto
      await refreshProfile();

      console.log('🎉 Setup - Processo completo! Redirecionando para dashboard...');

      toast({
        title: "Empresa configurada com sucesso!",
        description: `Bem-vindo ao Convidy! Plano ${selectedPlan.name} ativado.`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Setup - Erro completo:', {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details
      });
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Empresa já cadastrada",
          description: "Este nome de empresa já está em uso. Use outro nome ou entre em contato conosco.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao configurar empresa",
          description: `Erro: ${error?.message || 'Tente novamente em alguns instantes.'}`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || loadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando configuração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Configurar sua Empresa
            </h1>
            <p className="text-xl text-muted-foreground">
              Complete as informações da sua empresa para começar a usar o Convidy
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Dados da Empresa</span>
              </CardTitle>
              <CardDescription>
                Essas informações aparecerão na sua página pública
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Ex: Minha Empresa LTDA"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contato</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={profile?.email || "email@empresa.com"}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Plans Selection */}
                <div className="space-y-4">
                  <Label>Selecione seu Plano *</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {plans.map((plan) => {
                      const isAdvanced = plan.slug === 'avancado';
                      const isSelected = formData.planId === plan.id;
                      
                      return (
                        <div
                          key={plan.id}
                          onClick={() => handleSelectChange(plan.id)}
                          className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-md' 
                              : 'border-border hover:border-primary/50'
                          } ${isAdvanced ? 'ring-1 ring-emerald-200 dark:ring-emerald-800' : ''}`}
                        >
                          {isAdvanced && (
                            <Badge className="absolute -top-3 right-4 bg-emerald-500 text-white">
                              Recomendado
                            </Badge>
                          )}
                          
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground'
                              }`}>
                                {isSelected && (
                                  <CheckCircle className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <h3 className="font-semibold text-lg">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                <ul className="mt-3 space-y-1.5">
                                  {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <div className="text-2xl font-bold">
                                {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                              </div>
                              {plan.price > 0 && (
                                <span className="text-sm text-muted-foreground">/mês</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || !formData.planId}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      Finalizar Configuração
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Setup;