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

  // Gerar código de barras quando registrationData estiver disponível (igual ao CompanyPublic)
  useEffect(() => {
    if (registrationData && registrationData.document) {
      console.log('📊 Tentando gerar código de barras para CPF:', registrationData.document);
      
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
            const cleanDocument = registrationData.document.replace(/[^0-9]/g, '');
            
            if (!cleanDocument || cleanDocument.length === 0) {
              throw new Error('CPF inválido para gerar código de barras');
            }
            
            console.log('📋 Gerando código de barras com CPF:', cleanDocument);
            
            // Gerar o código de barras
            JsBarcode(barcodeRef.current, cleanDocument, {
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
      console.log('🔍 Verificando se já existe registro de confirmação...');
      console.log('Parâmetros da busca:', {
        event_uuid: invite.event_id,
        document_text: invite.cpf,
        phone_text: invite.whatsapp
      });
      
      const { data: existingRegistration, error: regError } = await supabase
        .rpc('get_registration_public', {
          event_uuid: invite.event_id,
          document_text: invite.cpf,
          phone_text: invite.whatsapp
        });

      console.log('📋 Registro existente encontrado:', existingRegistration);
      console.log('❌ Erro na busca do registro:', regError);

      if (existingRegistration && existingRegistration.length > 0) {
        console.log('✅ Registro já existe, usando dados existentes');
        const regData = Array.isArray(existingRegistration) ? existingRegistration[0] : existingRegistration;
        setRegistrationData(regData);
      } else {
        console.log('🚀 Registro não existe, iniciando confirmação automática...');
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
      console.log('=== INÍCIO DA CONFIRMAÇÃO AUTOMÁTICA ===');
      console.log('Evento selecionado:', eventData);
      console.log('Dados do convite:', inviteData);
      
      // Verificar capacidade do evento antes de confirmar
      const { data: currentRegistrations, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', eventData.id)
        .eq('status', 'confirmed');
      
      if (countError) {
        console.error('Erro ao verificar capacidade:', countError);
        throw new Error('Erro ao verificar capacidade do evento');
      }
      
      const currentCount = currentRegistrations?.length || 0;
      if (currentCount >= eventData.capacity) {
        toast({
          variant: "destructive",
          title: "Evento lotado",
          description: `Este evento já atingiu sua capacidade máxima de ${eventData.capacity} participantes.`,
        });
        return;
      }
      
      // Normalizar CPF removendo pontuação e traços
      const normalizedDocument = inviteData.cpf.replace(/\D/g, '');
      
      const insertData = {
        event_id: eventData.id,
        name: inviteData.full_name,
        email: inviteData.email || `${inviteData.whatsapp.replace(/\D/g, '')}@temp.com`,
        phone: inviteData.whatsapp,
        document: normalizedDocument,
        document_type: 'cpf',
        qr_code: '', // Will be generated by trigger
        status: 'confirmed'
      } as any;

      console.log('Dados para inserção:', insertData);

      const { error } = await supabase
        .from('registrations')
        .insert([insertData]);

      console.log('Inserção concluída. Sem retorno de dados devido às políticas RLS.', { error });

      if (error) {
        console.error('Erro na inserção:', error);
        
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
          return;
        } else if (error.message?.includes('RLS')) {
          toast({
            variant: "destructive",
            title: "Erro de permissão",
            description: "Não é possível confirmar presença neste evento no momento.",
          });
          return;
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao confirmar presença",
            description: error.message || "Tente novamente em alguns instantes.",
          });
          return;
        }
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

      console.log('Confirmação automática bem-sucedida!');
      
      // Buscar o registro via função segura (sem SELECT público)
      const fetchBarcode = async () => {
        const { data: regRow, error: regErr } = await (supabase as any).rpc('get_registration_public', {
          event_uuid: eventData.id,
          document_text: normalizedDocument,
          phone_text: inviteData.whatsapp,
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
          const regData = Array.isArray(regRow2) ? regRow2[0] : regRow2;
          setRegistrationData({ ...regData, document: normalizedDocument });
        }
      } else {
        console.log('Código de barras obtido:', regRow);
        console.log('Código de barras value:', Array.isArray(regRow) ? regRow[0]?.qr_code : regRow?.qr_code);
        const regData = Array.isArray(regRow) ? regRow[0] : regRow;
        setRegistrationData({ ...regData, document: normalizedDocument });
      }

      // Atualizar status do convite para confirmed
      await supabase
        .from('invites')
        .update({ status: 'confirmed' })
        .eq('id', inviteData.id);

    } catch (error: any) {
      console.error('=== ERRO NA CONFIRMAÇÃO AUTOMÁTICA ===');
      console.error('Erro completo:', error);
      
      setError(error.message || 'Erro ao confirmar presença automaticamente');
      toast({
        variant: "destructive",
        title: "Erro na confirmação",
        description: error.message || "Erro ao confirmar presença automaticamente.",
      });
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
                    <strong>CPF:</strong> {registrationData.document}
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