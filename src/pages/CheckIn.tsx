import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getCheckinStatusBadge } from '@/lib/status';
import CryptoJS from 'crypto-js';
import { QrCodeIcon, ScanIcon, UserCheckIcon, UserIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  document: string;
  qr_code: string;
  checked_in: boolean;
  checkin_time: string | null;
  event_id: string;
  events?: Event;
}

interface CheckInStats {
  total_confirmations: number;
  total_checkins: number;
  pending_checkins: number;
  attendance_percentage: number;
}

const CheckIn = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<CheckInStats>({
    total_confirmations: 0,
    total_checkins: 0,
    pending_checkins: 0,
    attendance_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [manualDocument, setManualDocument] = useState('');

  // Fetch events and registrations on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Update stats when registrations change
  useEffect(() => {
    calculateStats();
  }, [registrations, selectedEventId]);

  // Set up real-time subscription for registrations
  useEffect(() => {
    const channel = supabase
      .channel('registrations-checkin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations'
        },
        () => {
          console.log('Registration updated, refetching data...');
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEvents(), fetchRegistrations()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time')
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) return;

      let query = supabase
        .from('registrations')
        .select(`
          id,
          name,
          email,
          document,
          qr_code,
          checked_in,
          checkin_time,
          event_id,
          events!inner(id, title, date, time, company_id)
        `)
        .eq('events.company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (selectedEventId !== 'all') {
        query = query.eq('event_id', selectedEventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const calculateStats = () => {
    const filteredRegs = selectedEventId === 'all' 
      ? registrations 
      : registrations.filter(reg => reg.event_id === selectedEventId);

    const total_confirmations = filteredRegs.length;
    const total_checkins = filteredRegs.filter(reg => reg.checked_in).length;
    const pending_checkins = total_confirmations - total_checkins;
    const attendance_percentage = total_confirmations > 0 
      ? Math.round((total_checkins / total_confirmations) * 100) 
      : 0;

    setStats({
      total_confirmations,
      total_checkins,
      pending_checkins,
      attendance_percentage
    });
  };

  const handleQRCodeScan = async (result: any) => {
    if (!result) return;

    try {
      const raw: string = result.text || '';

      const tryParse = (s: string) => {
        try { return JSON.parse(s); } catch { return null; }
      };
      const b64decode = (s: string) => {
        // Support URL-safe base64 as well
        const normalized = s.replace(/[-_]/g, (c) => (c === '-' ? '+' : '/'));
        return atob(normalized);
      };

      // Handle possible data URL (e.g., data:application/json;base64,....)
      const payload = raw.startsWith('data:') && raw.includes(',') ? raw.split(',').pop() as string : raw;

      let decoded: any = null;
      // Try base64 JSON first
      try { decoded = tryParse(b64decode(payload)); } catch { /* ignore */ }
      // Fallback: plain JSON in QR
      if (!decoded) decoded = tryParse(payload);

      if (!decoded || (!decoded.document_hash && !decoded.document && !decoded.cpf)) {
        throw new Error('QR payload inválido');
      }

      // Suporte para formato simples (document ou cpf direto) e formato com hash
      let document_hash: string;
      if (decoded.document_hash) {
        document_hash = decoded.document_hash;
      } else {
        // Formato simples - usar documento direto e gerar hash
        const document = decoded.document || decoded.cpf;
        document_hash = CryptoJS.MD5(document).toString();
      }

      const { event_id } = decoded;
      await processCheckIn(document_hash, event_id);
    } catch (error) {
      console.error('Error processing QR code:', error, result?.text);
      toast.error('QR Code inválido');
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualDocument.trim()) {
      toast.error('Digite o CPF/documento');
      return;
    }

    // Normalizar documento removendo pontuação e traços, depois usar MD5
    const normalizedDocument = manualDocument.replace(/\D/g, '');
    const document_hash = CryptoJS.MD5(normalizedDocument).toString();

    await processCheckIn(document_hash);
    setManualDocument('');
  };

  const processCheckIn = async (document_hash: string, event_id?: string) => {
    console.log('[CheckIn] processCheckIn called with:', { document_hash, event_id });
    // 1) Buscar o registro usando RPC segura no banco (RLS garantida por company do usuário)
    try {
      let registration: any = null;

      if (event_id) {
        const { data, error } = await (supabase as any).rpc('find_registration_by_hash', {
          event_uuid: event_id,
          doc_hash: document_hash,
        });
        console.log('[CheckIn] RPC find_registration_by_hash ->', { data, error });
        if (error) throw error;
        registration = Array.isArray(data) ? data[0] : data;
      } else {
        const { data, error } = await (supabase as any).rpc('find_registration_by_hash_company', {
          doc_hash: document_hash,
        });
        console.log('[CheckIn] RPC find_registration_by_hash_company ->', { data, error });
        if (error) throw error;
        registration = Array.isArray(data) ? data[0] : data;
      }

      if (!registration) {
        toast.error('Convidado não encontrado');
        return;
      }

      if (registration.checked_in) {
        toast.warning('Check-in já realizado anteriormente');
        return;
      }

      // 2) Atualizar para checked_in = true
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          checked_in: true,
          checkin_time: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      toast.success(`Check-in realizado para ${registration.name}!`);
      setShowScanner(false);

      // Opcional: atualizar a listagem imediatamente
      fetchRegistrations();
    } catch (error) {
      console.error('Error processing check-in via RPC:', error);
      toast.error('Erro ao realizar check-in');
    }
  };

  const maskDocument = (document: string) => {
    if (!document) return '';
    // Mask CPF: 123.456.789-XX
    const cleaned = document.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-XX`;
    }
    return document;
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return '';
    const eventDate = new Date(date + 'T' + time);
    return eventDate.toLocaleString('pt-BR');
  };

  // Authentication check
  if (authLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.company_id) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Check-in de Eventos</h1>
        <p className="text-muted-foreground">Gerencie o check-in dos participantes em tempo real</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total_confirmations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
            <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-success">{stats.total_checkins}</div>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltantes</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-muted-foreground">{stats.pending_checkins}</div>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Presença</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">{stats.attendance_percentage}%</div>
           </CardContent>
        </Card>
      </div>

      {/* Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanIcon className="h-5 w-5" />
            Scanner de Check-in
          </CardTitle>
          <CardDescription>
            Use o scanner de QR Code ou insira o CPF manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Dialog open={showScanner} onOpenChange={setShowScanner}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <QrCodeIcon className="mr-2 h-4 w-4" />
                  Abrir Scanner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Scanner de QR Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <QrReader
                    onResult={handleQRCodeScan}
                    constraints={{ 
                      facingMode: 'environment',
                      aspectRatio: 1,
                      frameRate: { ideal: 30, max: 60 }
                    }}
                    containerStyle={{ width: '100%' }}
                    videoStyle={{ width: '100%', height: 'auto' }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="CPF (apenas números)"
                value={manualDocument}
                onChange={(e) => setManualDocument(e.target.value.replace(/\D/g, ''))}
                className="flex-1"
              />
              <Button onClick={handleManualCheckIn} variant="outline">
                Check-in Manual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Participantes</CardTitle>
          <CardDescription>
            {selectedEventId === 'all' 
              ? 'Todos os eventos' 
              : events.find(e => e.id === selectedEventId)?.title || 'Evento selecionado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Horário Check-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.name}</TableCell>
                  <TableCell>{registration.email}</TableCell>
                  <TableCell>{maskDocument(registration.document)}</TableCell>
                  <TableCell>
                    {registration.events ? (
                      <div>
                        <div className="font-medium">{registration.events.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(registration.events.date, registration.events.time)}
                        </div>
                      </div>
                    ) : (
                      'Evento não encontrado'
                    )}
                  </TableCell>
                   <TableCell>
                     {getCheckinStatusBadge(registration.checked_in)}
                   </TableCell>
                  <TableCell>
                    {registration.checkin_time ? (
                      <div className="text-sm">
                        {new Date(registration.checkin_time).toLocaleString('pt-BR')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {registrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum participante encontrado
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
};

export default CheckIn;
