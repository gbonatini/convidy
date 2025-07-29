import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Building,
  Phone,
  Mail,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Company {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
}

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
  image_url: string;
  status: string;
  company_id: string;
}

const CompanyPublic = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (slug) {
      fetchCompanyAndEvents();
    }
  }, [slug]);

  const fetchCompanyAndEvents = async () => {
    try {
      // Buscar empresa pelo slug
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (companyError) throw companyError;
      
      setCompany(companyData);

      // Buscar eventos da empresa
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('status', 'active')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date');

      if (eventsError) throw eventsError;
      
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Empresa não encontrada",
        description: "A empresa solicitada não foi encontrada ou não está ativa.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.document || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    if (!validateCPF(formData.document)) {
      toast({
        variant: "destructive",
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido com 11 dígitos.",
      });
      return;
    }

    if (!selectedEvent) return;

    setIsSubmitting(true);

    try {
      // Gerar QR Code único
      const qrCode = `${selectedEvent.id.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Tentando inserir registro:', {
        event_id: selectedEvent.id,
        name: formData.name,
        email: formData.email || `${formData.phone.replace(/\D/g, '')}@temp.com`,
        phone: formData.phone,
        document: formData.document.replace(/\D/g, ''),
        document_type: 'cpf',
        qr_code: qrCode,
        status: 'confirmed'
      });

      const { data, error } = await supabase
        .from('registrations')
        .insert([{
          event_id: selectedEvent.id,
          name: formData.name,
          email: formData.email || `${formData.phone.replace(/\D/g, '')}@temp.com`,
          phone: formData.phone,
          document: formData.document.replace(/\D/g, ''),
          document_type: 'cpf',
          qr_code: qrCode,
          status: 'confirmed'
        }])
        .select();

      console.log('Resultado da inserção:', { data, error });

      if (error) {
        console.error('Erro na inserção:', error);
        throw error;
      }

      // Efeito de confetti para celebrar!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "🎉 Confirmação realizada!",
        description: "Sua presença foi confirmada com sucesso! Você receberá mais informações em breve.",
      });

      // Limpar formulário e fechar modal
      setFormData({ name: '', document: '', phone: '', email: '' });
      setSelectedEvent(null);

    } catch (error: any) {
      console.error('Erro ao confirmar presença:', error);
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Já confirmado",
          description: "Este CPF já foi usado para confirmar presença neste evento.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao confirmar presença",
          description: "Tente novamente em alguns instantes.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
          <p className="text-muted-foreground">
            A empresa solicitada não foi encontrada ou não está ativa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
            </div>
            {company.description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {company.description}
              </p>
            )}
            
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
              {company.email && (
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{company.email}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{company.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Events Section */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Próximos Eventos</h2>
            <p className="text-muted-foreground">
              Confira os eventos disponíveis e confirme sua presença
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento disponível</h3>
              <p className="text-muted-foreground">
                Não há eventos programados no momento. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="secondary">Confirmações Abertas</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.description && (
                      <CardDescription>{event.description}</CardDescription>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(event.time)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Capacidade: {event.capacity} pessoas</span>
                      </div>
                      
                      {event.price > 0 && (
                        <div className="text-lg font-semibold text-primary">
                          R$ {event.price.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={() => setSelectedEvent(event)}
                        >
                          Confirmar Presença
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Presença</DialogTitle>
                          <DialogDescription>
                            Preencha seus dados para confirmar presença no evento: {event.title}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="Seu nome completo"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="document">CPF *</Label>
                            <Input
                              id="document"
                              name="document"
                              placeholder="000.000.000-00"
                              value={formData.document}
                              onChange={handleInputChange}
                              maxLength={14}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp *</Label>
                            <Input
                              id="phone"
                              name="phone"
                              placeholder="(11) 99999-9999"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email (opcional)</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="seu@email.com"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar Presença
                              </>
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Convidy</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CompanyPublic;