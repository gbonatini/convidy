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
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const Confirmations = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const eventFilter = searchParams.get('event');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    fetchCompanyAndRegistrations();
  }, []);

  const fetchCompanyAndRegistrations = async () => {
    try {
      // Buscar perfil do usuário para obter company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Buscar dados da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', profile.company_id)
        .single();

      setCompany(companyData);

      // Buscar confirmações com dados dos eventos
      let query = supabase
        .from('registrations')
        .select(`
          *,
          events:event_id (
            id,
            title,
            date,
            time,
            location
          )
        `)
        .eq('events.company_id', profile.company_id)
        .order('created_at', { ascending: false });

      // Filtrar por evento específico se especificado na URL
      if (eventFilter) {
        query = query.eq('event_id', eventFilter);
      }

      const { data: registrationsData, error } = await query;

      if (error) throw error;

      // Reformatar dados para o tipo esperado
      const formattedRegistrations = registrationsData?.map(reg => ({
        ...reg,
        event: reg.events
      })) || [];

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

  const filteredRegistrations = registrations.filter(reg =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatCreatedAt = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

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

        {/* Busca */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email ou evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
          <div className="grid gap-4">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{registration.name}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{registration.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{registration.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={registration.checked_in ? "default" : "secondary"}>
                        {registration.checked_in ? "Check-in feito" : "Confirmado"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRegistration(registration)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRegistration(registration.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{registration.event.title}</p>
                        <p className="text-muted-foreground">
                          {formatDate(registration.event.date)} às {formatTime(registration.event.time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{registration.event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Confirmado em {formatCreatedAt(registration.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {registration.document_type?.toUpperCase()}: {registration.document}
                    </span>
                  </div>
                </CardContent>
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