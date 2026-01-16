import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminLayout from '@/components/AdminLayout';
import { PaymentHistory } from '@/components/PaymentHistory';
import { useAuth } from '@/components/AuthProvider';
import { useCompanyPlan } from '@/hooks/useCompanyPlan';
import { Crown, Zap, Users, ArrowLeft, Calendar, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Billing = () => {
  const { user, profile, loading } = useAuth();
  const { plan, company, usage, loading: planLoading, error } = useCompanyPlan();

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'empresarial':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'pro':
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

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expDate = new Date(expiresAt);
    const today = new Date();
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  if (loading || planLoading) {
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

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar informações do plano: {error}
            </AlertDescription>
          </Alert>
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
        {company?.next_payment_due && isExpiringSoon(company.next_payment_due) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu plano expira em {new Date(company.next_payment_due).toLocaleDateString('pt-BR')}. 
              Renove agora para continuar usando todos os recursos.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plano Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {plan && getPlanIcon(plan.name)}
                <span>Plano Atual</span>
              </CardTitle>
              <CardDescription>
                Informações da sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {plan.name}
                    </span>
                    <Badge variant="outline">
                      {formatPrice(plan.price)}/mês
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={company?.plan_status === 'active' ? 'default' : 'destructive'}>
                        {company?.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {company?.next_payment_due && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Expira em:</span>
                        <span className="text-muted-foreground">
                          {new Date(company.next_payment_due).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link to="/plans" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Alterar Plano
                      </Button>
                    </Link>
                    {plan.slug !== 'free' && (
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="text-center space-y-2">
                  <h4 className="font-medium">Eventos Criados</h4>
                  <div className="text-2xl font-bold text-primary">
                    {usage.totalEvents} / {formatLimit(plan?.max_events)}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h4 className="font-medium">Total de Confirmações</h4>
                  <div className="text-2xl font-bold text-primary">
                    {usage.totalRegistrations}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h4 className="font-medium">Eventos Ativos</h4>
                  <div className="text-2xl font-bold text-secondary">
                    {usage.activeEvents}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recebendo confirmações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recursos do Plano */}
          {plan && (
            <Card>
              <CardHeader>
                <CardTitle>Recursos Inclusos</CardTitle>
                <CardDescription>
                  O que está disponível no seu plano atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
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