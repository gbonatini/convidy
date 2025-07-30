import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Edit,
  Trash2,
  Eye,
  Clock,
  Settings
} from 'lucide-react';
import { EventForm } from '@/components/EventForm';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  capacity: number;
  price: number;
  status: string;
  image_url?: string;
  created_at: string;
  registrations?: { count: number }[];
}

const Events = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  useEffect(() => {
    if (profile?.company_id) {
      fetchEvents();
    }
  }, [profile]);

  const fetchEvents = async () => {
    if (!profile?.company_id) return;

    try {
      setLoadingEvents(true);
      console.log('Buscando eventos para company_id:', profile.company_id);

      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations(count)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Eventos carregados:', eventsData);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os eventos.",
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleEventCreated = () => {
    setIsCreateDialogOpen(false);
    fetchEvents();
    toast({
      title: "Evento criado com sucesso!",
      description: "Seu evento foi criado e já está disponível para confirmações.",
    });
  };

  const handleEventUpdated = () => {
    console.log('Evento atualizado, fechando modal e recarregando eventos...');
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
    // Aumentar o delay e forçar uma nova consulta
    setTimeout(() => {
      console.log('Recarregando eventos após atualização...');
      fetchEvents();
    }, 1000);
    toast({
      title: "Evento atualizado com sucesso!",
      description: "As alterações foram salvas.",
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      fetchEvents();
      toast({
        title: "Evento excluído com sucesso!",
        description: "O evento foi removido permanentemente.",
      });
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o evento.",
      });
    }
  };

  const formatDate = (date: string) => {
    // Usar diretamente a string da data sem conversão para evitar problemas de fuso horário
    const [year, month, day] = date.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading || loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Gerenciar Eventos</h1>
            <p className="text-muted-foreground">
              Crie e gerencie os eventos da sua empresa
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo Evento</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
                <DialogDescription>
                  Preencha as informações do seu evento
                </DialogDescription>
              </DialogHeader>
              <EventForm
                onSuccess={handleEventCreated}
                companyId={profile?.company_id || ''}
              />
            </DialogContent>
          </Dialog>
        </div>
        {events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Nenhum evento encontrado</h3>
                <p className="text-muted-foreground">
                  Que tal criar seu primeiro evento? É rápido e fácil!
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Evento</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do seu evento
                    </DialogDescription>
                  </DialogHeader>
                  <EventForm
                    onSuccess={handleEventCreated}
                    companyId={profile?.company_id || ''}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Imagem do evento */}
                {event.image_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status === 'active' ? 'Ativo' : 
                           event.status === 'completed' ? 'Finalizado' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.date)} às {formatTime(event.time)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {event.registrations?.[0]?.count || 0} / {event.capacity} confirmações
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                   <div className="flex items-center justify-end pt-2">
                     <div className="flex items-center space-x-2">
                      {/* Botão Ver Confirmações */}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Link to={`/confirmations?event=${event.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Ver</span>
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              Altere as informações do evento
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <EventForm
              event={selectedEvent}
              onSuccess={handleEventUpdated}
              companyId={profile?.company_id || ''}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Events;