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
              <div key={event.id} className="border border-border rounded-lg p-4 space-y-4">
                {/* Header do Evento */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-lg">{event.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getEventDate(event.date, event.time)}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                {/* Estatísticas Rápidas */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-muted-foreground">{event.invites}</div>
                    <div className="text-xs text-muted-foreground">Convites</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-info">{event.confirmations}</div>
                    <div className="text-xs text-muted-foreground">Confirmações</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-warning">{event.checkins}</div>
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {event.invites > 0 ? Math.round((event.confirmations / event.invites) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Taxa Conversão</div>
                  </div>
                </div>

                {/* Funil Visual */}
                <div className="grid grid-cols-3 gap-4">
                  {funnelSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isFirst = index === 0;
                    const conversionRate = isFirst ? 100 : step.percentage;
                    
                    return (
                      <div key={index} className="text-center space-y-2">
                        <div className={`mx-auto w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                          step.completed 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted-foreground bg-muted/10'
                        }`}>
                          <Icon 
                            className={`h-5 w-5 ${
                              step.completed ? 'text-primary' : 'text-muted-foreground'
                            }`} 
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium">{step.name}</div>
                          <div className={`text-lg font-bold ${
                            step.completed ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {step.value}
                          </div>
                          {!isFirst && (
                            <div className="text-xs text-muted-foreground">
                              {conversionRate}% do anterior
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barra de Progresso da Ocupação */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ocupação do Evento</span>
                    <span className="font-semibold">
                      {event.confirmations}/{event.capacity}
                    </span>
                  </div>
                  <Progress 
                    value={event.capacity > 0 ? (event.confirmations / event.capacity) * 100 : 0} 
                    className="h-2"
                  />
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