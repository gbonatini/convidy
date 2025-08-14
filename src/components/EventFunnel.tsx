import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart, Funnel, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';

interface EventFunnelProps {
  stats: {
    totalEvents: number;
    activeEvents: number;
    eventsWithConfirmations: number;
    eventsWithCheckins: number;
  };
}

const EventFunnel: React.FC<EventFunnelProps> = ({ stats }) => {
  const funnelData = [
    {
      name: 'Eventos Criados',
      value: stats.totalEvents,
      color: 'hsl(var(--primary))',
    },
    {
      name: 'Eventos Ativos',
      value: stats.activeEvents,
      color: 'hsl(var(--success))',
    },
    {
      name: 'Com Confirmações',
      value: stats.eventsWithConfirmations,
      color: 'hsl(var(--info))',
    },
    {
      name: 'Com Check-ins',
      value: stats.eventsWithCheckins,
      color: 'hsl(var(--warning))',
    },
  ];

  // Calcular taxas de conversão
  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round((current / previous) * 100);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-primary">{data.value} eventos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Funil de Eventos</span>
        </CardTitle>
        <CardDescription>
          Visualize a jornada dos seus eventos desde a criação até o check-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Funil Visual */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList position="center" fontSize={12} fontWeight="bold" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          {/* Métricas de Conversão */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {getConversionRate(stats.activeEvents, stats.totalEvents)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Taxa de Ativação
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {getConversionRate(stats.eventsWithConfirmations, stats.activeEvents)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Taxa de Confirmação
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {getConversionRate(stats.eventsWithCheckins, stats.eventsWithConfirmations)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Taxa de Presença
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventFunnel;