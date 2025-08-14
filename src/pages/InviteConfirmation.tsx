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
  primary_color?: string;
  secondary_color?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  capacity: number;
  status: string;
}

interface Invite {
  id: string;
  full_name: string;
  cpf: string;
  whatsapp: string;
  email?: string;
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
    if (registrationData && registrationData.qr_code && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, registrationData.qr_code, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 5
        });
      } catch (error) {
        console.error('Erro ao gerar código de barras:', error);
      }
    }
  }, [registrationData]);

  const fetchInviteData = async () => {
    try {
      console.log('🔍 Buscando dados do convite...');
      console.log('Slug:', slug);
      console.log('InviteId:', inviteId);
      
      // Buscar empresa
      const { data: companyData, error: companyError } = await supabase
        .rpc('get_company_public', { company_slug: slug });

      console.log('Empresa encontrada:', companyData);
      console.log('Erro da empresa:', companyError);

      if (companyError || !companyData) {
        throw new Error('Empresa não encontrada');
      }

      const company = Array.isArray(companyData) ? companyData[0] : companyData;
      setCompany(company);

      console.log('🏢 Empresa definida:', company);

      // Buscar convite usando função pública
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('get_invite_public', { invite_uuid: inviteId });

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
      const invite = {
        id: inviteRow.id,
        full_name: inviteRow.full_name,
        cpf: inviteRow.cpf,
        whatsapp: inviteRow.whatsapp,
        email: inviteRow.email,
        status: inviteRow.status,
        event_id: inviteRow.event_id,
        company_id: inviteRow.company_id
      };

      const event = {
        id: inviteRow.event_id,
        title: inviteRow.event_title,
        date: inviteRow.event_date,
        time: inviteRow.event_time,
        location: inviteRow.event_location,
        address: inviteRow.event_address,
        capacity: inviteRow.event_capacity,
        status: inviteRow.event_status
      };

      setInvite(invite);
      setEvent(event);

      console.log('✅ Convite carregado:', invite);
      console.log('📅 Evento carregado:', event);

      // Verificar se já foi confirmado - buscar registro existente
      const { data: existingRegistration } = await supabase
        .rpc('get_registration_public', {
          event_uuid: invite.event_id,
          document_text: invite.cpf,
          phone_text: invite.whatsapp
        });

      if (existingRegistration) {
        const regData = Array.isArray(existingRegistration) ? existingRegistration[0] : existingRegistration;
        setRegistrationData(regData);
      } else {
        // Se não foi confirmado, confirmar automaticamente
        await autoConfirm(invite, event);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message || 'Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const autoConfirm = async (inviteData: Invite, eventData: Event) => {
    console.log('🚀 Iniciando confirmação automática...');
    console.log('Dados do convite:', inviteData);
    console.log('Dados do evento:', eventData);
    
    if (registrationData) {
      console.log('✅ Já existe registro, não confirmando novamente');
      return; // Já confirmado
    }

    setConfirming(true);
    
    try {
      console.log('🔍 Verificando se o evento está ativo...');
      // Verificar se o evento ainda está ativo
      if (eventData.status !== 'active') {
        console.log('❌ Evento não está ativo:', eventData.status);
        throw new Error('Este evento não está mais ativo');
      }
      console.log('✅ Evento está ativo');

      console.log('📊 Verificando capacidade do evento...');
      // Verificar capacidade do evento
      const { data: currentRegistrations, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', eventData.id)
        .eq('status', 'confirmed');

      console.log('Registros atuais:', currentRegistrations);
      console.log('Erro na contagem:', countError);

      if (countError) {
        console.log('❌ Erro ao verificar capacidade:', countError);
        throw new Error('Erro ao verificar capacidade do evento');
      }

      const currentCount = currentRegistrations?.length || 0;
      console.log(`📈 Capacidade: ${currentCount}/${eventData.capacity}`);
      
      if (currentCount >= eventData.capacity) {
        console.log('🚫 Evento lotado!');
        throw new Error(`Este evento já atingiu sua capacidade máxima de ${eventData.capacity} participantes`);
      }

      console.log('💾 Criando registro de confirmação...');
      // Criar registro de confirmação
      const { error: insertError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventData.id,
          name: inviteData.full_name,
          email: inviteData.email || `${inviteData.whatsapp}@temp.com`,
          phone: inviteData.whatsapp,
          document: inviteData.cpf,
          document_type: 'cpf',
          status: 'confirmed'
        });

      console.log('Erro na inserção:', insertError);

      if (insertError) {
        console.log('❌ Erro na inserção detalhado:', insertError);
        if (insertError.code === '23505') {
          console.log('🔄 Registro duplicado detectado, buscando existente...');
          // Já existe registro - buscar dados existentes
          const { data: existingReg } = await supabase
            .rpc('get_registration_public', {
              event_uuid: eventData.id,
              document_text: inviteData.cpf,
              phone_text: inviteData.whatsapp
            });

          console.log('Registro existente encontrado:', existingReg);

          if (existingReg) {
            const regData = Array.isArray(existingReg) ? existingReg[0] : existingReg;
            setRegistrationData(regData);
            
            // Atualizar status do convite para confirmed
            await supabase
              .from('invites')
              .update({ status: 'confirmed' })
              .eq('id', inviteData.id);

            console.log('🎉 Confirmação já existia!');

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            toast({
              title: "🎉 Presença já confirmada!",
              description: "Sua presença já estava confirmada para este evento.",
            });
            return;
          }
        }
        console.log('❌ Erro definitivo na inserção');
        throw insertError;
      }

      console.log('✅ Registro criado com sucesso!');

      // Buscar dados do registro criado
      console.log('🔍 Buscando dados do registro criado...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar processamento

      const { data: newRegistration } = await supabase
        .rpc('get_registration_public', {
          event_uuid: eventData.id,
          document_text: inviteData.cpf,
          phone_text: inviteData.whatsapp
        });

      console.log('Novo registro encontrado:', newRegistration);

      if (newRegistration) {
        const regData = Array.isArray(newRegistration) ? newRegistration[0] : newRegistration;
        setRegistrationData(regData);

        // Atualizar status do convite para confirmed
        await supabase
          .from('invites')
          .update({ status: 'confirmed' })
          .eq('id', inviteData.id);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast({
          title: "🎉 Presença confirmada!",
          description: "Sua presença foi confirmada com sucesso!",
        });
      } else {
        throw new Error('Erro ao obter dados da confirmação');
      }

    } catch (error: any) {
      console.error('Erro na confirmação automática:', error);
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "CPF já confirmado",
          description: "Este CPF já foi usado para confirmar presença neste evento.",
        });
      } else {
        setError(error.message || 'Erro ao confirmar presença automaticamente');
        toast({
          variant: "destructive",
          title: "Erro na confirmação",
          description: error.message || "Erro ao confirmar presença automaticamente.",
        });
      }
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (timeString: string) => {
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
                    Olá {invite.full_name}, sua presença foi confirmada com sucesso!
                  </CardDescription>
                </>
              ) : (
                <>
                  <Clock className="h-16 w-16 mx-auto mb-4 text-orange-500" />
                  <CardTitle>Confirmando...</CardTitle>
                  <CardDescription>
                    Processando sua confirmação de presença
                  </CardDescription>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Detalhes do evento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{event.title}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(event.time)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{company.name}</span>
                </div>
              </div>

              {event.address && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Endereço:</strong> {event.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Código de barras para check-in */}
          {registrationData && registrationData.qr_code && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Código de Barras para Check-in</CardTitle>
                <CardDescription className="text-center">
                  Apresente este código no dia do evento para fazer o check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <canvas 
                    ref={barcodeRef}
                    className="max-w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nome:</strong> {registrationData.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Código:</strong> {registrationData.qr_code}
                  </p>
                </div>

                <Button onClick={downloadBarcode} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar Código de Barras
                </Button>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Dica:</strong> Salve este código ou tire uma captura de tela. 
                    Você precisará dele no dia do evento para fazer o check-in rapidamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão para voltar */}
          <div className="text-center">
            <Button 
              onClick={() => navigate(`/${slug}`)} 
              variant="outline"
              className="gap-2"
            >
              Ver Outros Eventos de {company.name}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InviteConfirmation;