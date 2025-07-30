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
  CheckCircle,
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCompanyAndEvents();
    }
  }, [slug]);

  const fetchCompanyAndEvents = async () => {
    try {
      console.log('Slug capturado:', slug);
      
      // Buscar empresa pelo slug
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      console.log('Resultado da busca da empresa:', { companyData, companyError });

      if (companyError) throw companyError;
      if (!companyData) {
        throw new Error('Empresa não encontrada');
      }
      
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
    
    console.log('Iniciando handleSubmit...');
    console.log('Dados do formulário:', formData);
    console.log('Evento selecionado:', selectedEvent);
    
    if (!formData.name || !formData.document || !formData.phone) {
      console.log('Campos obrigatórios não preenchidos');
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    if (!validateCPF(formData.document)) {
      console.log('CPF inválido');
      toast({
        variant: "destructive",
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido com 11 dígitos.",
      });
      return;
    }

    if (!selectedEvent) {
      console.log('Nenhum evento selecionado');
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = {
        event_id: selectedEvent.id,
        name: formData.name,
        email: formData.email || `${formData.phone.replace(/\D/g, '')}@temp.com`,
        phone: formData.phone,
        document: formData.document.replace(/\D/g, ''),
        document_type: 'cpf',
        qr_code: '', // Will be generated by trigger
        status: 'confirmed'
      } as any;

      console.log('Tentando inserir registro:', insertData);

      const { data, error } = await supabase
        .from('registrations')
        .insert([insertData])
        .select();

      console.log('Resultado da inserção:', { data, error });

      if (error) {
        console.error('Erro na inserção:', error);
        throw error;
      }

      console.log('Registro inserido com sucesso!', data);

      // Efeito de confetti para celebrar!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Aguardar um momento para o trigger gerar o QR code e buscar novamente
      setTimeout(async () => {
        const { data: updatedData } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', data[0].id)
          .single();
        
        if (updatedData?.qr_code) {
          setRegistrationData(updatedData);
          setShowQRCode(true);
        }
      }, 1000);

      toast({
        title: "🎉 Confirmação realizada!",
        description: "Sua presença foi confirmada com sucesso! Você receberá mais informações em breve.",
      });

      // Limpar formulário 
      setFormData({ name: '', document: '', phone: '', email: '' });

    } catch (error: any) {
      console.error('Erro ao confirmar presença:', error);
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Já confirmado",
          description: "Este CPF já foi usado para confirmar presença neste evento.",
        });
      } else if (error.message?.includes('RLS')) {
        toast({
          variant: "destructive",
          title: "Erro de permissão",
          description: "Não é possível confirmar presença neste evento no momento.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao confirmar presença",
          description: error.message || "Tente novamente em alguns instantes.",
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
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`Logo ${company.name}`}
                  className="h-20 max-w-xs object-contain border shadow-sm rounded-lg"
                />
              ) : (
                <>
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold">{company.name}</h1>
                </>
              )}
            </div>
            {company.description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {company.description}
              </p>
            )}
            
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
                <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                          🟢 Confirmações Abertas
                        </Badge>
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

      {/* QR Code Modal */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Seu QR Code de Check-in
            </DialogTitle>
            <DialogDescription>
              Guarde este QR Code para fazer check-in no evento
            </DialogDescription>
          </DialogHeader>
          
          {registrationData && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <QRCodeSVG 
                    value={registrationData.qr_code} 
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                
                {/* Registration Info */}
                <div className="text-sm space-y-2 text-left bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold">Dados da Confirmação:</h4>
                  <p><strong>Nome:</strong> {registrationData.name}</p>
                  <p><strong>Evento:</strong> {selectedEvent?.title}</p>
                  <p><strong>Data:</strong> {selectedEvent && formatDate(selectedEvent.date)}</p>
                  <p><strong>Horário:</strong> {selectedEvent && formatTime(selectedEvent.time)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    // Download QR Code as image
                    const svg = document.querySelector('svg');
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const link = document.createElement('a');
                        link.download = `qr-code-${registrationData.name}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      };
                      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                    }
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar QR Code
                </Button>
                
                <Button 
                  onClick={() => setShowQRCode(false)}
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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