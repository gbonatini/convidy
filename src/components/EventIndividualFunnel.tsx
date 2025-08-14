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
              <div key={event.id} className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl p-6 space-y-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                {/* Header do Evento */}
                <div className="flex items-start justify-between animate-fade-in">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xl text-foreground">{event.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getEventDate(event.date, event.time)}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                {/* Funil Visual em Formato de Funil */}
                <div className="relative py-2">
                  {/* Convites - Topo do Funil (mais largo) */}
                  <div className="relative animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    <div 
                      className="mx-auto bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 relative overflow-hidden"
                      style={{
                        width: '200px',
                        height: '50px',
                        clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)',
                        borderRadius: '6px 6px 0 0'
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Send className="h-4 w-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{event.invites}</span>
                          </div>
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Convites</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmações - Meio do Funil */}
                  <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
                    <div 
                      className="mx-auto bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 relative overflow-hidden"
                      style={{
                        width: '140px',
                        height: '45px',
                        clipPath: 'polygon(8% 0%, 92% 0%, 80% 100%, 20% 100%)',
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-lg font-bold text-green-700 dark:text-green-300">{event.confirmations}</span>
                          </div>
                          <div className="text-xs font-medium text-green-600 dark:text-green-400">Confirmações</div>
                        </div>
                      </div>
                    </div>
                    {/* Taxa de Conversão */}
                    <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        event.invites > 0 && (event.confirmations / event.invites) * 100 >= 50
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : (event.confirmations / event.invites) * 100 >= 25
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {event.invites > 0 ? Math.round((event.confirmations / event.invites) * 100) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Check-ins - Base do Funil (mais estreito) */}
                  <div className="relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
                    <div 
                      className="mx-auto bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 relative overflow-hidden"
                      style={{
                        width: '80px',
                        height: '40px',
                        clipPath: 'polygon(15% 0%, 85% 0%, 75% 100%, 25% 100%)',
                        borderRadius: '0 0 6px 6px'
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <UserCheck className="h-4 w-4 text-orange-600" />
                            <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{event.checkins}</span>
                          </div>
                          <div className="text-xs font-medium text-orange-600 dark:text-orange-400">Check-ins</div>
                        </div>
                      </div>
                    </div>
                    {/* Taxa de Presença */}
                    <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        event.confirmations > 0 && (event.checkins / event.confirmations) * 100 >= 70
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : (event.checkins / event.confirmations) * 100 >= 40
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {event.confirmations > 0 ? Math.round((event.checkins / event.confirmations) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estatísticas em Cards */}
                <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  {/* Taxa de Conversão Geral */}
                  <div className="bg-background/60 border border-border/50 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200">
                    <div className="text-sm text-muted-foreground mb-1">Conversão Total</div>
                    <div className="text-2xl font-bold text-primary">
                      {event.invites > 0 ? Math.round((event.checkins / event.invites) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Convites → Check-ins</div>
                  </div>
                  
                  {/* Ocupação */}
                  <div className="bg-background/60 border border-border/50 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200">
                    <div className="text-sm text-muted-foreground mb-1">Ocupação</div>
                    <div className="text-2xl font-bold text-warning">
                      {event.capacity > 0 ? Math.round((event.confirmations / event.capacity) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">{event.confirmations}/{event.capacity} lugares</div>
                  </div>
                </div>

                {/* Barra de Progresso da Ocupação */}
                <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Capacidade do Evento</span>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {event.confirmations}/{event.capacity}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={event.capacity > 0 ? (event.confirmations / event.capacity) * 100 : 0} 
                      className="h-4 bg-muted"
                    />
                    {/* Indicador de lotação */}
                    {event.capacity > 0 && (event.confirmations / event.capacity) * 100 >= 90 && (
                      <div className="absolute top-0 right-2 transform -translate-y-1">
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                          {(event.confirmations / event.capacity) * 100 >= 100 ? 'Lotado!' : 'Quase Lotado!'}
                        </div>
                      </div>
                    )}
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