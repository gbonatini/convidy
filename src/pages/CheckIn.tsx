import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { CheckInFilters } from '@/components/CheckInFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  Percent, 
  Search,
  X,
  Camera,
  Smartphone,
  UserCheck,
  ScanLine,
  Calendar,
  MapPin,
  TrendingUp,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BrowserMultiFormatReader } from '@zxing/library';
import { exportCheckIns } from '@/lib/export';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  company_id: string;
}

interface Registration {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  checked_in_at: string | null;
  events: Event;
  qr_code: string | null;
}

interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
  percentage: number;
}

export default function CheckIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [checkinFilter, setCheckinFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0, percentage: 0 });
  const [userCompanyId, setUserCompanyId] = useState<string>('');
  
  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  // Verificar autenticação e carregar dados
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
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

  // Filtrar registros 
  useEffect(() => {
    let filtered = registrations;

    // Filtrar por evento
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(reg => reg.events.id === selectedEventId);
    }

    // Filtrar por status de check-in
    if (checkinFilter !== 'all') {
      if (checkinFilter === 'checked_in') {
        filtered = filtered.filter(reg => reg.status === 'checked_in');
      } else if (checkinFilter === 'pending') {
        filtered = filtered.filter(reg => reg.status !== 'checked_in');
      }
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(reg => 
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.cpf && reg.cpf.includes(searchTerm.replace(/\D/g, ''))) ||
        reg.events.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredRegistrations(filtered);
    calculateStats(filtered);
  }, [searchTerm, registrations, selectedEventId, checkinFilter]);

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
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (companyId: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao carregar eventos:', error);
      return;
    }

    setEvents(data || []);
  };

  const loadRegistrations = async (companyId: string) => {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events!inner(
          id,
          title,
          date,
          location,
          capacity,
          company_id
        )
      `)
      .eq('events.company_id', companyId)
      .eq('events.status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar registros:', error);
      return;
    }

    const regs = (data || []) as unknown as Registration[];
    setRegistrations(regs);
    setFilteredRegistrations(regs);
    calculateStats(regs);
  };


  const calculateStats = (regs: Registration[]) => {
    const total = regs.length;
    const checkedIn = regs.filter(r => r.status === 'checked_in').length;
    const pending = total - checkedIn;
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    setStats({ total, checkedIn, pending, percentage });
  };

  // Scanner de código de barras melhorado
  const handleBarcodeScan = async (result: any) => {
    if (!result) return;

    try {
      console.log('[BARCODE SCANNER] Resultado:', result.text);
      setScannerError('');
      
      // O código de barras é o valor direto (sem decodificação)
      const barcodeValue = result.text;
      
      if (!barcodeValue) {
        throw new Error('Código de barras inválido');
      }

      console.log('[BARCODE SCANNER] Código extraído:', barcodeValue);
      await processCheckInByBarcode(barcodeValue);
      
    } catch (error: any) {
      console.error('[BARCODE SCANNER] Erro:', error);
      setScannerError(error.message || 'Erro ao processar código de barras');
      toast.error(`Erro no scanner: ${error.message}`);
    }
  };

  // Processar check-in por código de barras
  const processCheckInByBarcode = async (barcodeValue: string) => {
    try {
      console.log('[CHECK-IN] Iniciando com código de barras:', barcodeValue);
      console.log('[CHECK-IN] Registros disponíveis:', registrations.map(r => ({ id: r.id, name: r.name, qr_code: r.qr_code, cpf: r.cpf })));
      
      // Buscar registro pelo código de barras (CPF limpo)
      let registration = registrations.find(reg => {
        const cleanCpf = reg.cpf?.replace(/[^0-9]/g, '');
        return cleanCpf === barcodeValue;
      });
      
      // Se não encontrou por CPF, tentar busca pelo qr_code
      if (!registration) {
        console.log('[CHECK-IN] Busca por CPF falhou, tentando por qr_code...');
        registration = registrations.find(reg => reg.qr_code === barcodeValue);
      }
      
      // Se não encontrou por qr_code, tentar busca pelo ID único
      if (!registration) {
        console.log('[CHECK-IN] Busca por qr_code falhou, tentando busca por ID único...');
        registration = registrations.find(reg => reg.id === barcodeValue);
      }
      
      // Busca parcial como último recurso
      if (!registration) {
        console.log('[CHECK-IN] Busca por ID falhou, tentando busca parcial...');
        registration = registrations.find(reg => 
          reg.qr_code && (
            reg.qr_code.includes(barcodeValue) || 
            barcodeValue.includes(reg.qr_code) ||
            reg.qr_code.endsWith(barcodeValue) ||
            reg.id.includes(barcodeValue)
          )
        );
      }
      
      if (!registration) {
        console.log('[CHECK-IN] Nenhum registro encontrado para código:', barcodeValue);
        throw new Error(`Registro não encontrado para código: ${barcodeValue}`);
      }

      console.log('[CHECK-IN] Registro encontrado:', registration);

      if (registration.status === 'checked_in') {
        toast.error(`${registration.name} já fez check-in anteriormente`);
        setShowScanner(false);
        return;
      }

      // Realizar check-in usando a função do banco
      const { data, error } = await supabase.rpc('perform_checkin', {
        p_registration_id: registration.id
      });

      if (error) {
        console.error('[CHECK-IN] Erro RPC:', error);
        throw new Error('Erro ao realizar check-in');
      }

      if (!data || !data[0]?.success) {
        throw new Error(data?.[0]?.message || 'Check-in não foi possível - verificar dados');
      }

      toast.success(`✅ Check-in realizado: ${registration.name}`);
      setShowScanner(false);
      
      // Atualizar dados
      await loadRegistrations(userCompanyId);
      
    } catch (error: any) {
      console.error('[CHECK-IN] Erro:', error);
      toast.error(error.message || 'Erro ao realizar check-in');
    }
  };

  // Processar check-in via CPF manual
  const processCheckIn = async (cpf: string) => {
    try {
      console.log('[CHECK-IN] Iniciando processamento CPF:', cpf);
      const cleanCpf = cpf.replace(/\D/g, '');
      
      if (cleanCpf.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }

      // Usar a função RPC de check-in por CPF
      const { data, error } = await supabase.rpc('checkin_by_cpf', {
        p_cpf: cleanCpf,
        p_event_id: selectedEventId !== 'all' ? selectedEventId : null
      });

      console.log('[CHECK-IN] Resultado do check-in por CPF:', data, error);

      if (error) {
        console.error('[CHECK-IN] Erro na busca:', error);
        throw new Error('Erro ao buscar registro');
      }

      if (!data || data.length === 0 || !data[0].success) {
        throw new Error(data?.[0]?.message || 'Pessoa não encontrada ou não inscrita nos eventos');
      }

      toast.success(`✅ Check-in realizado: ${data[0].registration_name}`);
      setCpfInput('');
      
      // Atualizar dados
      await loadRegistrations(userCompanyId);
      
    } catch (error: any) {
      console.error('[CHECK-IN] Erro completo:', error);
      toast.error(error.message || 'Erro ao processar check-in');
    }
  };

  const handleCpfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpfInput.trim()) {
      await processCheckIn(cpfInput);
    }
  };

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Iniciar scanner
  const startScanner = async () => {
    try {
      console.log('Iniciando scanner...');
      setShowScanner(true);
      setScannerError('');
      
      // Aguardar o modal abrir
      setTimeout(async () => {
        if (videoRef.current) {
          console.log('Inicializando leitor de código...');
          codeReader.current = new BrowserMultiFormatReader();
          
          try {
            await codeReader.current.decodeFromVideoDevice(
              undefined, // device padrão
              videoRef.current,
              (result, error) => {
                if (result) {
                  console.log('Código detectado:', result.getText());
                  handleBarcodeScan({ text: result.getText() });
                  stopScanner();
                }
                if (error && error.name !== 'NotFoundException') {
                  console.error('Erro no scanner:', error);
                }
              }
            );
          } catch (err: any) {
            console.error('Erro ao inicializar câmera:', err);
            setScannerError('Erro ao acessar câmera. Verifique as permissões.');
          }
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Erro ao iniciar scanner:', error);
      setScannerError('Erro ao inicializar scanner');
    }
  };

  // Parar scanner
  const stopScanner = () => {
    console.log('Parando scanner...');
    if (codeReader.current) {
      codeReader.current.reset();
      codeReader.current = null;
    }
    setShowScanner(false);
    setScannerError('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Check-in</h1>
            <p className="text-muted-foreground">
              Gerencie check-ins dos participantes dos seus eventos
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => exportCheckIns(filteredRegistrations, selectedEventId !== "all" ? selectedEventId : undefined)}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Excel</span>
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Inscritos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkedIn}</div>
              <p className="text-xs text-muted-foreground">Realizados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.percentage}%</div>
              <p className="text-xs text-muted-foreground">Presença</p>
            </CardContent>
          </Card>
        </div>

        {/* Ferramentas de Check-in */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in por CPF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Check-in por CPF
              </CardTitle>
              <CardDescription>
                Digite o CPF do participante para realizar check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCpfSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF do Participante</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={(e) => setCpfInput(formatCpf(e.target.value))}
                    maxLength={14}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Realizar Check-in
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Check-in por Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scanner de Código
              </CardTitle>
              <CardDescription>
                Use a câmera para escanear QR Code ou código de barras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={startScanner} className="w-full" variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Abrir Scanner
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Lista */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Lista de Participantes</CardTitle>
                <CardDescription>
                  Visualize e gerencie os check-ins dos participantes
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Todos os eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={checkinFilter} onValueChange={setCheckinFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="checked_in">Check-in feito</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum participante encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar os filtros de busca' : 'Ainda não há inscrições para os eventos'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Horário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.name}</TableCell>
                        <TableCell>{reg.cpf ? formatCpf(reg.cpf) : '-'}</TableCell>
                        <TableCell>{reg.events.title}</TableCell>
                        <TableCell>
                          {reg.status === 'checked_in' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Check-in feito
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {reg.status === 'checked_in' && reg.checked_in_at
                            ? new Date(reg.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal do Scanner */}
      <Dialog open={showScanner} onOpenChange={(open) => !open && stopScanner()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanner de Código
            </DialogTitle>
            <DialogDescription>
              Posicione o código de barras ou QR Code na frente da câmera
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" />
              {scannerError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4">
                  <p>{scannerError}</p>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={stopScanner} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Fechar Scanner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
