import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from '@/components/PaymentModal';
import { Crown, Zap, Users, Check, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  max_events: number | null;
  max_guests_per_event: number | null;
  features: any[];
  is_active: boolean | null;
}
interface CompanyPlan {
  plan_id: string | null;
  system_plans: {
    name: string;
    slug: string;
  };
}
const Plans = () => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const {
    toast
  } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CompanyPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const fetchPlans = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('system_plans').select('*').eq('is_active', true).order('price');
      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })));
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os planos disponíveis."
      });
    } finally {
      setLoadingPlans(false);
    }
  };
  const fetchCurrentPlan = async () => {
    if (!profile?.company_id) return;
    try {
      // Buscar dados da empresa
      const {
        data: companyData,
        error: companyError
      } = await supabase.from('companies').select('plan_id').eq('id', profile.company_id).single();
      if (companyError) throw companyError;

      if (!companyData.plan_id) {
        setCurrentPlan(null);
        return;
      }

      // Buscar dados do plano
      const {
        data: planData,
        error: planError
      } = await supabase.from('system_plans').select('name, slug').eq('id', companyData.plan_id).single();
      if (planError) throw planError;
      const combinedData = {
        plan_id: companyData.plan_id,
        system_plans: planData
      };
      setCurrentPlan(combinedData);
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error);
    }
  };
  useEffect(() => {
    fetchPlans();
    fetchCurrentPlan();
  }, [profile]);
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'avançado':
      case 'avancado':
        return <Crown className="h-6 w-6 text-emerald-500" />;
      default:
        return <Users className="h-6 w-6 text-gray-500" />;
    }
  };
  const getPlanGradient = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'avançado':
      case 'avancado':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800';
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  const formatLimit = (limit: number | null, suffix: string = '') => {
    if (limit === null || limit === -1) return 'Ilimitado';
    return `${limit}${suffix}`;
  };
  const isCurrentPlan = (planId: string) => {
    return currentPlan?.plan_id === planId;
  };
  const handleSelectPlan = (plan: Plan) => {
    if (isCurrentPlan(plan.id)) return;
    if (plan.slug === 'free') {
      // Downgrade direto para free
      handleDowngradeToFree(plan.id);
    } else {
      setSelectedPlan(plan);
      setShowPayment(true);
    }
  };
  const handleDowngradeToFree = async (planId: string) => {
    if (!profile?.company_id) return;
    try {
      const {
        error
      } = await supabase.from('companies').update({
        plan_id: planId,
        updated_at: new Date().toISOString()
      }).eq('id', profile.company_id);
      if (error) throw error;
      toast({
        title: "Plano alterado",
        description: "Seu plano foi alterado para Gratuito."
      });
      fetchCurrentPlan();
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o plano."
      });
    }
  };
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }
  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }
  if (loading || loadingPlans) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Planos</h1>
            <p className="text-muted-foreground">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
        </div>

        {currentPlan && <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Plano Atual: {currentPlan.system_plans.name}</span>
              </CardTitle>
              
            </CardHeader>
          </Card>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map(plan => {
            const isAdvanced = plan.slug === 'avancado';
            return (
              <Card key={plan.id} className={`relative ${getPlanGradient(plan.name)} ${isAdvanced ? 'ring-2 ring-emerald-500' : ''}`}>
                {isAdvanced && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Recomendado</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[3rem]">
                    {plan.description}
                  </CardDescription>
                  <div className="py-4">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold">Grátis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Eventos</span>
                      <Badge variant="outline">
                        {formatLimit(plan.max_events)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Confirmações por evento</span>
                      <Badge variant="outline">
                        {formatLimit(plan.max_guests_per_event)}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full mt-6 ${isAdvanced && !isCurrentPlan(plan.id) ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => handleSelectPlan(plan)} 
                    disabled={isCurrentPlan(plan.id)} 
                    variant={isCurrentPlan(plan.id) ? "outline" : "default"}
                  >
                    {isCurrentPlan(plan.id) ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Plano Atual
                      </>
                    ) : plan.price === 0 ? 'Usar Plano Gratuito' : 'Assinar Agora'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPlan && <PaymentModal open={showPayment} onOpenChange={setShowPayment} plan={selectedPlan} onSuccess={() => {
      setShowPayment(false);
      fetchCurrentPlan();
    }} />}
    </AdminLayout>;
};
export default Plans;