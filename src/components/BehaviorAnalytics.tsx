import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Clock,
  MapPin,
  Calendar,
  Target,
  Lightbulb,
  BarChart3
} from 'lucide-react';

interface BehaviorInsight {
  type: 'attendance_pattern' | 'time_preference' | 'location_preference' | 'event_type_preference';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  actionable_insight: string;
  data_points: number;
}

interface BehaviorAnalyticsProps {
  companyId: string;
}

export const BehaviorAnalytics: React.FC<BehaviorAnalyticsProps> = ({ companyId }) => {
  const [insights, setInsights] = useState<BehaviorInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    repeatAttendees: 0,
    averageAttendanceRate: 0,
    behaviorPredictions: 0
  });

  useEffect(() => {
    generateBehaviorInsights();
  }, [companyId]);

  const generateBehaviorInsights = async () => {
    try {
      setLoading(true);
      
      // Buscar dados dos eventos e registros
      const { data: events } = await supabase
        .from('events')
        .select(`
          id, title, date, time, location, 
          registrations(document, checked_in, created_at)
        `)
        .eq('company_id', companyId);

      if (!events) return;

      // Processar dados para gerar insights
      const insights = await processDataForInsights(events);
      setInsights(insights);

      // Calcular estatísticas gerais
      const allRegistrations = events.flatMap(e => e.registrations || []);
      const uniqueUsers = new Set(allRegistrations.map(r => r.document)).size;
      const userAttendanceCounts: Record<string, number> = {};
      
      allRegistrations.forEach(reg => {
        if (!userAttendanceCounts[reg.document]) {
          userAttendanceCounts[reg.document] = 0;
        }
        userAttendanceCounts[reg.document]++;
      });

      const repeatAttendees = Object.values(userAttendanceCounts).filter((count: number) => count > 1).length;
      const checkedInCount = allRegistrations.filter(r => r.checked_in).length;
      const attendanceRate = allRegistrations.length > 0 ? (checkedInCount / allRegistrations.length) * 100 : 0;

      setStats({
        totalUsers: uniqueUsers,
        repeatAttendees,
        averageAttendanceRate: Math.round(attendanceRate),
        behaviorPredictions: insights.length
      });

    } catch (error) {
      console.error('Erro ao gerar insights comportamentais:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDataForInsights = async (events: any[]): Promise<BehaviorInsight[]> => {
    const insights: BehaviorInsight[] = [];
    
    // Análise 1: Padrão de Comparecimento
    const attendanceRates = events.map(event => {
      const regs = event.registrations || [];
      const checkedIn = regs.filter(r => r.checked_in).length;
      return regs.length > 0 ? (checkedIn / regs.length) * 100 : 0;
    });

    const avgAttendance = attendanceRates.length > 0 ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length : 0;
    
    if (avgAttendance > 75) {
      insights.push({
        type: 'attendance_pattern',
        title: 'Alta Taxa de Comparecimento',
        description: `Seus eventos mantêm uma taxa média de presença de ${Math.round(avgAttendance)}%`,
        confidence: 'high',
        actionable_insight: 'Continue com as estratégias atuais. Considere aumentar a capacidade dos próximos eventos.',
        data_points: events.length
      });
    } else if (avgAttendance < 50) {
      insights.push({
        type: 'attendance_pattern',
        title: 'Oportunidade de Melhoria',
        description: `Taxa média de presença: ${Math.round(avgAttendance)}%. Há margem para melhorar o comparecimento.`,
        confidence: 'medium',
        actionable_insight: 'Experimente enviar lembretes mais próximos da data do evento ou ajustar horários.',
        data_points: events.length
      });
    }

    // Análise 2: Preferência de Horário
    const timePreferences: Record<string, number> = {};
    events.forEach(event => {
      const hour = parseInt(event.time?.split(':')[0] || '0');
      const period = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';
      if (!timePreferences[period]) timePreferences[period] = 0;
      timePreferences[period] += (event.registrations || []).length;
    });

    const bestTime = Object.entries(timePreferences).sort(([,a], [,b]) => b - a)[0];
    if (bestTime) {
      const totalRegistrations = Object.values(timePreferences).reduce((a, b) => a + b, 0);
      const percentage = totalRegistrations > 0 ? Math.round((bestTime[1] / totalRegistrations) * 100) : 0;
      insights.push({
        type: 'time_preference',
        title: 'Horário Preferido Identificado',
        description: `Eventos da ${bestTime[0]} têm ${percentage}% das inscrições`,
        confidence: 'high',
        actionable_insight: `Priorize eventos da ${bestTime[0]} para maximizar participação.`,
        data_points: events.length
      });
    }

    // Análise 3: Locais Populares
    const locationPopularity: Record<string, number> = {};
    events.forEach(event => {
      if (!locationPopularity[event.location]) locationPopularity[event.location] = 0;
      locationPopularity[event.location] += (event.registrations || []).length;
    });

    const popularLocation = Object.entries(locationPopularity).sort(([,a], [,b]) => b - a)[0];
    if (popularLocation && Object.keys(locationPopularity).length > 1) {
      insights.push({
        type: 'location_preference',
        title: 'Local Preferido',
        description: `"${popularLocation[0]}" é o local mais popular com ${popularLocation[1]} inscrições`,
        confidence: 'medium',
        actionable_insight: 'Considere repetir eventos neste local ou lugares similares.',
        data_points: Object.keys(locationPopularity).length
      });
    }

    // Análise 4: Usuários Recorrentes
    const allRegistrations = events.flatMap(e => e.registrations || []);
    const userCounts: Record<string, number> = {};
    allRegistrations.forEach(reg => {
      if (!userCounts[reg.document]) userCounts[reg.document] = 0;
      userCounts[reg.document]++;
    });

    const repeatUsers = Object.values(userCounts).filter((count: number) => count > 1).length;
    const totalUsers = Object.keys(userCounts).length;
    
    if (repeatUsers > 0) {
      const loyaltyRate = (repeatUsers / totalUsers) * 100;
      insights.push({
        type: 'event_type_preference',
        title: 'Base de Usuários Fiéis',
        description: `${loyaltyRate.toFixed(1)}% dos participantes comparecem a múltiplos eventos`,
        confidence: 'high',
        actionable_insight: 'Crie programas de fidelidade ou eventos exclusivos para usuários recorrentes.',
        data_points: totalUsers
      });
    }

    return insights;
  };

  const getConfidenceVariant = (confidence: string): 'success' | 'warning' | 'secondary' => {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'attendance_pattern': return <TrendingUp className="h-5 w-5" />;
      case 'time_preference': return <Clock className="h-5 w-5" />;
      case 'location_preference': return <MapPin className="h-5 w-5" />;
      case 'event_type_preference': return <Users className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise Comportamental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Brain className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Analisando comportamentos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Recorrentes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repeatAttendees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média Presença</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendanceRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Gerados</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.behaviorPredictions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Behavior Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights Comportamentais IA
          </CardTitle>
          <CardDescription>
            Nossa IA analisa padrões de comportamento dos participantes para otimizar futuros eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dados Insuficientes</h3>
              <p className="text-muted-foreground">
                Crie mais eventos e aguarde confirmações para gerar insights comportamentais
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant={getConfidenceVariant(insight.confidence)}>
                          Confiança: {insight.confidence === 'high' ? 'Alta' : insight.confidence === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {insight.data_points} dados
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground">{insight.description}</p>
                  
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium mb-1">Recomendação:</h5>
                        <p className="text-sm text-muted-foreground">{insight.actionable_insight}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};