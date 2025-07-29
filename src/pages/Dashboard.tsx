import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import AdminLayout from '@/components/AdminLayout';
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
  Clock,
  Building
} from 'lucide-react';

interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalCheckins: number;
  attendanceRate: number;
}

interface Company {
  id: string;
  slug: string;
  name: string;
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
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchDashboardStats = async () => {
    if (!profile?.company_id) return;

    try {
      // Buscar eventos da empresa
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('company_id', profile.company_id);

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        setStats({
          totalEvents: 0,
          totalRegistrations: 0,
          totalCheckins: 0,
          attendanceRate: 0,
        });
        setLoadingStats(false);
        return;
      }

      const eventIds = events.map(e => e.id);

      // Buscar registrations
      const { data: registrations, error: registrationsError } = await supabase
        .from('registrations')
        .select('checked_in')
        .in('event_id', eventIds);

      if (registrationsError) throw registrationsError;

      const totalRegistrations = registrations?.length || 0;
      const totalCheckins = registrations?.filter(r => r.checked_in).length || 0;
      const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckins / totalRegistrations) * 100) : 0;

      setStats({
        totalEvents: events.length,
        totalRegistrations: totalRegistrations,
        totalCheckins: totalCheckins,
        attendanceRate: attendanceRate,
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
      localStorage.clear();
      sessionStorage.clear();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Erro no sign out global:', err);
      }
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado da plataforma.",
      });
      
      window.location.href = '/auth';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: "Tente novamente em alguns instantes.",
      });
    }
  };

  const fetchCompanyData = async () => {
    if (!profile?.company_id) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, slug, name')
        .eq('id', profile.company_id)
        .single();

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

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

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
    <AdminLayout>
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
          {company?.slug && (
            <a href={`/${company.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Building className="h-4 w-4 mr-2" />
                Ver Página Pública
              </Button>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Eventos criados</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">Total de confirmações</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckins}</div>
              <p className="text-xs text-muted-foreground">Check-ins realizados</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
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

        {stats.totalEvents === 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
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
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;