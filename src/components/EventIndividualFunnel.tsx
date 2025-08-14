import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, CheckCircle, TrendingUp, Target, Clock, Send, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  capacity: number;
  status: string;
  invites: number;
  confirmations: number;
  checkins: number;
  created_at: string;
}

interface EventIndividualFunnelProps {
  companyId: string;
}

const EventIndividualFunnel: React.FC<EventIndividualFunnelProps> = ({ companyId }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsData();
  }, [companyId]);

  const fetchEventsData = async () => {
    try {
      // Buscar eventos da empresa
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, time, capacity, status, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(6); // Mostrar os 6 eventos mais recentes

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Buscar convites, confirmações e check-ins para cada evento
      const eventsWithStats = await Promise.all(
        eventsData.map(async (event) => {
          // Buscar convites
          const { data: invitesData, error: invitesError } = await supabase
            .from('invites')
            .select('id')
            .eq('event_id', event.id);

          // Buscar confirmações
          const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('checked_in')
            .eq('event_id', event.id);

          if (regError) throw regError;

          const invites = invitesData?.length || 0;
          const confirmations = registrations?.length || 0;
          const checkins = registrations?.filter(r => r.checked_in).length || 0;

          return {
            ...event,
            invites,
            confirmations,
            checkins,
          };
        })
      );

      setEvents(eventsWithStats);
    } catch (error) {
      console.error('Erro ao carregar dados dos eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEventFunnel = (event: EventData) => {
    const steps = [
      {
        name: 'Convites',
        value: event.invites,
        percentage: 100, // Base do funil
        icon: Send,
        color: 'hsl(var(--muted-foreground))',
        completed: event.invites > 0,
      },
      {
        name: 'Confirmações',
        value: event.confirmations,
        percentage: event.invites > 0 ? Math.round((event.confirmations / event.invites) * 100) : 0,
        icon: Users,
        color: 'hsl(var(--info))',
        completed: event.confirmations > 0,
      },
      {
        name: 'Check-ins',
        value: event.checkins,
        percentage: event.confirmations > 0 ? Math.round((event.checkins / event.confirmations) * 100) : 0,
        icon: UserCheck,
        color: 'hsl(var(--warning))',
        completed: event.checkins > 0,
      },
    ];

    return steps;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-success border-success">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Inativo</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning">Rascunho</Badge>;
    }
  };

  const getEventDate = (date: string, time: string) => {
    try {
      const eventDate = new Date(`${date}T${time}`);
      return format(eventDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Carregando funil de eventos...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Funil por Evento</CardTitle>
          <CardDescription>
            Nenhum evento encontrado para análise
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Funil por Evento</span>
        </CardTitle>
        <CardDescription>
          Acompanhe a jornada de conversão de cada evento individual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event) => {
            const funnelSteps = calculateEventFunnel(event);
            
            return (
              <div key={event.id} className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                {/* Header do Evento */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xl text-foreground">{event.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getEventDate(event.date, event.time)}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                {/* Funil Visual Melhorado */}
                <div className="relative">
                  <div className="grid grid-cols-3 gap-6">
                    {funnelSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isFirst = index === 0;
                      const conversionRate = isFirst ? 100 : step.percentage;
                      
                      return (
                        <div key={index} className="relative flex flex-col items-center space-y-3">
                          {/* Linha de conexão */}
                          {index < funnelSteps.length - 1 && (
                            <div className="absolute top-6 left-full w-6 h-0.5 bg-gradient-to-r from-primary/30 to-muted-foreground/30 z-0" />
                          )}
                          
                          {/* Ícone do Step */}
                          <div className={`relative z-10 w-16 h-16 rounded-full border-3 flex items-center justify-center shadow-lg transition-all duration-300 ${
                            step.completed 
                              ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 scale-110' 
                              : 'border-muted-foreground/30 bg-muted/10'
                          }`}>
                            <Icon 
                              className={`h-6 w-6 ${
                                step.completed ? 'text-primary' : 'text-muted-foreground'
                              }`} 
                            />
                          </div>
                          
                          {/* Conteúdo do Step */}
                          <div className="text-center space-y-1">
                            <div className="text-sm font-semibold text-foreground">{step.name}</div>
                            <div className={`text-2xl font-bold ${
                              step.completed ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {step.value}
                            </div>
                            {!isFirst && (
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                conversionRate >= 50 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : conversionRate >= 25 
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {conversionRate}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estatísticas em Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Taxa de Conversão Geral */}
                  <div className="bg-background/60 border border-border/50 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Taxa de Conversão</div>
                    <div className="text-2xl font-bold text-primary">
                      {event.invites > 0 ? Math.round((event.confirmations / event.invites) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Convites → Confirmações</div>
                  </div>
                  
                  {/* Taxa de Presença */}
                  <div className="bg-background/60 border border-border/50 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Taxa de Presença</div>
                    <div className="text-2xl font-bold text-warning">
                      {event.confirmations > 0 ? Math.round((event.checkins / event.confirmations) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confirmações → Check-ins</div>
                  </div>
                </div>

                {/* Barra de Progresso da Ocupação */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Ocupação do Evento</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {event.confirmations}/{event.capacity}
                      </Badge>
                      <span className="text-sm font-bold text-primary">
                        {event.capacity > 0 ? Math.round((event.confirmations / event.capacity) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={event.capacity > 0 ? (event.confirmations / event.capacity) * 100 : 0} 
                      className="h-3 bg-muted"
                    />
                    {/* Linha de capacidade máxima */}
                    <div className="absolute top-0 right-0 w-0.5 h-3 bg-destructive/60" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventIndividualFunnel;