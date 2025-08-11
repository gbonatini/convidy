import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getConfirmationStatusBadge, getCheckinStatusBadge } from '@/lib/status';
import { 
  Users, 
  Search, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  UserCheck,
  Clock,
  Mail,
  Phone,
  FileText,
  Send,
  CheckCircle,
  UserX,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmationFilters } from '@/components/ConfirmationFilters';

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  document_type: string;
  status: string;
  checked_in: boolean;
  checkin_time: string | null;
  created_at: string;
  qr_code: string;
  event?: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
  } | null;
}

interface Company {
  id: string;
  name: string;
}

interface Invite {
  id: string;
  full_name: string;
  cpf: string;
  whatsapp: string;
  email?: string;
  status: string;
  created_at: string;
  event_id: string;
}

const Confirmations = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const eventFilter = searchParams.get('event');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchCompanyAndRegistrations();
  }, []);

  // Real-time subscription for registrations
  useEffect(() => {
    const channel = supabase
      .channel('confirmations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations'
        },
        () => {
          console.log('Registration updated, refetching...');
          fetchCompanyAndRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompanyAndRegistrations = async () => {
    try {
      console.log('Iniciando fetchCompanyAndRegistrations...');
      
      // Buscar perfil do usuário para obter company_id
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuário:', user);
      
      if (!user) {
        console.log('Usuário não encontrado');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      console.log('Profile:', { profile, profileError });

      if (!profile?.company_id) {
        console.log('company_id não encontrado no profile');
        return;
      }

      // Buscar dados da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', profile.company_id)
        .single();

      console.log('Dados da empresa:', companyData);
      setCompany(companyData);

      // Primeiro, buscar todos os eventos da empresa
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, time, location')
        .eq('company_id', profile.company_id);

      console.log('Eventos da empresa:', { events, eventsError });

      if (eventsError) throw eventsError;

      setEvents(events || []);

      if (!events || events.length === 0) {
        console.log('Nenhum evento encontrado para esta empresa');
        setRegistrations([]);
        setInvites([]);
        return;
      }

      // Buscar convites da empresa para cruzamento de dados
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .eq('company_id', profile.company_id);

      console.log('Convites da empresa:', { invitesData, invitesError });
      if (!invitesError) {
        setInvites(invitesData || []);
      }

      // Buscar confirmações desses eventos
      const eventIds = events.map(e => e.id);
      let query = supabase
        .from('registrations')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      // Filtrar por evento específico se especificado na URL
      if (eventFilter) {
        query = query.eq('event_id', eventFilter);
      }

      const { data: registrationsData, error } = await query;

      console.log('Dados das confirmações:', { registrationsData, error });

      if (error) throw error;

      // Combinar dados de registrations com eventos
      const formattedRegistrations = registrationsData?.map(reg => {
        const eventData = events.find(e => e.id === reg.event_id);
        return {
          ...reg,
          event: eventData || { id: '', title: 'Evento não encontrado', date: '', time: '', location: '' }
        };
      }) || [];

      console.log('Confirmações formatadas:', formattedRegistrations);
      setRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Erro ao carregar confirmações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar confirmações",
        description: "Tente novamente em alguns instantes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      toast({
        title: "Confirmação excluída",
        description: "A confirmação foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir confirmação:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir confirmação",
        description: "Tente novamente em alguns instantes.",
      });
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    // Filtro de texto
    const matchesSearch = reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.event?.title && reg.event.title.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro de status
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    // Filtro de check-in
    const matchesCheckin = checkinFilter === 'all' || 
      (checkinFilter === 'checked_in' && reg.checked_in) ||
      (checkinFilter === 'pending' && !reg.checked_in);

    return matchesSearch && matchesStatus && matchesCheckin;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatCreatedAt = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Cálculos de indicadores com cruzamento de dados
  const normalizeDocument = (doc: string) => doc.replace(/\D/g, '');
  
  // Filtrar convites e confirmações por evento se especificado
  const filteredInvites = eventFilter 
    ? invites.filter(invite => invite.event_id === eventFilter)
    : invites;
  
  const filteredConfirmations = eventFilter
    ? registrations.filter(reg => reg.event?.id === eventFilter)
    : registrations;

  // Encontrar confirmações que vieram de convites (cross-reference por CPF)
  const confirmedFromInvites = filteredConfirmations.filter(reg => {
    const regDoc = normalizeDocument(reg.document);
    return filteredInvites.some(invite => normalizeDocument(invite.cpf) === regDoc);
  });

  // Convites que ainda não confirmaram
  const invitesNotConfirmed = filteredInvites.filter(invite => {
    const inviteDoc = normalizeDocument(invite.cpf);
    return !filteredConfirmations.some(reg => normalizeDocument(reg.document) === inviteDoc);
  });

  // Confirmações espontâneas (não vieram de convites)
  const spontaneousConfirmations = filteredConfirmations.filter(reg => {
    const regDoc = normalizeDocument(reg.document);
    return !filteredInvites.some(invite => normalizeDocument(invite.cpf) === regDoc);
  });

  // Taxa de conversão
  const conversionRate = filteredInvites.length > 0 
    ? (confirmedFromInvites.length / filteredInvites.length * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Users className="h-8 w-8 animate-pulse mx-auto" />
            <p className="text-muted-foreground">Carregando confirmações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {eventFilter ? 'Confirmações do Evento' : 'Confirmações'}
            </h1>
            <p className="text-muted-foreground">
              {eventFilter 
                ? `Gerencie as confirmações deste evento específico`
                : `Gerencie todas as confirmações de presença da ${company?.name}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {registrations.length} confirmações
            </Badge>
            {eventFilter && (
              <Button variant="outline" size="sm" asChild>
                <a href="/confirmations">Ver Todas</a>
              </Button>
            )}
          </div>
        </div>

        {/* Indicadores Importantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Confirmações</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredConfirmations.length}</div>
              <p className="text-xs text-muted-foreground">
                Pessoas confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vindos de Convites</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedFromInvites.length}</div>
              <p className="text-xs text-muted-foreground">
                De {filteredInvites.length} convites enviados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Convites → Confirmações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmações Espontâneas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spontaneousConfirmations.length}</div>
              <p className="text-xs text-muted-foreground">
                Não vieram de convites
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <ConfirmationFilters
          eventFilter={eventFilter || 'all'}
          statusFilter={statusFilter}
          checkinFilter={checkinFilter}
          searchTerm={searchTerm}
          onEventFilterChange={(eventId) => {
            // Atualizar URL se necessário
            if (eventId === 'all') {
              window.history.pushState({}, '', '/confirmations');
            } else {
              window.history.pushState({}, '', `/confirmations?event=${eventId}`);
            }
            fetchCompanyAndRegistrations();
          }}
          onStatusFilterChange={setStatusFilter}
          onCheckinFilterChange={setCheckinFilter}
          onSearchTermChange={setSearchTerm}
          events={events}
          registrations={registrations}
        />

        {/* Lista de Confirmações */}
        {filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma confirmação encontrada</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Nenhuma confirmação corresponde aos critérios de busca.' : 'Ainda não há confirmações de presença.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Seção do Convidado */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white font-semibold text-lg">
                        {registration.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm uppercase tracking-wide">Convidado</h4>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-bold text-xl text-foreground">{registration.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{registration.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">
                            CPF: {registration.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.$3-**')}
                          </span>
                        </div>
                        {registration.phone && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm text-muted-foreground">Tel: {registration.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seção do Evento */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-6 w-6 text-primary" />
                      <h4 className="font-semibold text-primary text-sm uppercase tracking-wide">Evento</h4>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg">{registration.event?.title || 'Evento não encontrado'}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium">{registration.event?.location || 'Local não disponível'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">
                              {registration.event?.date ? formatDate(registration.event.date) : 'Data não disponível'}
                            </div>
                            <div className="text-muted-foreground">
                              às {registration.event?.time ? formatTime(registration.event.time) : 'Horário não disponível'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção de Status e Ações */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="h-3 w-3 bg-primary rounded-full"></div>
                      </div>
                      <h4 className="font-semibold text-primary text-sm uppercase tracking-wide">Status & Ações</h4>
                    </div>
                    
                    <div className="space-y-4">
                       {/* Status Badges */}
                       <div className="space-y-2">
                         {getConfirmationStatusBadge(registration.status)}
                         {registration.checked_in && (
                           <div className="flex flex-col gap-1">
                             {getCheckinStatusBadge(registration.checked_in)}
                             <p className="text-xs text-muted-foreground">
                               em {formatCreatedAt(registration.checkin_time || '')}
                             </p>
                           </div>
                         )}
                       </div>

                      {/* Informações de tempo */}
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground">Confirmado em</p>
                        <p className="text-sm font-medium">{formatCreatedAt(registration.created_at)}</p>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRegistration(registration)}
                          className="w-full justify-start"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Informações
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRegistration(registration.id)}
                          className="w-full justify-start"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Confirmação
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Edição */}
        <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Confirmação</DialogTitle>
              <DialogDescription>
                Edite os dados da confirmação de {selectedRegistration?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  defaultValue={selectedRegistration?.name}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedRegistration?.email}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  defaultValue={selectedRegistration?.phone}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedRegistration(null)}>
                  Cancelar
                </Button>
                <Button>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Confirmations;