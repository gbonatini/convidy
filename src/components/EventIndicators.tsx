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
    eventsByMonth: Array<{
      month: string;
      events: number;
      registrations: number;
    }>;
  };
}
const EventIndicators: React.FC<EventIndicatorsProps> = ({
  stats
}) => {
  const indicators = [{
    title: 'Taxa de Ocupação Média',
    value: `${stats.averageOccupancy}%`,
    description: 'Capacidade utilizada nos eventos',
    icon: Users,
    trend: stats.averageOccupancy >= 70 ? 'positive' : stats.averageOccupancy >= 50 ? 'neutral' : 'negative',
    color: stats.averageOccupancy >= 70 ? 'success' : stats.averageOccupancy >= 50 ? 'warning' : 'destructive'
  }, {
    title: 'Crescimento Mensal',
    value: `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth}%`,
    description: 'Variação vs. mês anterior',
    icon: TrendingUp,
    trend: stats.monthlyGrowth > 0 ? 'positive' : stats.monthlyGrowth === 0 ? 'neutral' : 'negative',
    color: stats.monthlyGrowth > 0 ? 'success' : stats.monthlyGrowth === 0 ? 'warning' : 'destructive'
  }, {
    title: 'Eventos por Mês',
    value: `${(stats.totalEvents / 12).toFixed(1)}`,
    description: 'Média mensal de eventos',
    icon: Calendar,
    trend: 'neutral',
    color: 'info'
  }, {
    title: 'Tempo Médio Resposta',
    value: '2.3h',
    description: 'Até confirmação de presença',
    icon: Clock,
    trend: 'positive',
    color: 'success'
  }];
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
  const chartData = stats.eventsByMonth || [{
    month: 'Jan',
    events: 4,
    registrations: 120
  }, {
    month: 'Fev',
    events: 6,
    registrations: 180
  }, {
    month: 'Mar',
    events: 8,
    registrations: 240
  }, {
    month: 'Abr',
    events: 5,
    registrations: 150
  }, {
    month: 'Mai',
    events: 7,
    registrations: 210
  }, {
    month: 'Jun',
    events: 9,
    registrations: 270
  }];
  return <div className="space-y-6">
      {/* Indicadores Principais */}
      

      {/* Gráficos de Tendência */}
      
    </div>;
};
export default EventIndicators;