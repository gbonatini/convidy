import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    cnpj: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    planId: '',
  });

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar se já tem empresa configurada
  if (!loading && profile?.company_id) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('system_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

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

  const validateCNPJ = (cnpj: string) => {
    // Remover caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Verificar se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Validação básica (implementar validação completa em produção)
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.cnpj || !formData.planId) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    if (!validateCNPJ(formData.cnpj)) {
      toast({
        variant: "destructive",
        title: "CNPJ Inválido",
        description: "Por favor, insira um CNPJ válido com 14 dígitos.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Criar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: formData.companyName,
          cnpj: formData.cnpj.replace(/\D/g, ''),
          description: formData.description,
          email: formData.email || profile?.email,
          phone: formData.phone,
          address: formData.address,
          plan_id: formData.planId,
          slug: formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          status: 'active',
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // Atualizar profile com company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('user_id', user!.id);

      if (profileError) throw profileError;

      // Atualizar contexto
      await refreshProfile();

      toast({
        title: "Empresa configurada com sucesso!",
        description: "Bem-vindo ao Convidy! Você pode começar a criar seus eventos.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao configurar empresa:', error);
      
      if (error.code === '23505' && error.message.includes('cnpj')) {
        toast({
          variant: "destructive",
          title: "CNPJ já cadastrado",
          description: "Este CNPJ já está em uso. Use outro CNPJ ou entre em contato conosco.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao configurar empresa",
          description: "Tente novamente em alguns instantes.",
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Configurar sua Empresa
            </h1>
            <p className="text-xl text-muted-foreground">
              Complete as informações da sua empresa para começar a usar o Convidy
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ *</Label>
                        <Input
                          id="cnpj"
                          name="cnpj"
                          placeholder="00.000.000/0001-00"
                          value={formData.cnpj}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição da Empresa</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Conte um pouco sobre sua empresa..."
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email de Contato</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder={profile?.email}
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

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan">Plano *</Label>
                      <Select onValueChange={handleSelectChange} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{plan.name}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price.toFixed(2)}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
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

            {/* Plans Preview */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Planos Disponíveis</h3>
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all ${
                    formData.planId === plan.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => handleSelectChange(plan.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {formData.planId === plan.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-2xl font-bold">
                      {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price.toFixed(2)}`}
                      {plan.price > 0 && <span className="text-sm font-normal">/mês</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;