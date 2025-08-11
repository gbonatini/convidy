import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';

interface EventIndicatorsProps {
  stats: {
    totalEvents: number;
    totalRegistrations: number;
    totalCheckins: number;
    attendanceRate: number;
    averageOccupancy: number;
    monthlyGrowth: number;
    eventsByMonth: Array<{ month: string; events: number; registrations: number }>;
  };
}

const EventIndicators: React.FC<EventIndicatorsProps> = ({ stats }) => {
  const indicators = [
    {
      title: 'Taxa de Ocupação Média',
      value: `${stats.averageOccupancy}%`,
      description: 'Capacidade utilizada nos eventos',
      icon: Users,
      trend: stats.averageOccupancy >= 70 ? 'positive' : stats.averageOccupancy >= 50 ? 'neutral' : 'negative',
      color: stats.averageOccupancy >= 70 ? 'success' : stats.averageOccupancy >= 50 ? 'warning' : 'destructive',
    },
    {
      title: 'Crescimento Mensal',
      value: `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth}%`,
      description: 'Variação vs. mês anterior',
      icon: TrendingUp,
      trend: stats.monthlyGrowth > 0 ? 'positive' : stats.monthlyGrowth === 0 ? 'neutral' : 'negative',
      color: stats.monthlyGrowth > 0 ? 'success' : stats.monthlyGrowth === 0 ? 'warning' : 'destructive',
    },
    {
      title: 'Eventos por Mês',
      value: `${(stats.totalEvents / 12).toFixed(1)}`,
      description: 'Média mensal de eventos',
      icon: Calendar,
      trend: 'neutral',
      color: 'info',
    },
    {
      title: 'Tempo Médio Resposta',
      value: '2.3h',
      description: 'Até confirmação de presença',
      icon: Clock,
      trend: 'positive',
      color: 'success',
    },
  ];

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <Badge variant="outline" className="text-success border-success">Positivo</Badge>;
      case 'negative':
        return <Badge variant="outline" className="text-destructive border-destructive">Atenção</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning">Estável</Badge>;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'destructive':
        return 'text-destructive';
      case 'info':
        return 'text-info';
      default:
        return 'text-foreground';
    }
  };

  // Dados para o gráfico temporal
  const chartData = stats.eventsByMonth || [
    { month: 'Jan', events: 4, registrations: 120 },
    { month: 'Fev', events: 6, registrations: 180 },
    { month: 'Mar', events: 8, registrations: 240 },
    { month: 'Abr', events: 5, registrations: 150 },
    { month: 'Mai', events: 7, registrations: 210 },
    { month: 'Jun', events: 9, registrations: 270 },
  ];

  return (
    <div className="space-y-6">
      {/* Indicadores Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 ${getColorClass(indicator.color)}`} />
                  {getTrendBadge(indicator.trend)}
                </div>
                <div className={`text-2xl font-bold ${getColorClass(indicator.color)}`}>
                  {indicator.value}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{indicator.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {indicator.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos de Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Eventos */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Evolução de Eventos</CardTitle>
            <CardDescription>
              Número de eventos criados por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Confirmações por Mês */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Confirmações por Mês</CardTitle>
            <CardDescription>
              Volume de confirmações de presença
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="registrations"
                    fill="hsl(var(--success))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventIndicators;