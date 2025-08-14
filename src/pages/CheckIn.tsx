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
  document: string;
  phone: string;
  email: string;
  checked_in: boolean;
  checkin_time: string | null;
  events: Event;
  qr_code: string;
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
        filtered = filtered.filter(reg => reg.checked_in);
      } else if (checkinFilter === 'pending') {
        filtered = filtered.filter(reg => !reg.checked_in);
      }
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(reg => 
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.document.includes(searchTerm.replace(/\D/g, '')) ||
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

    const regs = data || [];
    setRegistrations(regs);
    setFilteredRegistrations(regs);
    calculateStats(regs);
  };


  const calculateStats = (regs: Registration[]) => {
    const total = regs.length;
    const checkedIn = regs.filter(r => r.checked_in).length;
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
      console.log('[CHECK-IN] Registros disponíveis:', registrations.map(r => ({ id: r.id, name: r.name, qr_code: r.qr_code, document: r.document })));
      
      // Buscar registro pelo código de barras (CPF limpo)
      let registration = registrations.find(reg => {
        const cleanDocument = reg.document?.replace(/[^0-9]/g, '');
        return cleanDocument === barcodeValue;
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

      if (registration.checked_in) {
        toast.error(`${registration.name} já fez check-in anteriormente`);
        setShowScanner(false);
        return;
      }

      // Realizar check-in usando a função do banco
      const { data, error } = await (supabase as any).rpc('perform_checkin', {
        registration_id_input: registration.id,
        company_id_input: userCompanyId
      });

      if (error) {
        console.error('[CHECK-IN] Erro RPC:', error);
        throw new Error('Erro ao realizar check-in');
      }

      if (!data) {
        throw new Error('Check-in não foi possível - verificar dados');
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

      // Primeiro buscar o registro manualmente
      let query = supabase
        .from('registrations')
        .select(`
          id,
          name,
          document,
          checked_in,
          checkin_time,
          events (
            id,
            title,
            company_id
          )
        `)
        .eq('document', cleanCpf)
        .eq('events.company_id', userCompanyId);

      // Se um evento específico foi selecionado
      if (selectedEventId && selectedEventId !== 'all') {
        query = query.eq('event_id', selectedEventId);
      }

      const { data: registrations, error: searchError } = await query;

      console.log('[CHECK-IN] Busca por CPF:', registrations, searchError);

      if (searchError) {
        console.error('[CHECK-IN] Erro na busca:', searchError);
        throw new Error('Erro ao buscar registro');
      }

      if (!registrations || registrations.length === 0) {
        throw new Error('Pessoa não encontrada ou não inscrita nos eventos');
      }

      // Pegar o primeiro registro encontrado
      const registration = registrations[0];
      
      console.log('[CHECK-IN] Registro encontrado:', registration);

      if (registration.checked_in) {
        toast.error(`${registration.name} já fez check-in`);
        return;
      }

      // Realizar check-in
      const { data: updatedRegistration, error: checkinError } = await supabase
        .from('registrations')
        .update({
          checked_in: true,
          checkin_time: new Date().toISOString()
        })
        .eq('id', registration.id)
        .select()
        .single();

      console.log('[CHECK-IN] Resultado do update:', updatedRegistration, checkinError);

      if (checkinError) {
        console.error('[CHECK-IN] Erro ao realizar check-in:', checkinError);
        throw new Error('Erro ao realizar check-in');
      }

      toast.success(`✅ Check-in realizado: ${registration.name}`);
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
              <p className="text-xs text-muted-foreground">Participantes registrados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkedIn}</div>
              <p className="text-xs text-muted-foreground">Já fizeram check-in</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Aguardando check-in</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.percentage}%</div>
              <p className="text-xs text-muted-foreground">Percentual de comparecimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações de Check-in */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scanner de Código de Barras
              </CardTitle>
              <CardDescription>
                Use a câmera para escanear códigos de barras dos participantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={startScanner} 
                className="w-full" 
                size="lg"
              >
                <Camera className="h-4 w-4 mr-2" />
                Abrir Scanner
              </Button>
            </CardContent>
          </Card>

          {/* CPF Manual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Check-in Manual
              </CardTitle>
              <CardDescription>
                Digite o CPF do participante para fazer check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCpfSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF do Participante</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formatCpf(cpfInput)}
                    onChange={(e) => setCpfInput(e.target.value.replace(/\D/g, ''))}
                    maxLength={14}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={cpfInput.length < 11}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Fazer Check-in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <CheckInFilters
          selectedEventId={selectedEventId}
          checkinFilter={checkinFilter}
          searchTerm={searchTerm}
          onEventFilterChange={setSelectedEventId}
          onCheckinFilterChange={setCheckinFilter}
          onSearchTermChange={setSearchTerm}
          events={events}
          registrations={filteredRegistrations}
        />

        {/* Lista de Registros */}
        <Card>
          <CardHeader>
            <CardTitle>Participantes ({filteredRegistrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {filteredRegistrations.map((registration) => (
                <div key={registration.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{registration.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCpf(registration.document)}</p>
                      <p className="text-sm text-muted-foreground">{registration.events.title}</p>
                    </div>
                    <Badge variant={registration.checked_in ? "success" : "warning"}>
                      {registration.checked_in ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Confirmado</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    {registration.checked_in && registration.checkin_time ? (
                      <span className="text-xs text-muted-foreground">
                        Check-in: {new Date(registration.checkin_time).toLocaleString()}
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {!registration.checked_in && (
                      <Button
                        size="sm"
                        onClick={() => processCheckIn(registration.document)}
                      >
                        Check-in
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
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
                      <TableCell>{formatCpf(registration.document)}</TableCell>
                      <TableCell>{registration.events.title}</TableCell>
                      <TableCell>
                        <Badge variant={registration.checked_in ? "success" : "warning"}>
                          {registration.checked_in ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Confirmado</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {registration.checked_in && registration.checkin_time ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(registration.checkin_time).toLocaleString()}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => processCheckIn(registration.document)}
                            disabled={registration.checked_in}
                          >
                            Check-in
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Modal */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="w-[90vw] sm:max-w-[500px] p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scanner de Código de Barras
              </DialogTitle>
              <DialogDescription>
                Posicione o código de barras dentro da área de leitura
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Scanner Container */}
              <div className="relative">
                <div className="border-2 border-dashed border-primary/50 rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      height: '280px',
                      objectFit: 'cover'
                    }}
                    muted
                    playsInline
                  />
                </div>

                {/* Overlay de mira */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="w-64 h-20 border-2 border-red-500 rounded-lg bg-red-500/10">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <ScanLine className="h-8 w-8 text-red-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Campo manual para código de barras */}
              <div className="mt-4">
                <Label>Ou digite o código manualmente:</Label>
                <Input
                  placeholder="Digite o código de barras"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value;
                      if (value) {
                        handleBarcodeScan({ text: value });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Status */}
              {scannerError && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">{scannerError}</p>
                </div>
              )}

              {!scannerError && (
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Aponte a câmera para o código de barras
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={stopScanner}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
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