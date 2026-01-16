import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  Loader2, 
  Calendar, 
  MapPin, 
  Clock,
  Building,
  Download,
  AlertCircle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  status: string;
}

interface Invite {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email?: string | null;
  status: string;
  event_id: string;
  company_id: string;
}

const InviteConfirmation = () => {
  const { slug, inviteId } = useParams();
  const navigate = useNavigate();
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug && inviteId) {
      fetchInviteData();
    }
  }, [slug, inviteId]);

  // Gerar código de barras quando registrationData estiver disponível
  useEffect(() => {
    if (registrationData && registrationData.cpf) {
      console.log('📊 Tentando gerar código de barras para CPF:', registrationData.cpf);
      
      // Aguardar o canvas estar renderizado no DOM
      const generateBarcode = () => {
        if (barcodeRef.current) {
          try {
            console.log('🎯 Canvas encontrado, gerando código de barras...');
            
            // Limpar o canvas
            const canvas = barcodeRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            // Usar o CPF limpo do registro
            const cleanCpf = registrationData.cpf.replace(/[^0-9]/g, '');
            
            if (!cleanCpf || cleanCpf.length === 0) {
              throw new Error('CPF inválido para gerar código de barras');
            }
            
            console.log('📋 Gerando código de barras com CPF:', cleanCpf);
            
            // Gerar o código de barras
            JsBarcode(barcodeRef.current, cleanCpf, {
              format: "CODE128",
              width: 2,
              height: 40,
              displayValue: true,
              fontSize: 10,
              margin: 5
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
          console.log('⏳ Canvas ainda não disponível, tentando novamente em 100ms...');
          // Tentar novamente após um pequeno delay
          setTimeout(generateBarcode, 100);
        }
      };
      
      // Aguardar um pouco para o modal estar completamente renderizado
      setTimeout(generateBarcode, 100);
    }
  }, [registrationData]);

  const fetchInviteData = async () => {
    try {
      console.log('🔍 Buscando dados do convite...');
      console.log('Slug:', slug);
      console.log('InviteId:', inviteId);
      
      // Buscar empresa
      const { data: companyData, error: companyError } = await supabase
        .rpc('get_company_public', { p_slug: slug });

      console.log('Empresa encontrada:', companyData);
      console.log('Erro da empresa:', companyError);

      if (companyError || !companyData || companyData.length === 0) {
        throw new Error('Empresa não encontrada');
      }

      const companyRow = Array.isArray(companyData) ? companyData[0] : companyData;
      setCompany(companyRow);

      console.log('🏢 Empresa definida:', companyRow);

      // Buscar convite usando função pública
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('get_invite_public', { p_invite_id: inviteId });

      console.log('📧 Dados do convite (função pública):', inviteData);
      console.log('❌ Erro do convite:', inviteError);

      if (inviteError) {
        console.error('Erro detalhado do convite:', inviteError);
        throw new Error(`Erro ao buscar convite: ${inviteError.message}`);
      }

      if (!inviteData || inviteData.length === 0) {
        throw new Error('Convite não encontrado');
      }

      const inviteRow = Array.isArray(inviteData) ? inviteData[0] : inviteData;
      
      // Mapear dados da função para os objetos esperados
      const inviteObj: Invite = {
        id: inviteRow.id,
        name: inviteRow.name,
        cpf: null, // Not returned by function
        phone: null, // Not returned by function
        email: null, // Not returned by function
        status: inviteRow.status,
        event_id: '', // Not returned by function
        company_id: ''
      };

      const eventObj: Event = {
        id: '',
        title: inviteRow.event_title,
        date: inviteRow.event_date,
        time: inviteRow.event_time,
        location: inviteRow.event_location,
        capacity: 0,
        status: 'active'
      };

      setInvite(inviteObj);
      setEvent(eventObj);

      console.log('✅ Convite carregado:', inviteObj);
      console.log('📅 Evento carregado:', eventObj);

      // Se já confirmado, mostrar como confirmado
      if (inviteRow.status === 'confirmed') {
        setRegistrationData({ name: inviteRow.name });
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message || 'Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  const downloadBarcode = () => {
    if (barcodeRef.current) {
      const link = document.createElement('a');
      link.download = `checkin-${event?.title || 'evento'}.png`;
      link.href = barcodeRef.current.toDataURL();
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company || !event || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Convite não encontrado</h1>
          <p className="text-muted-foreground">
            O convite solicitado não foi encontrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card de status */}
          <Card>
            <CardHeader className="text-center">
              {confirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
                  <CardTitle>Confirmando presença...</CardTitle>
                  <CardDescription>
                    Aguarde enquanto confirmamos sua presença automaticamente
                  </CardDescription>
                </>
              ) : registrationData ? (
                <>
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <CardTitle className="text-green-700">🎉 Presença Confirmada!</CardTitle>
                  <CardDescription>
                    Olá {invite.name}, sua presença foi confirmada com sucesso!
                  </CardDescription>
                </>
              ) : (
                <>
                  <Building className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <CardTitle>Convite para {event.title}</CardTitle>
                  <CardDescription>
                    {company.name} convida você para este evento
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Detalhes do evento */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(event.time)}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Código de barras se confirmado */}
              {registrationData && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Apresente este código no dia do evento para fazer check-in
                  </p>
                  <div className="flex justify-center">
                    <canvas ref={barcodeRef} className="max-w-full" />
                  </div>
                  <Button variant="outline" onClick={downloadBarcode}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Código
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InviteConfirmation;
