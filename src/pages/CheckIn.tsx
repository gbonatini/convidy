import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrReader } from 'react-qr-reader';
import { QrCode, Users, CheckCircle, Clock, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface Registration {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  checked_in: boolean;
  checkin_time: string | null;
  events: {
    title: string;
    date: string;
    time: string;
  };
}

interface CheckInStats {
  total: number;
  checkedIn: number;
  pending: number;
  percentage: number;
}

export default function CheckIn() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [stats, setStats] = useState<CheckInStats>({ total: 0, checkedIn: 0, pending: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [manualCpf, setManualCpf] = useState('');
  const [userCompanyId, setUserCompanyId] = useState<string>('');

  // Verificar autenticação e obter company_id
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase.from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        navigate('/setup');
        return;
      }

      setUserCompanyId(profile.company_id);
      loadData(profile.company_id);
    };

    checkAuth();
  }, [navigate]);

  // Carregar dados
  const loadData = async (companyId: string) => {
    try {
      setLoading(true);
      await Promise.all([
        loadEvents(companyId), 
        loadRegistrations(companyId)
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar eventos
  const loadEvents = async (companyId: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, date, time')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao carregar eventos:', error);
      return;
    }

    setEvents(data || []);
  };

  // Carregar registros
  const loadRegistrations = async (companyId: string, eventId?: string) => {
    let query = supabase
      .from('registrations')
      .select(`
        id, event_id, name, email, phone, document,
        checked_in, checkin_time,
        events!inner(title, date, time, company_id)
      `)
      .eq('events.company_id', companyId);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar registros:', error);
      return;
    }

    setRegistrations(data || []);
    calculateStats(data || []);
  };

  // Calcular estatísticas
  const calculateStats = (regs: Registration[]) => {
    const total = regs.length;
    const checkedIn = regs.filter(r => r.checked_in).length;
    const pending = total - checkedIn;
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    setStats({ total, checkedIn, pending, percentage });
  };

  // NOVA FUNÇÃO: Processar QR Code escaneado
  const handleQRScan = async (result: any) => {
    if (!result) return;

    try {
      console.log('[QR NOVA] Resultado do scanner:', result.text);
      
      // Decodificar QR Code base64
      const decoded = JSON.parse(atob(result.text));
      console.log('[QR NOVA] Dados decodificados:', decoded);

      // Extrair CPF do JSON - múltiplas formas de armazenamento
      const cpf = decoded.cpf || decoded.document;
      if (!cpf) {
        throw new Error('CPF não encontrado no QR Code');
      }

      console.log('[QR NOVA] CPF extraído:', cpf);
      await processCheckInNew(cpf);
      
    } catch (error) {
      console.error('[QR NOVA] Erro ao decodificar QR Code:', error);
      toast.error('QR Code inválido ou corrompido');
    }
  };

  // Check-in manual por CPF
  const handleManualCheckIn = async () => {
    if (!manualCpf.trim()) {
      toast.error('Digite o CPF');
      return;
    }

    const cleanCpf = manualCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    await processCheckInNew(cleanCpf);
    setManualCpf('');
  };

  // NOVA FUNÇÃO: Processar check-in usando funções do banco
  const processCheckInNew = async (cpf: string) => {
    console.log('[CHECKIN NOVA] Iniciando para CPF:', cpf);

    try {
      if (!userCompanyId) {
        toast.error('Erro: ID da empresa não encontrado');
        return;
      }

      // Buscar registro usando função do banco
      const { data: searchResult, error: searchError } = await supabase
        .rpc('checkin_by_cpf', {
          cpf_input: cpf,
          company_id_input: userCompanyId,
          event_id_input: selectedEventId || null
        });

      console.log('[CHECKIN NOVA] Resultado da busca:', { searchResult, searchError });

      if (searchError) {
        console.error('[CHECKIN NOVA] Erro na busca:', searchError);
        toast.error('Erro ao buscar registro');
        return;
      }

      if (!searchResult || searchResult.length === 0) {
        console.log('[CHECKIN NOVA] Nenhum registro encontrado');
        toast.error('CPF não encontrado nos registros desta empresa');
        return;
      }

      const participant = searchResult[0];
      console.log('[CHECKIN NOVA] Participante encontrado:', participant);

      // Verificar se já fez check-in
      if (participant.already_checked_in) {
        console.log('[CHECKIN NOVA] Check-in já realizado');
        const checkinDate = participant.checkin_time_existing 
          ? new Date(participant.checkin_time_existing).toLocaleString('pt-BR')
          : 'data não disponível';
        toast.warning(`Check-in já realizado para ${participant.participant_name} em ${checkinDate}`);
        return;
      }

      // Realizar check-in usando função do banco
      const { data: checkinResult, error: checkinError } = await supabase
        .rpc('perform_checkin', {
          registration_id_input: participant.registration_id,
          company_id_input: userCompanyId
        });

      console.log('[CHECKIN NOVA] Resultado do check-in:', { checkinResult, checkinError });

      if (checkinError) {
        console.error('[CHECKIN NOVA] Erro ao realizar check-in:', checkinError);
        toast.error('Erro ao realizar check-in');
        return;
      }

      if (!checkinResult) {
        console.log('[CHECKIN NOVA] Check-in não foi realizado (registro pode já ter sido processado)');
        toast.warning('Check-in não foi realizado. O registro pode já ter sido processado.');
        return;
      }

      console.log('[CHECKIN NOVA] Check-in realizado com sucesso!');
      toast.success(`✅ Check-in realizado para ${participant.participant_name}!`);
      
      // Fechar scanner e recarregar dados
      setShowScanner(false);
      loadRegistrations(userCompanyId, selectedEventId || undefined);

    } catch (error) {
      console.error('[CHECKIN NOVA] Erro geral:', error);
      toast.error('Erro no processo de check-in');
    }
  };

  // Máscara para CPF
  const maskCpf = (cpf: string) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-XX`;
    }
    return cpf;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
          <p className="text-muted-foreground">
            Gerencie o check-in dos participantes dos seus eventos
          </p>
        </div>

        {/* Filtro por evento */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="event-select">Evento</Label>
                <Select
                  value={selectedEventId}
                  onValueChange={(value) => {
                    setSelectedEventId(value === 'all' ? '' : value);
                    loadRegistrations(userCompanyId, value === 'all' ? undefined : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {new Date(event.date).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.percentage}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in */}
        <Card>
          <CardHeader>
            <CardTitle>Realizar Check-in</CardTitle>
            <CardDescription>
              Use o scanner de QR Code ou digite o CPF manualmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => setShowScanner(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                Scanner QR Code
              </Button>
            </div>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="manual-cpf">CPF Manual</Label>
                <Input
                  id="manual-cpf"
                  placeholder="Digite o CPF (apenas números)"
                  value={manualCpf}
                  onChange={(e) => setManualCpf(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
              </div>
              <Button onClick={handleManualCheckIn}>
                Check-in Manual
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de participantes */}
        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>
              Lista de todos os participantes registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.name}</TableCell>
                    <TableCell>{maskCpf(registration.document)}</TableCell>
                    <TableCell>{registration.events.title}</TableCell>
                    <TableCell>
                      <Badge variant={registration.checked_in ? "default" : "secondary"}>
                        {registration.checked_in ? 'Presente' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registration.checked_in && registration.checkin_time ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(registration.checkin_time).toLocaleString('pt-BR')}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => processCheckInNew(registration.document)}
                        >
                          Check-in
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Scanner QR Code Dialog */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scanner QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <QrReader
                  onResult={handleQRScan}
                  constraints={{ facingMode: 'environment' }}
                />
              </div>
              <Button onClick={() => setShowScanner(false)} className="w-full">
                Fechar Scanner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}