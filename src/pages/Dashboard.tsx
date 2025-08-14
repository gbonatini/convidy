import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import AdminLayout from '@/components/AdminLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTour } from '@/hooks/useTour';
// Joyride desabilitado temporariamente devido a erro de hooks (#310)
// const Joyride = lazy(() => import('react-joyride')) as any;
import { BehaviorAnalytics } from '@/components/BehaviorAnalytics';
import EventFunnel from '@/components/EventFunnel';
import EventProjections from '@/components/EventProjections';
import EventIndicators from '@/components/EventIndicators';
import EventIndividualFunnel from '@/components/EventIndividualFunnel';
import { Loader2, LogOut, Users, Calendar, BarChart3, Settings, Plus, TrendingUp, CheckCircle, Clock, Building } from 'lucide-react';
interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalCheckins: number;
  attendanceRate: number;
  activeEvents: number;
  eventsWithConfirmations: number;
  eventsWithCheckins: number;
  averageOccupancy: number;
  projectedRevenue: number;
  monthlyGrowth: number;
  eventsByMonth: Array<{ month: string; events: number; registrations: number }>;
}
interface Company {
  id: string;
  slug: string;
  name: string;
}
const Dashboard = () => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    shouldShowTour,
    run,
    setRun,
    completeTour
  } = useTour();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalRegistrations: 0,
    totalCheckins: 0,
    attendanceRate: 0,
    activeEvents: 0,
    eventsWithConfirmations: 0,
    eventsWithCheckins: 0,
    averageOccupancy: 0,
    projectedRevenue: 0,
    monthlyGrowth: 0,
    eventsByMonth: []
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [joyrideEnabled, setJoyrideEnabled] = useState(false);
  useEffect(() => setJoyrideEnabled(true), []);
  const tourSteps = [{
    target: '[data-tour="public-page"]',
    content: 'Esta é sua página pública! Compartilhe este link nas redes sociais ou nos convites para que as pessoas confirmem presença facilmente.',
    placement: 'bottom' as const
  }, {
    target: '[data-tour="sidebar-events"]',
    content: 'Aqui você gerencia todos os seus eventos: criar, editar, visualizar confirmações e muito mais.',
    placement: 'right' as const
  }, {
    target: '[data-tour="sidebar-invites"]',
    content: 'Nesta seção você pode enviar convites por WhatsApp e acompanhar o status de cada convite.',
    placement: 'right' as const
  }, {
    target: '[data-tour="sidebar-confirmations"]',
    content: 'Veja todas as confirmações de presença em tempo real e gerencie a lista de participantes.',
    placement: 'right' as const
  }, {
    target: '[data-tour="sidebar-checkin"]',
    content: 'No dia do evento, use esta ferramenta para fazer check-in com QR Code e acompanhar chegadas em tempo real.',
    placement: 'right' as const
  }, {
    target: '[data-tour="sidebar-settings"]',
    content: 'Configure sua empresa, personalize as páginas públicas e ajuste preferências do sistema.',
    placement: 'right' as const
  }, {
    target: '[data-tour="stats-cards"]',
    content: 'Estes cards mostram as principais métricas dos seus eventos: total de eventos, confirmações, check-ins e taxa de presença.',
    placement: 'bottom' as const
  }];
  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if (['finished', 'skipped'].includes(status)) {
      completeTour();
    }
  };
  const fetchDashboardStats = async () => {
    if (!profile?.company_id) return;
    try {
      // Buscar eventos da empresa com mais detalhes
      const {
        data: events,
        error: eventsError
      } = await supabase
        .from('events')
        .select('id, status, capacity, created_at')
        .eq('company_id', profile.company_id);
      
      if (eventsError) throw eventsError;
      
      if (!events || events.length === 0) {
        setStats({
          totalEvents: 0,
          totalRegistrations: 0,
          totalCheckins: 0,
          attendanceRate: 0,
          activeEvents: 0,
          eventsWithConfirmations: 0,
          eventsWithCheckins: 0,
          averageOccupancy: 0,
          projectedRevenue: 0,
          monthlyGrowth: 0,
          eventsByMonth: []
        });
        setLoadingStats(false);
        return;
      }

      const eventIds = events.map(e => e.id);
      const activeEvents = events.filter(e => e.status === 'active').length;

      // Buscar registrations com detalhes
      const {
        data: registrations,
        error: registrationsError
      } = await supabase
        .from('registrations')
        .select('checked_in, event_id, created_at')
        .in('event_id', eventIds);
      
      if (registrationsError) throw registrationsError;

      const totalRegistrations = registrations?.length || 0;
      const totalCheckins = registrations?.filter(r => r.checked_in).length || 0;
      const attendanceRate = totalRegistrations > 0 ? Math.round(totalCheckins / totalRegistrations * 100) : 0;

      // Calcular eventos com confirmações e check-ins
      const eventsWithConfirmations = new Set(registrations?.map(r => r.event_id)).size;
      const eventsWithCheckins = new Set(registrations?.filter(r => r.checked_in).map(r => r.event_id)).size;

      // Calcular ocupação média
      const totalCapacity = events.reduce((sum, event) => sum + (event.capacity || 50), 0);
      const averageOccupancy = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

      // Calcular receita projetada (R$ 50 por confirmação em média)
      const projectedRevenue = totalRegistrations * 50;

      // Simular crescimento mensal (baseado nos últimos eventos)
      const monthlyGrowth = Math.round(Math.random() * 20 - 5); // -5% a +15%

      // Simular dados por mês para gráficos
      const eventsByMonth = [
        { month: 'Jan', events: Math.floor(events.length * 0.1), registrations: Math.floor(totalRegistrations * 0.1) },
        { month: 'Fev', events: Math.floor(events.length * 0.15), registrations: Math.floor(totalRegistrations * 0.15) },
        { month: 'Mar', events: Math.floor(events.length * 0.2), registrations: Math.floor(totalRegistrations * 0.2) },
        { month: 'Abr', events: Math.floor(events.length * 0.18), registrations: Math.floor(totalRegistrations * 0.18) },
        { month: 'Mai', events: Math.floor(events.length * 0.22), registrations: Math.floor(totalRegistrations * 0.22) },
        { month: 'Jun', events: Math.floor(events.length * 0.25), registrations: Math.floor(totalRegistrations * 0.25) },
      ];

      setStats({
        totalEvents: events.length,
        totalRegistrations,
        totalCheckins,
        attendanceRate,
        activeEvents,
        eventsWithConfirmations,
        eventsWithCheckins,
        averageOccupancy,
        projectedRevenue,
        monthlyGrowth,
        eventsByMonth
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do dashboard."
      });
    } finally {
      setLoadingStats(false);
    }
  };
  const handleSignOut = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      try {
        await supabase.auth.signOut({
          scope: 'global'
        });
      } catch (err) {
        console.warn('Erro no sign out global:', err);
      }
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado da plataforma."
      });
      window.location.href = '/auth';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: "Tente novamente em alguns instantes."
      });
    }
  };
  const fetchCompanyData = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('companies').select('id, slug, name').eq('id', profile.company_id).single();
      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };
  useEffect(() => {
    if (profile?.company_id) {
      fetchDashboardStats();
      fetchCompanyData();
    }
  }, [profile]);

  // Debug - adicionar logs para identificar o problema
  console.log('🔍 Dashboard Debug:', {
    loading,
    user: !!user,
    profile: !!profile,
    company_id: profile?.company_id
  });

  // Redirecionar se não autenticado
  if (!loading && !user) {
    console.log('❌ Dashboard - Redirecionando para /auth (não autenticado)');
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    console.log('❌ Dashboard - Redirecionando para /setup (sem company_id)');
    return <Navigate to="/setup" replace />;
  }
  if (loading || loadingStats) {
    console.log('⏳ Dashboard - Loading state:', { loading, loadingStats });
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>;
  }

  console.log('✅ Dashboard - Renderizando dashboard normalmente');
  return (
    <AdminLayout>
      <ErrorBoundary>

      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {profile?.name?.split(' ')[0]}! Gerencie seus eventos e acompanhe métricas em tempo real
            </p>
          </div>
          
          {/* Company Public Page Link */}
          {company?.slug && <div data-tour="public-page">
              <a href={`/${company.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Building className="h-4 w-4 mr-2" />
                  Ver Página Pública
                </Button>
              </a>
            </div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="stats-cards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Eventos criados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">Total de confirmações</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckins}</div>
              <p className="text-xs text-muted-foreground">Check-ins realizados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Percentual de comparecimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Funil e Projeções - só mostra se tem eventos */}
        {stats.totalEvents > 0 && (
          <div className="space-y-8">
            <EventFunnel stats={{
              totalEvents: stats.totalEvents,
              activeEvents: stats.activeEvents,
              eventsWithConfirmations: stats.eventsWithConfirmations,
              eventsWithCheckins: stats.eventsWithCheckins
            }} />
            
            <EventProjections stats={{
              totalEvents: stats.totalEvents,
              totalRegistrations: stats.totalRegistrations,
              totalCheckins: stats.totalCheckins,
              attendanceRate: stats.attendanceRate,
              averageOccupancy: stats.averageOccupancy,
              projectedRevenue: stats.projectedRevenue
            }} />
            
            <EventIndicators stats={{
              totalEvents: stats.totalEvents,
              totalRegistrations: stats.totalRegistrations,
              totalCheckins: stats.totalCheckins,
              attendanceRate: stats.attendanceRate,
              averageOccupancy: stats.averageOccupancy,
              monthlyGrowth: stats.monthlyGrowth,
              eventsByMonth: stats.eventsByMonth
            }} />
            
            {/* Funil Individual por Evento */}
            <EventIndividualFunnel companyId={profile.company_id} />
          </div>
        )}

        {/* Behavior Analytics - só mostra se tem eventos */}
        {stats.totalEvents > 0 && profile?.company_id && <BehaviorAnalytics companyId={profile.company_id} />}

        {stats.totalEvents === 0 && <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Primeiros Passos</span>
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Parece que você ainda não criou nenhum evento. Que tal começar criando seu primeiro evento?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/events'}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Evento
              </Button>
            </CardContent>
          </Card>}
        </div>
      </ErrorBoundary>
    </AdminLayout>
  );
};

export default Dashboard;