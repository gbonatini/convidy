import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Clock,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Award,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';

interface GuestBehavior {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  totalEvents: number;
  confirmedEvents: number;
  checkedInEvents: number;
  noShowEvents: number;
  attendanceRate: number;
  punctualityScore: number;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastEventDate: string | null;
  trend: 'improving' | 'stable' | 'declining';
}

interface AnalyticsStats {
  totalGuests: number;
  avgEngagementScore: number;
  avgAttendanceRate: number;
  highRiskGuests: number;
  topPerformers: number;
  totalNoShows: number;
}

const Analytics = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [guests, setGuests] = useState<GuestBehavior[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestBehavior[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalGuests: 0,
    avgEngagementScore: 0,
    avgAttendanceRate: 0,
    highRiskGuests: 0,
    topPerformers: 0,
    totalNoShows: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'attendance' | 'events'>('score');

  useEffect(() => {
    if (profile?.company_id) {
      fetchAnalyticsData();
    }
  }, [profile]);

  useEffect(() => {
    const filtered = guests.filter(guest => 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm)
    );
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.engagementScore - a.engagementScore;
        case 'attendance':
          return b.attendanceRate - a.attendanceRate;
        case 'events':
          return b.totalEvents - a.totalEvents;
        default:
          return 0;
      }
    });
    
    setFilteredGuests(sorted);
  }, [guests, searchTerm, sortBy]);

  const fetchAnalyticsData = async () => {
    try {
      setLoadingData(true);

      // Buscar eventos da empresa
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, time, status')
        .eq('company_id', profile!.company_id);

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) {
        setLoadingData(false);
        return;
      }

      const eventIds = events.map(e => e.id);

      // Buscar todos os registros
      const { data: registrations, error: regsError } = await supabase
        .from('registrations')
        .select('*')
        .in('event_id', eventIds);

      if (regsError) throw regsError;

      // Agrupar registros por identificador único (cpf ou email ou phone)
      const guestMap = new Map<string, {
        name: string;
        email: string | null;
        phone: string | null;
        cpf: string | null;
        registrations: typeof registrations;
      }>();

      registrations?.forEach(reg => {
        const key = reg.cpf || reg.email || reg.phone || reg.id;
        if (!guestMap.has(key)) {
          guestMap.set(key, {
            name: reg.name,
            email: reg.email,
            phone: reg.phone,
            cpf: reg.cpf,
            registrations: []
          });
        }
        guestMap.get(key)!.registrations.push(reg);
      });

      // Calcular métricas para cada convidado
      const guestBehaviors: GuestBehavior[] = [];

      guestMap.forEach((guest, key) => {
        const regs = guest.registrations;
        const totalEvents = regs.length;
        const confirmedEvents = regs.filter(r => r.status === 'confirmed' || r.status === 'checked_in').length;
        const checkedInEvents = regs.filter(r => r.status === 'checked_in').length;
        const noShowEvents = regs.filter(r => r.status === 'confirmed').length; // Confirmou mas não fez check-in
        
        const attendanceRate = totalEvents > 0 ? Math.round((checkedInEvents / totalEvents) * 100) : 0;
        
        // Calcular pontualidade (baseado em check-ins vs horário do evento)
        let punctualityScore = 80; // Score base
        regs.forEach(reg => {
          if (reg.status === 'checked_in' && reg.checked_in_at) {
            const event = events.find(e => e.id === reg.event_id);
            if (event?.time && event?.date) {
              const eventDateTime = new Date(`${event.date}T${event.time}`);
              const checkinDateTime = new Date(reg.checked_in_at);
              const diffMinutes = (checkinDateTime.getTime() - eventDateTime.getTime()) / 60000;
              
              if (diffMinutes <= 0) punctualityScore += 5; // Chegou antes
              else if (diffMinutes <= 15) punctualityScore += 2; // Até 15min de atraso
              else if (diffMinutes <= 30) punctualityScore -= 5; // 15-30min de atraso
              else punctualityScore -= 10; // Mais de 30min
            }
          }
        });
        punctualityScore = Math.max(0, Math.min(100, punctualityScore));

        // Calcular score de engajamento (0-100)
        const attendanceWeight = 0.4;
        const punctualityWeight = 0.3;
        const frequencyWeight = 0.2;
        const consistencyWeight = 0.1;

        const frequencyScore = Math.min(100, totalEvents * 20); // 5 eventos = 100%
        const consistencyScore = noShowEvents === 0 ? 100 : Math.max(0, 100 - (noShowEvents * 25));

        const engagementScore = Math.round(
          (attendanceRate * attendanceWeight) +
          (punctualityScore * punctualityWeight) +
          (frequencyScore * frequencyWeight) +
          (consistencyScore * consistencyWeight)
        );

        // Determinar nível de risco
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (engagementScore < 40 || (noShowEvents > 1 && attendanceRate < 50)) {
          riskLevel = 'high';
        } else if (engagementScore < 70 || noShowEvents > 0) {
          riskLevel = 'medium';
        }

        // Determinar tendência (baseado em eventos recentes vs antigos)
        const sortedRegs = [...regs].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (sortedRegs.length >= 2) {
          const recentCheckins = sortedRegs.slice(0, Math.ceil(sortedRegs.length / 2))
            .filter(r => r.status === 'checked_in').length;
          const olderCheckins = sortedRegs.slice(Math.ceil(sortedRegs.length / 2))
            .filter(r => r.status === 'checked_in').length;
          
          if (recentCheckins > olderCheckins) trend = 'improving';
          else if (recentCheckins < olderCheckins) trend = 'declining';
        }

        const lastReg = sortedRegs[0];
        const lastEventDate = lastReg ? events.find(e => e.id === lastReg.event_id)?.date : null;

        guestBehaviors.push({
          id: key,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          cpf: guest.cpf,
          totalEvents,
          confirmedEvents,
          checkedInEvents,
          noShowEvents,
          attendanceRate,
          punctualityScore,
          engagementScore,
          riskLevel,
          lastEventDate,
          trend
        });
      });

      setGuests(guestBehaviors);

      // Calcular estatísticas gerais
      const totalGuests = guestBehaviors.length;
      const avgEngagementScore = totalGuests > 0 
        ? Math.round(guestBehaviors.reduce((sum, g) => sum + g.engagementScore, 0) / totalGuests) 
        : 0;
      const avgAttendanceRate = totalGuests > 0
        ? Math.round(guestBehaviors.reduce((sum, g) => sum + g.attendanceRate, 0) / totalGuests)
        : 0;
      const highRiskGuests = guestBehaviors.filter(g => g.riskLevel === 'high').length;
      const topPerformers = guestBehaviors.filter(g => g.engagementScore >= 80).length;
      const totalNoShows = guestBehaviors.reduce((sum, g) => sum + g.noShowEvents, 0);

      setStats({
        totalGuests,
        avgEngagementScore,
        avgAttendanceRate,
        highRiskGuests,
        topPerformers,
        totalNoShows
      });

    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados de análise comportamental."
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente', variant: 'default' as const, className: 'bg-green-500' };
    if (score >= 60) return { label: 'Bom', variant: 'secondary' as const, className: 'bg-yellow-500 text-black' };
    if (score >= 40) return { label: 'Regular', variant: 'outline' as const, className: 'border-orange-500 text-orange-500' };
    return { label: 'Crítico', variant: 'destructive' as const, className: '' };
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Baixo Risco</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Risco Médio</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Alto Risco</Badge>;
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Dados para gráficos
  const scoreDistribution = [
    { name: 'Excelente (80-100)', value: guests.filter(g => g.engagementScore >= 80).length, fill: 'hsl(var(--chart-1))' },
    { name: 'Bom (60-79)', value: guests.filter(g => g.engagementScore >= 60 && g.engagementScore < 80).length, fill: 'hsl(var(--chart-2))' },
    { name: 'Regular (40-59)', value: guests.filter(g => g.engagementScore >= 40 && g.engagementScore < 60).length, fill: 'hsl(var(--chart-3))' },
    { name: 'Crítico (0-39)', value: guests.filter(g => g.engagementScore < 40).length, fill: 'hsl(var(--chart-4))' },
  ];

  const riskDistribution = [
    { name: 'Baixo Risco', value: guests.filter(g => g.riskLevel === 'low').length, fill: '#22c55e' },
    { name: 'Risco Médio', value: guests.filter(g => g.riskLevel === 'medium').length, fill: '#eab308' },
    { name: 'Alto Risco', value: guests.filter(g => g.riskLevel === 'high').length, fill: '#ef4444' },
  ];

  const attendanceDistribution = [
    { range: '0-20%', count: guests.filter(g => g.attendanceRate <= 20).length },
    { range: '21-40%', count: guests.filter(g => g.attendanceRate > 20 && g.attendanceRate <= 40).length },
    { range: '41-60%', count: guests.filter(g => g.attendanceRate > 40 && g.attendanceRate <= 60).length },
    { range: '61-80%', count: guests.filter(g => g.attendanceRate > 60 && g.attendanceRate <= 80).length },
    { range: '81-100%', count: guests.filter(g => g.attendanceRate > 80).length },
  ];

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Analisando comportamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Análise Comportamental</h1>
              <p className="text-muted-foreground">
                Entenda o comportamento dos seus convidados e preveja comparecimentos
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Convidados</p>
                  <p className="text-2xl font-bold">{stats.totalGuests}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Médio</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.avgEngagementScore)}`}>
                    {stats.avgEngagementScore}
                  </p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Presença</p>
                  <p className="text-2xl font-bold">{stats.avgAttendanceRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Performers</p>
                  <p className="text-2xl font-bold text-green-600">{stats.topPerformers}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alto Risco</p>
                  <p className="text-2xl font-bold text-red-600">{stats.highRiskGuests}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">No-Shows</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalNoShows}</p>
                </div>
                <XCircle className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {guests.length === 0 ? (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="py-12 text-center">
              <Brain className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sem dados suficientes</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ainda não há confirmações ou check-ins registrados para analisar. 
                Crie eventos e aguarde participantes para ver a análise comportamental.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="guests">Lista de Convidados</TabsTrigger>
              <TabsTrigger value="insights">Insights IA</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Distribuição de Score de Engajamento
                    </CardTitle>
                    <CardDescription>
                      Como seus convidados estão classificados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={scoreDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, value }) => value > 0 ? `${value}` : ''}
                          >
                            {scoreDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Análise de Risco de No-Show
                    </CardTitle>
                    <CardDescription>
                      Identificação de convidados que podem não comparecer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={riskDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, value }) => value > 0 ? `${value}` : ''}
                          >
                            {riskDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Distribution */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Distribuição de Taxa de Presença
                    </CardTitle>
                    <CardDescription>
                      Quantos convidados estão em cada faixa de comparecimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceDistribution}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="range" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers & At Risk */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Top 5 Convidados Engajados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guests
                        .sort((a, b) => b.engagementScore - a.engagementScore)
                        .slice(0, 5)
                        .map((guest, index) => (
                          <div key={guest.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{guest.name}</p>
                                <p className="text-xs text-muted-foreground">{guest.totalEvents} eventos</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getScoreColor(guest.engagementScore)}`}>
                                {guest.engagementScore}
                              </p>
                              <p className="text-xs text-muted-foreground">{guest.attendanceRate}% presença</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Convidados em Risco de No-Show
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guests
                        .filter(g => g.riskLevel === 'high')
                        .slice(0, 5)
                        .map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <p className="font-medium">{guest.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {guest.noShowEvents} no-shows de {guest.totalEvents} eventos
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">{guest.engagementScore}</p>
                              <p className="text-xs text-muted-foreground">{guest.attendanceRate}% presença</p>
                            </div>
                          </div>
                        ))}
                      {guests.filter(g => g.riskLevel === 'high').length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum convidado em alto risco identificado 🎉
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="guests" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={sortBy === 'score' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('score')}
                      >
                        Score
                      </Button>
                      <Button
                        variant={sortBy === 'attendance' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('attendance')}
                      >
                        Presença
                      </Button>
                      <Button
                        variant={sortBy === 'events' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('events')}
                      >
                        Eventos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guests Table */}
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Convidado</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead className="text-center">Eventos</TableHead>
                          <TableHead className="text-center">Presença</TableHead>
                          <TableHead className="text-center">Pontualidade</TableHead>
                          <TableHead className="text-center">Risco</TableHead>
                          <TableHead className="text-center">Tendência</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGuests.map((guest) => {
                          const scoreBadge = getScoreBadge(guest.engagementScore);
                          return (
                            <TableRow key={guest.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{guest.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {guest.email || guest.phone || '-'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-lg font-bold ${getScoreColor(guest.engagementScore)}`}>
                                    {guest.engagementScore}
                                  </span>
                                  <Badge className={scoreBadge.className} variant={scoreBadge.variant}>
                                    {scoreBadge.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div>
                                  <p className="font-medium">{guest.totalEvents}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {guest.checkedInEvents} check-ins
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-medium">{guest.attendanceRate}%</span>
                                  <Progress value={guest.attendanceRate} className="w-16 h-2" />
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-medium">{guest.punctualityScore}</span>
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {getRiskBadge(guest.riskLevel)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getTrendIcon(guest.trend)}
                                  <span className="text-xs capitalize">{
                                    guest.trend === 'improving' ? 'Melhorando' :
                                    guest.trend === 'declining' ? 'Piorando' : 'Estável'
                                  }</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid gap-6">
                {/* Insight Cards */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Insights Gerados por IA
                    </CardTitle>
                    <CardDescription>
                      Recomendações baseadas na análise comportamental dos seus convidados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.avgAttendanceRate < 70 && (
                      <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                              Taxa de Presença Abaixo do Ideal
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Sua taxa média de presença é de {stats.avgAttendanceRate}%. Considere:
                            </p>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
                              <li>Enviar lembretes mais próximos da data do evento</li>
                              <li>Confirmar presença via WhatsApp um dia antes</li>
                              <li>Analisar se o horário dos eventos é conveniente</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {stats.highRiskGuests > 0 && (
                      <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200">
                              {stats.highRiskGuests} Convidado(s) em Alto Risco
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Estes convidados têm histórico de no-show. Recomendações:
                            </p>
                            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
                              <li>Faça confirmação telefônica com estes convidados</li>
                              <li>Considere overbooking calculado para compensar ausências</li>
                              <li>Envie convites para lista de espera em eventos lotados</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {stats.topPerformers > 0 && (
                      <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                        <div className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-800 dark:text-green-200">
                              {stats.topPerformers} Convidado(s) Altamente Engajados
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              Estes são seus participantes mais fiéis. Sugestões:
                            </p>
                            <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1 list-disc list-inside">
                              <li>Ofereça acesso antecipado a novos eventos</li>
                              <li>Crie um programa de fidelidade ou VIP</li>
                              <li>Peça indicações para expandir sua base de convidados</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold">Previsão para Próximos Eventos</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Com base no histórico comportamental, estimamos que <strong>{Math.round(stats.avgAttendanceRate * 0.95)}% a {Math.min(100, Math.round(stats.avgAttendanceRate * 1.05))}%</strong> dos 
                            convidados confirmados comparecerão aos próximos eventos.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            📊 Score médio de engajamento: <strong>{stats.avgEngagementScore}/100</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default Analytics;
