import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
  BarChart3,
  Download
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Company {
  id: string;
  name: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  slug: string;
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
  const normalizeSlug = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-') // normaliza traços unicode para hífen
    .replace(/[^a-z0-9-]/g, '-') // remove outros caracteres
    .replace(/-+/g, '-') // colapsa múltiplos hifens
    .replace(/^-|-$/g, ''); // remove hifens nas pontas
  const safeSlug = slug ? normalizeSlug(decodeURIComponent(slug)) : '';
  const navigate = useNavigate();
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
  const [showBarcode, setShowBarcode] = useState(false);
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  // Redireciona para a versão normalizada da URL (evita 404 por traço/unicode)
  useEffect(() => {
    if (slug && safeSlug && slug !== safeSlug) {
      navigate('/' + safeSlug, { replace: true });
    }
  }, [slug, safeSlug, navigate]);

  useEffect(() => {
    if (safeSlug) {
      fetchCompanyAndEvents();
    }
  }, [safeSlug]);

  // Gerar código de barras quando registrationData estiver disponível
  useEffect(() => {
    if (registrationData && barcodeRef.current && showBarcode) {
      try {
        console.log('=== GERANDO CÓDIGO DE BARRAS ===');
        console.log('Dados da inscrição para barcode:', registrationData);
        console.log('qr_code value:', registrationData.qr_code);
        console.log('Canvas ref:', barcodeRef.current);
        console.log('showBarcode:', showBarcode);
        
        let barcodeValue = registrationData.qr_code;
        
        // Verificar se o qr_code existe e não está vazio
        if (!barcodeValue) {
          console.error('QR Code está vazio ou nulo');
          // Gerar código simples: CPF + primeiros 8 chars do event_id
          const cleanDocument = formData.document.replace(/[^0-9]/g, '');
          const eventIdShort = registrationData.event_id.replace(/-/g, '').substring(0, 8);
          barcodeValue = cleanDocument + eventIdShort;
          console.log('Código gerado como fallback:', barcodeValue);
        }
        
        // Se o qr_code ainda for o formato JSON antigo (base64), gerar novo código simples
        if (barcodeValue && (barcodeValue.startsWith('eyJ') || barcodeValue.includes('{'))) {
          console.log('Detectado formato antigo, gerando novo código de barras...');
          // Gerar código simples: CPF + primeiros 8 chars do event_id
          const cleanDocument = formData.document.replace(/[^0-9]/g, '');
          const eventIdShort = registrationData.event_id.replace(/-/g, '').substring(0, 8);
          barcodeValue = cleanDocument + eventIdShort;
          console.log('Novo código gerado:', barcodeValue);
        }
        
        console.log('Valor final do barcode:', barcodeValue);
        console.log('Tipo do valor:', typeof barcodeValue);
        console.log('Comprimento do valor:', barcodeValue?.length);
        
        if (!barcodeValue || barcodeValue.length === 0) {
          throw new Error('Valor do código de barras está vazio');
        }
        
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 10
        });
        
        console.log('✅ Barcode gerado com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao gerar código de barras:', error);
        
        // Fallback: mostrar mensagem de erro no canvas
        if (barcodeRef.current) {
          const ctx = barcodeRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, barcodeRef.current.width, barcodeRef.current.height);
            ctx.font = '12px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText('Erro ao gerar código', 10, 30);
          }
        }
      }
    } else {
      console.log('Condições não atendidas para gerar barcode:', {
        hasRegistrationData: !!registrationData,
        hasCanvas: !!barcodeRef.current,
        showBarcode
      });
    }
  }, [registrationData, showBarcode, formData.document]);

  const fetchCompanyAndEvents = async () => {
    try {
      console.log('Slug capturado (raw -> normalizado):', slug, '->', safeSlug);
      
      // Buscar empresa pelo slug via função segura (apenas campos públicos)
      let companyData: any = null;
      let companyError: any = null;

      const { data: companyRows, error: err1 } = await (supabase as any)
        .rpc('get_company_public', { company_slug: safeSlug });
      companyError = err1;
      companyData = Array.isArray(companyRows) ? companyRows[0] : companyRows;

      // Fallback: tentar com o slug original caso a normalização difira
      if (!companyData && slug && slug !== safeSlug) {
        const { data: altRows, error: err2 } = await (supabase as any)
          .rpc('get_company_public', { company_slug: slug });
        if (!companyError) companyError = err2;
        const altData = Array.isArray(altRows) ? altRows[0] : altRows;
        if (altData) companyData = altData;
      }

      console.log('Resultado da busca da empresa (pública):', { companyData, companyError });

      if (companyError) throw companyError;
      if (!companyData) {
        throw new Error('Empresa não encontrada');
      }
      
      setCompany(companyData as Company);

      // Buscar eventos da empresa (tratar erros separadamente para não confundir com empresa inexistente)
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('status', 'active')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date');

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      } catch (evErr) {
        console.warn('Falha ao carregar eventos, exibindo página da empresa mesmo assim.', evErr);
        setEvents([]);
      }
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
      console.log('=== INÍCIO DA CONFIRMAÇÃO ===');
      console.log('Evento selecionado:', selectedEvent);
      console.log('Dados do formulário:', formData);
      
      // Normalizar CPF removendo pontuação e traços
      const normalizedDocument = formData.document.replace(/\D/g, '');
      
      const insertData = {
        event_id: selectedEvent.id,
        name: formData.name,
        email: formData.email || `${formData.phone.replace(/\D/g, '')}@temp.com`,
        phone: formData.phone,
        document: normalizedDocument,
        document_type: 'cpf',
        qr_code: '', // Will be generated by trigger
        status: 'confirmed'
      } as any;

      console.log('Dados para inserção:', insertData);

      console.log('Tentando inserir registro:', insertData);

      const { error } = await supabase
        .from('registrations')
        .insert([insertData]);

      console.log('Inserção concluída. Sem retorno de dados devido às políticas RLS.', { error });

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
        description: "Aguarde... gerando seu código de barras de check-in!",
      });

      console.log('Fechando modal de confirmação...');
      setSelectedEvent(null); // Fechar o modal de confirmação imediatamente
      
      console.log('Limpando formulário...');
      setFormData({ name: '', document: '', phone: '', email: '' });

      // Buscar o registro via função segura (sem SELECT público)
      const fetchBarcode = async () => {
        const { data: regRow, error: regErr } = await (supabase as any).rpc('get_registration_public', {
          event_uuid: selectedEvent.id,
          document_text: normalizedDocument,
          phone_text: formData.phone,
        });
        return { regRow, regErr };
      };

      const { regRow, regErr } = await fetchBarcode();
      if (regErr || !regRow) {
        console.log('Código de barras não disponível imediatamente, tentando novamente...', regErr);
        await new Promise((r) => setTimeout(r, 400));
        const { regRow: regRow2, regErr: regErr2 } = await fetchBarcode();
        if (regErr2 || !regRow2) {
          console.error('Erro ao obter código de barras após retry:', regErr2);
          toast({
            variant: "destructive",
            title: "Erro ao gerar código de barras",
            description: "Registro salvo, mas houve problema ao gerar código de barras.",
          });
        } else {
          console.log('Código de barras obtido no retry:', regRow2);
          setRegistrationData(Array.isArray(regRow2) ? regRow2[0] : regRow2);
          setShowBarcode(true);
        }
      } else {
        console.log('Código de barras obtido:', regRow);
        console.log('Código de barras value:', Array.isArray(regRow) ? regRow[0]?.qr_code : regRow?.qr_code);
        setRegistrationData(Array.isArray(regRow) ? regRow[0] : regRow);
        setShowBarcode(true);
      }

    } catch (error: any) {
      console.error('=== ERRO NA CONFIRMAÇÃO ===');
      console.error('Erro completo:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Detalhes do erro:', error.details);
      
      if (error.code === '23505') {
        console.log('Erro de constraint única detectado');
        if (error.message?.includes('registrations_event_document_unique')) {
          toast({
            variant: "destructive",
            title: "CPF já confirmado",
            description: "Este CPF já foi usado para confirmar presença neste evento.",
          });
        } else if (error.message?.includes('registrations_event_id_email_key')) {
          toast({
            variant: "destructive", 
            title: "Email já usado",
            description: "Este email já foi usado para confirmar presença neste evento.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Registro duplicado", 
            description: "Já existe uma confirmação para estes dados neste evento.",
          });
        }
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
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`Logo ${company.name}`}
                  className="h-16 sm:h-20 max-w-xs object-contain border shadow-sm rounded-lg"
                />
              ) : (
                <>
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{company.name}</h1>
                </>
              )}
            </div>
            {company.description && (
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                {company.description}
              </p>
            )}
            
          </div>
        </div>
      </header>

      {/* Events Section */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2 px-4">
            <h2 className="text-xl sm:text-2xl font-bold">Próximos Eventos</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  
                  <CardHeader className="pb-3">
                    <div className="flex flex-col space-y-2">
                      <CardTitle className="text-base sm:text-lg leading-tight">{event.title}</CardTitle>
                      <Badge variant="success" className="self-start text-xs">
                        🟢 Confirmações Abertas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {event.description && (
                      <CardDescription className="text-sm line-clamp-2">{event.description}</CardDescription>
                    )}
                    
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{formatDate(event.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span>{formatTime(event.time)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">Capacidade: {event.capacity} pessoas</span>
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

      {/* Código de Barras Modal */}
      <Dialog open={showBarcode} onOpenChange={setShowBarcode}>
        <DialogContent className="w-[90vw] sm:max-w-[400px] p-6">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Confirmação Realizada!
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Sua presença foi confirmada com sucesso. Use o código de barras abaixo para o check-in no evento.
            </p>
          </DialogHeader>
          
          {registrationData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 inline-block shadow-sm">
                  <canvas 
                    ref={barcodeRef}
                    className="max-w-full"
                  />
                </div>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                Salve ou imprima este código de barras para apresentar no evento
              </div>
              
              <Button onClick={() => setShowBarcode(false)} className="w-full">
                Fechar
              </Button>
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
