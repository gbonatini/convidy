import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  LogOut, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  Plus,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalCheckins: number;
  attendanceRate: number;
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalRegistrations: 0,
    totalCheckins: 0,
    attendanceRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Debug logs
  console.log('Dashboard - loading:', loading);
  console.log('Dashboard - user:', user);
  console.log('Dashboard - profile:', profile);
  console.log('Dashboard - loadingStats:', loadingStats);

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    console.log('Redirecionando para setup - profile sem company_id:', profile);
    return <Navigate to="/setup" replace />;
  }

  useEffect(() => {
    console.log('Dashboard useEffect - profile?.company_id:', profile?.company_id);
    if (profile?.company_id) {
      fetchDashboardStats();
    } else {
      console.log('Dashboard - não chamando fetchDashboardStats, company_id não encontrado');
    }
  }, [profile]);

  const fetchDashboardStats = async () => {
    if (!profile?.company_id) {
      console.log('fetchDashboardStats - company_id não encontrado:', profile);
      return;
    }

    console.log('fetchDashboardStats - iniciando com company_id:', profile.company_id);

    try {
      setLoadingStats(true);

      // Buscar eventos da empresa
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('company_id', profile.company_id);

      if (eventsError) throw eventsError;

      const eventIds = events?.map(e => e.id) || [];

      // Buscar confirmações
      let totalRegistrations = 0;
      let totalCheckins = 0;

      if (eventIds.length > 0) {
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('checked_in')
          .in('event_id', eventIds);

        if (regError) throw regError;

        totalRegistrations = registrations?.length || 0;
        totalCheckins = registrations?.filter(r => r.checked_in).length || 0;
      }

      const attendanceRate = totalRegistrations > 0 
        ? Math.round((totalCheckins / totalRegistrations) * 100) 
        : 0;

      setStats({
        totalEvents: events?.length || 0,
        totalRegistrations,
        totalCheckins,
        attendanceRate
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do dashboard.",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Limpar estado de auth
      localStorage.clear();
      sessionStorage.clear();
      
      // Tentar sign out global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Erro no sign out global:', err);
      }
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado da plataforma.",
      });
      
      // Recarregar página para estado limpo
      window.location.href = '/auth';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: "Tente novamente em alguns instantes.",
      });
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Convidy
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Dashboard
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Bem-vindo, {profile?.name?.split(' ')[0]}!</h2>
            <p className="text-muted-foreground">
              Gerencie seus eventos e acompanhe métricas em tempo real
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Eventos criados
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmações</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
                <p className="text-xs text-muted-foreground">
                  Total de confirmações
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCheckins}</div>
                <p className="text-xs text-muted-foreground">
                  Check-ins realizados
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Percentual de comparecimento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Criar Evento</span>
                </CardTitle>
                <CardDescription>
                  Organize um novo evento e comece a receber confirmações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => window.location.href = '/events'}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gerenciar Eventos
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Relatórios</span>
                </CardTitle>
                <CardDescription>
                  Analise o desempenho dos seus eventos com dados detalhados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </CardTitle>
                <CardDescription>
                  Configure sua empresa e personalize suas páginas públicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Sistema Protegido</span>
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Sua conta está protegida com autenticação segura e políticas de segurança avançadas.
                Todos os dados são criptografados e seguem as diretrizes da LGPD.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Onboarding Notice */}
          {stats.totalEvents === 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Primeiros Passos</span>
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Parece que você ainda não criou nenhum evento. Que tal começar criando seu primeiro evento?
                  É rápido e fácil!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/events'}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Evento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;