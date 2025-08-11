import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate, Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PaymentHistory } from '@/components/PaymentHistory';
import { Crown, Zap, Users, Calendar, ArrowLeft, CreditCard, AlertTriangle } from 'lucide-react';

interface CompanyPlan {
  plan_id: string;
  plan_expires_at: string | null;
  plan_status: string;
  system_plans: {
    name: string;
    slug: string;
    description: string;
    price: number;
    max_events: number | null;
    max_registrations_per_event: number | null;
    max_total_registrations: number | null;
    features: any[];
  };
}

const Billing = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const { usage, planLimits, planName } = usePlanLimits();
  const [currentPlan, setCurrentPlan] = useState<CompanyPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const fetchCurrentPlan = async () => {
    if (!profile?.company_id) return;

    try {
      // Primeiro buscar dados da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('plan_id, plan_expires_at, plan_status')
        .eq('id', profile.company_id)
        .single();

      if (companyError) throw companyError;

      if (!companyData?.plan_id) {
        console.error('❌ No plan_id found for company in Billing');
        return;
      }

      // Depois buscar dados do plano separadamente
      const { data: planData, error: planError } = await supabase
        .from('system_plans')
        .select('name, slug, description, price, max_events, max_registrations_per_event, max_total_registrations, features')
        .eq('id', companyData.plan_id)
        .single();

      if (planError) throw planError;

      // Combinar os dados
      const combinedData = {
        plan_id: companyData.plan_id,
        plan_expires_at: companyData.plan_expires_at,
        plan_status: companyData.plan_status,
        system_plans: planData
      };

      setCurrentPlan(combinedData as any);
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar informações do plano.",
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    fetchCurrentPlan();
  }, [profile]);

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'empresarial':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'profissional':
        return <Zap className="h-6 w-6 text-blue-500" />;
      default:
        return <Users className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatLimit = (limit: number | null) => {
    return limit === null ? 'Ilimitado' : limit.toString();
  };

  const isExpiringSoon = () => {
    if (!currentPlan?.plan_expires_at) return false;
    const expiryDate = new Date(currentPlan.plan_expires_at);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return expiryDate <= threeDaysFromNow;
  };

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  if (loading || loadingPlan) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Cobrança</h1>
            <p className="text-muted-foreground">
              Gerencie sua assinatura e uso do plano
            </p>
          </div>
        </div>

        {/* Alertas */}
        {isExpiringSoon() && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu plano expira em {new Date(currentPlan!.plan_expires_at!).toLocaleDateString('pt-BR')}. 
              Renove agora para continuar usando todos os recursos.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plano Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {currentPlan && getPlanIcon(currentPlan.system_plans.name)}
                <span>Plano Atual</span>
              </CardTitle>
              <CardDescription>
                Informações da sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPlan ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {currentPlan.system_plans.name}
                    </span>
                    <Badge variant="outline">
                      {formatPrice(currentPlan.system_plans.price)}/mês
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {currentPlan.system_plans.description}
                  </p>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={currentPlan.plan_status === 'active' ? 'default' : 'destructive'}>
                        {currentPlan.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    {currentPlan.plan_expires_at && (
                      <div className="flex justify-between text-sm">
                        <span>Expira em:</span>
                        <span>{new Date(currentPlan.plan_expires_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link to="/plans" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Alterar Plano
                      </Button>
                    </Link>
                    {currentPlan.system_plans.slug !== 'free' && (
                      <Button variant="default" className="flex-1">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Renovar
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando informações do plano...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uso Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Uso Atual</span>
              </CardTitle>
              <CardDescription>
                Seu consumo no período atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Eventos Criados</p>
                    <p className="text-xs text-muted-foreground">
                      {planLimits.maxEvents === null ? 'Ilimitado' : `Limite: ${planLimits.maxEvents}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{usage.totalEvents}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total de Confirmações</p>
                    <p className="text-xs text-muted-foreground">
                      {planLimits.maxTotalRegistrations === null ? 'Ilimitado' : `Limite: ${planLimits.maxTotalRegistrations}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{usage.totalRegistrations}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Eventos Ativos</p>
                    <p className="text-xs text-muted-foreground">Recebendo confirmações</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{usage.activeEvents}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recursos do Plano */}
          {currentPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Recursos Inclusos</CardTitle>
                <CardDescription>
                  O que está disponível no seu plano atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {currentPlan.system_plans.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Pagamentos */}
          <PaymentHistory />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Billing;