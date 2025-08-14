import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrReader } from 'react-qr-reader';
import { 
  QrCode, 
  Users, 
  CheckCircle, 
  Clock, 
  Percent, 
  Search,
  X,
  Camera,
  Smartphone,
  UserCheck
} from 'lucide-react';
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
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [stats, setStats] = useState<CheckInStats>({ total: 0, checkedIn: 0, pending: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [manualCpf, setManualCpf] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userCompanyId, setUserCompanyId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string>('');

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

  // Filtrar registros por termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRegistrations(registrations);
      return;
    }

    const filtered = registrations.filter(reg => 
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.document.includes(searchTerm.replace(/\D/g, '')) ||
      reg.events.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredRegistrations(filtered);
  }, [searchTerm, registrations]);

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
    setFilteredRegistrations(data || []);
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

  // Scanner QR Code melhorado
  const handleQRScan = async (result: any) => {
    if (!result) return;

    try {
      console.log('[QR SCANNER] Resultado:', result.text);
      setScannerError('');
      
      let cpf = '';
      
      // Tentar diferentes formatos de QR Code
      try {
        // Primeiro, tentar decodificar como Base64 + JSON
        const decoded = JSON.parse(atob(result.text));
        console.log('[QR SCANNER] Decodificado como JSON:', decoded);
        cpf = decoded.cpf || decoded.document;
      } catch (base64Error) {
        console.log('[QR SCANNER] Não é Base64, tentando JSON direto...');
        try {
          // Tentar como JSON direto
          const decoded = JSON.parse(result.text);
          console.log('[QR SCANNER] Decodificado como JSON direto:', decoded);
          cpf = decoded.cpf || decoded.document;
        } catch (jsonError) {
          console.log('[QR SCANNER] Não é JSON, usando texto direto...');
          // Se não for JSON, assumir que é o CPF direto
          cpf = result.text.replace(/\D/g, '');
        }
      }
      
      if (!cpf) {
        throw new Error('CPF não encontrado no QR Code');
      }

      console.log('[QR SCANNER] CPF extraído:', cpf);
      await processCheckIn(cpf);
      
    } catch (error) {
      console.error('[QR SCANNER] Erro:', error);
      setScannerError('QR Code inválido ou corrompido');
      toast.error('QR Code inválido');
    }
  };

  // Erro do scanner
  const handleScannerError = (error: any) => {
    console.error('[QR SCANNER] Erro do dispositivo:', error);
    setScannerError('Erro ao acessar câmera. Verifique as permissões.');
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

    await processCheckIn(cleanCpf);
    setManualCpf('');
  };

  // Processar check-in
  const processCheckIn = async (cpf: string) => {
    console.log('[CHECK-IN] Iniciando para CPF:', cpf);

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

      console.log('[CHECK-IN] Resultado da busca:', { searchResult, searchError });

      if (searchError) {
        console.error('[CHECK-IN] Erro na busca:', searchError);
        toast.error('Erro ao buscar registro');
        return;
      }

      if (!searchResult || searchResult.length === 0) {
        toast.error('CPF não encontrado nos registros desta empresa');
        return;
      }

      const participant = searchResult[0];

      // Verificar se já fez check-in
      if (participant.already_checked_in) {
        const checkinDate = participant.checkin_time_existing 
          ? new Date(participant.checkin_time_existing).toLocaleString('pt-BR')
          : 'data não disponível';
        toast.warning(`Check-in já realizado para ${participant.participant_name} em ${checkinDate}`);
        return;
      }

      // Realizar check-in
      const { data: checkinResult, error: checkinError } = await supabase
        .rpc('perform_checkin', {
          registration_id_input: participant.registration_id,
          company_id_input: userCompanyId
        });

      if (checkinError) {
        console.error('[CHECK-IN] Erro ao realizar check-in:', checkinError);
        toast.error('Erro ao realizar check-in');
        return;
      }

      if (!checkinResult) {
        toast.warning('Check-in não foi realizado. O registro pode já ter sido processado.');
        return;
      }

      toast.success(`✅ Check-in realizado para ${participant.participant_name}!`);
      
      // Fechar scanner e recarregar dados
      setShowScanner(false);
      loadRegistrations(userCompanyId, selectedEventId || undefined);

    } catch (error) {
      console.error('[CHECK-IN] Erro geral:', error);
      toast.error('Erro no processo de check-in');
    }
  };

  // Abrir scanner
  const openScanner = () => {
    setScannerError('');
    setShowScanner(true);
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

  // Máscara de entrada CPF
  const handleCpfInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setManualCpf(cleaned);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        {/* Header Mobile Optimized */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Check-in</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie o check-in dos participantes
          </p>
        </div>

        {/* Estatísticas Cards Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Presentes</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Taxa</CardTitle>
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.percentage}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Check-in Mobile */}
        <div className="space-y-4">
          {/* Filtro por evento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event-select" className="text-sm font-medium">Evento</Label>
                <Select
                  value={selectedEventId}
                  onValueChange={(value) => {
                    setSelectedEventId(value === 'all' ? '' : value);
                    loadRegistrations(userCompanyId, value === 'all' ? undefined : value);
                  }}
                >
                  <SelectTrigger className="mt-1">
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
              
              {/* Busca */}
              <div>
                <Label htmlFor="search" className="text-sm font-medium">Buscar participante</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, CPF ou evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-in Actions Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Realizar Check-in
              </CardTitle>
              <CardDescription className="text-sm">
                Use o scanner QR Code ou digite o CPF manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botões de Check-in Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={openScanner}
                  className="w-full h-12 text-base hover-scale"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Scanner QR Code
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleManualCheckIn}
                  className="w-full h-12 text-base hover-scale"
                  size="lg"
                  disabled={!manualCpf.trim()}
                >
                  <Smartphone className="mr-2 h-5 w-5" />
                  Check-in Manual
                </Button>
              </div>
              
              {/* Input CPF Manual */}
              <div>
                <Label htmlFor="manual-cpf" className="text-sm font-medium">CPF Manual</Label>
                <Input
                  id="manual-cpf"
                  placeholder="Digite apenas os números do CPF"
                  value={manualCpf}
                  onChange={(e) => handleCpfInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                  maxLength={11}
                  className="mt-1 text-base"
                />
                {manualCpf && (
                  <p className="text-xs text-muted-foreground mt-1">
                    CPF: {maskCpf(manualCpf)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Mobile-First */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Participantes ({filteredRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Cards */}
            <div className="block sm:hidden">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum participante encontrado' : 'Nenhum participante registrado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredRegistrations.map((registration) => (
                    <Card key={registration.id} className="p-4 hover-scale">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-base">{registration.name}</h4>
                            <p className="text-sm text-muted-foreground">{registration.events.title}</p>
                          </div>
                          <Badge variant={registration.checked_in ? "default" : "secondary"}>
                            {registration.checked_in ? 'Presente' : 'Pendente'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            CPF: {maskCpf(registration.document)}
                          </span>
                          
                          {registration.checked_in && registration.checkin_time ? (
                            <span className="text-xs text-green-600">
                              {new Date(registration.checkin_time).toLocaleString('pt-BR')}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => processCheckIn(registration.document)}
                              className="h-8 px-3"
                            >
                              Check-in
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block">
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
                  {filteredRegistrations.map((registration) => (
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
                            onClick={() => processCheckIn(registration.document)}
                          >
                            Check-in
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredRegistrations.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum participante encontrado' : 'Nenhum participante registrado'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scanner QR Code Dialog Melhorado */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scanner QR Code
              </DialogTitle>
              <DialogDescription>
                Posicione o QR Code dentro da área de leitura
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Scanner Container */}
              <div className="relative">
                <div className="border-2 border-dashed border-primary/50 rounded-lg overflow-hidden bg-black/5">
                  <QrReader
                    onResult={handleQRScan}
                    constraints={{ 
                      facingMode: 'environment'
                    }}
                    videoStyle={{
                      width: '100%',
                      height: '280px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full relative">
                    {/* Corner indicators */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary"></div>
                  </div>
                </div>
              </div>

              {/* Scanner Status */}
              {scannerError ? (
                <div className="text-center text-red-600 text-sm">
                  {scannerError}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  Posicione o QR Code dentro da área marcada
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowScanner(false)} 
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}