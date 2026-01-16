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
  Loader2,
  CheckCircle,
  BarChart3,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

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
  capacity: number;
  price: number;
  image_url: string | null;
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
  const [showQRCode, setShowQRCode] = useState(false);
  const [eventCapacityStatus, setEventCapacityStatus] = useState<{[key: string]: {current: number, isFull: boolean}}>({});
  const qrCodeRef = useRef<HTMLDivElement>(null);

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

  const checkEventsCapacity = async (eventsData: Event[]) => {
    const capacityPromises = eventsData.map(async (event) => {
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', event.id)
        .eq('status', 'confirmed');
      
      if (error) {
        console.error('Erro ao verificar capacidade do evento:', event.id, error);
        return { eventId: event.id, current: 0, isFull: false };
      }
      
      const currentCount = registrations?.length || 0;
      const isFull = currentCount >= event.capacity;
      
      return { eventId: event.id, current: currentCount, isFull };
    });
    
    const results = await Promise.all(capacityPromises);
    const capacityStatus: {[key: string]: {current: number, isFull: boolean}} = {};
    
    results.forEach(result => {
      capacityStatus[result.eventId] = {
        current: result.current,
        isFull: result.isFull
      };
    });
    
    setEventCapacityStatus(capacityStatus);
  };

  const fetchCompanyAndEvents = async () => {
    try {
      console.log('Slug capturado (raw -> normalizado):', slug, '->', safeSlug);
      
      // Buscar empresa pelo slug via função segura (apenas campos públicos)
      let companyData: any = null;
      let companyError: any = null;

      const { data: companyRows, error: err1 } = await supabase
        .rpc('get_company_public', { p_slug: safeSlug });
      companyError = err1;
      companyData = Array.isArray(companyRows) ? companyRows[0] : companyRows;

      // Fallback: tentar com o slug original caso a normalização difira
      if (!companyData && slug && slug !== safeSlug) {
        const { data: altRows, error: err2 } = await supabase
          .rpc('get_company_public', { p_slug: slug });
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
        
        // Verificar capacidade de cada evento
        if (eventsData && eventsData.length > 0) {
          checkEventsCapacity(eventsData);
        }
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
    return timeString?.slice(0, 5) || '';
  };

  const generatePDF = async (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Capturar QR Code como imagem
    const qrCodeElement = document.querySelector('.qr-code-for-pdf svg') as SVGElement;
    let qrCodeDataUrl = '';
    
    if (qrCodeElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(qrCodeElement);
      const img = new Image();
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = 200;
          canvas.height = 200;
          ctx?.drawImage(img, 0, 0, 200, 200);
          qrCodeDataUrl = canvas.toDataURL('image/png');
          resolve();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
    }

    let currentY = 15;

    // Header com fundo azul
    const headerY = currentY || 0;
    const headerHeight = currentY > 0 ? 30 : 40;
    doc.setFillColor(59, 130, 246);
    doc.rect(0, headerY, pageWidth, headerHeight, 'F');
    
    // Título "INGRESSO"
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INGRESSO', pageWidth / 2, headerY + (headerHeight / 2) + 4, { align: 'center' });
    
    currentY = headerY + headerHeight + 15;

    // Nome do participante
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.name, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    
    // CPF formatado
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const cpfFormatted = data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    doc.text(`CPF: ${cpfFormatted}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;
    
    // QR Code
    if (qrCodeDataUrl) {
      const qrSize = 55;
      const qrX = (pageWidth - qrSize) / 2;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, currentY, qrSize, qrSize);
      currentY += qrSize + 5;
    }
    
    // Texto do QR
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Apresente este QR Code no check-in', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Linha separadora tracejada
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(15, currentY, pageWidth - 15, currentY);
    doc.setLineDashPattern([], 0);
    currentY += 8;
    
    // Título do evento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(data.eventTitle, pageWidth - 40);
    doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
    currentY += (titleLines.length * 6) + 4;
    
    // Organizador
    if (data.companyName) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Organizado por: ${data.companyName}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
    }
    
    // Caixa de informações
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, currentY, pageWidth - 30, 35, 3, 3, 'F');
    
    // Informações do evento
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    const eventDate = new Date(data.eventDate + 'T12:00:00');
    const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const formattedTime = data.eventTime?.slice(0, 5) || '';
    
    const infoY = currentY + 10;
    doc.text(`Data: ${formattedDate}`, 22, infoY);
    doc.text(`Horario: ${formattedTime}`, 22, infoY + 8);
    
    const locationText = `Local: ${data.eventLocation}`;
    const locationLines = doc.splitTextToSize(locationText, pageWidth - 50);
    doc.text(locationLines, 22, infoY + 16);
    
    currentY += 42;
    
    // Descrição do evento (se existir)
    if (data.eventDescription) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Sobre o evento:', 15, currentY);
      currentY += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(data.eventDescription, pageWidth - 30);
      // Limitar a 6 linhas para não estourar a página
      const limitedDescLines = descLines.slice(0, 6);
      doc.text(limitedDescLines, 15, currentY);
      currentY += (limitedDescLines.length * 4) + 10;
    }
    


    // Rodapé
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Gerado por Convidy - Sistema de Gestao de Eventos', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Salvar
    const fileName = `ingresso-${data.eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "PDF gerado!",
      description: "Seu ingresso foi baixado com sucesso.",
    });
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
      
      // Verificar capacidade do evento antes de confirmar
      const { data: currentRegistrations, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', selectedEvent.id)
        .eq('status', 'confirmed');
      
      if (countError) {
        console.error('Erro ao verificar capacidade:', countError);
        throw new Error('Erro ao verificar capacidade do evento');
      }
      
      const currentCount = currentRegistrations?.length || 0;
      if (currentCount >= selectedEvent.capacity) {
        toast({
          variant: "destructive",
          title: "Evento lotado",
          description: `Este evento já atingiu sua capacidade máxima de ${selectedEvent.capacity} participantes.`,
        });
        return;
      }
      
      // Normalizar CPF removendo pontuação e traços
      const normalizedDocument = formData.document.replace(/\D/g, '');
      
      const insertData = {
        event_id: selectedEvent.id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        cpf: normalizedDocument,
        status: 'confirmed' as const
      };

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
        description: "Sua presença foi confirmada com sucesso!",
      });

      console.log('Fechando modal de confirmação...');
      setSelectedEvent(null); // Fechar o modal de confirmação imediatamente
      
      // Atualizar a capacidade do evento em tempo real
      setEventCapacityStatus(prev => {
        const updated = { ...prev };
        if (updated[selectedEvent.id]) {
          updated[selectedEvent.id] = {
            current: updated[selectedEvent.id].current + 1,
            isFull: (updated[selectedEvent.id].current + 1) >= selectedEvent.capacity
          };
        }
        return updated;
      });
      
      // Mostrar QR Code com todas informações do evento
      setRegistrationData({ 
        cpf: normalizedDocument,
        name: formData.name,
        eventTitle: selectedEvent.title,
        eventDate: selectedEvent.date,
        eventTime: selectedEvent.time,
        eventLocation: selectedEvent.location,
        eventDescription: selectedEvent.description,
        eventImageUrl: selectedEvent.image_url,
        companyName: company?.name || ''
      });
      setShowQRCode(true);
      
      // Limpar formulário
      setFormData({ name: '', document: '', phone: '', email: '' });

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
                      
                      {event.price > 0 && (
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">R$ {event.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {(() => {
                      const capacityInfo = eventCapacityStatus[event.id];
                      const isEventFull = capacityInfo?.isFull || false;
                      const currentCount = capacityInfo?.current || 0;
                      
                      return (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full" 
                              onClick={() => setSelectedEvent(event)}
                              disabled={isEventFull}
                              variant={isEventFull ? "outline" : "default"}
                            >
                              {isEventFull ? (
                                <>
                                  <Users className="mr-2 h-4 w-4" />
                                  Evento Lotado
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirmar Presença
                                </>
                              )}
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
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* QR Code Modal */}
      <Dialog open={showQRCode} onOpenChange={(open) => {
        if (!open) {
          setShowQRCode(false);
          setRegistrationData(null);
        }
      }}>
        <DialogContent className="w-[90vw] sm:max-w-[450px] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Confirmação Realizada!
            </DialogTitle>
          </DialogHeader>
          
          {registrationData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="text-center" ref={qrCodeRef}>
                <div className="bg-white p-3 rounded-lg border-2 inline-block shadow-sm qr-code-for-pdf">
                  <QRCodeSVG 
                    value={registrationData.cpf}
                    size={160}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="mt-2 text-sm font-medium">{registrationData.name}</p>
              </div>

              {/* Informações do Evento - Compacto */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <h4 className="font-semibold text-center">{registrationData.eventTitle}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(registrationData.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{formatTime(registrationData.eventTime)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{registrationData.eventLocation}</span>
                </div>
              </div>
              
              {/* Botões */}
              <div className="space-y-2">
                <Button 
                  onClick={() => generatePDF(registrationData)} 
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF do Ingresso
                </Button>
                
                <Button onClick={() => {
                  setShowQRCode(false);
                  setRegistrationData(null);
                }} className="w-full" variant="secondary">
                  Fechar
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Apresente o QR Code no check-in do evento
              </p>
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
