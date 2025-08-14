import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageCircle, Edit, Trash2, Loader2, Send, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import MessageTemplateManager from "@/components/MessageTemplateManager";
import MessageEditor from "@/components/MessageEditor";
import { getInviteStatusBadge } from "@/lib/status";

interface Invite {
  id: string;
  full_name: string;
  cpf: string;
  whatsapp: string;
  email?: string;
  status: string;
  created_at: string;
  event_id: string;
  message_sent?: string;
  events: {
    title: string;
    date: string;
  };
}

interface Event {
  id: string;
  title: string;
  date: string;
  status: string;
  location?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  variables: string[];
}

export default function Invites() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterEventId, setFilterEventId] = useState<string>("all");

  // Form states
  const [selectedEventId, setSelectedEventId] = useState("");
  const [bulkData, setBulkData] = useState("");
  const [manualForm, setManualForm] = useState({
    full_name: "",
    cpf: "",
    whatsapp: "",
    email: ""
  });

  // Message customization states
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [companies, setCompanies] = useState<any>(null);

  // Update custom message when template changes
  useEffect(() => {
    if (selectedTemplate && !customMessage) {
      setCustomMessage(selectedTemplate.content);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!profile?.company_id) {
      navigate("/setup");
      return;
    }
    fetchInvites();
    fetchEvents();
    fetchCompany();
  }, [user, profile, navigate]);

  const fetchInvites = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("invites")
        .select(`
          *,
          events (title, date)
        `)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convites.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch all events (both active and inactive) for better user experience
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, status, location")
        .eq("company_id", profile.company_id)
        .in("status", ["active", "inactive"]) // Include both statuses
        .order("date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive",
      });
    }
  };

  const fetchCompany = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("name, slug")
        .eq("id", profile.company_id)
        .single();

      if (error) throw error;
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const validateCPF = (cpf: string) => {
    return cpf.replace(/\D/g, '').length === 11;
  };

  const validateWhatsApp = (whatsapp: string) => {
    return whatsapp.replace(/\D/g, '').length >= 10;
  };

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**$4');
  };

  const formatWhatsApp = (whatsapp: string) => {
    const numbers = whatsapp.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const handleBulkInvite = async () => {
    if (!selectedEventId || !bulkData.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um evento e insira os dados dos convidados.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const lines = bulkData.trim().split('\n');
      const invitesToInsert = [];

      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 3) continue;

        const [full_name, cpf, whatsapp, email] = parts;
        
        if (!validateCPF(cpf)) {
          toast({
            title: "Erro",
            description: `CPF inválido para ${full_name}`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        if (!validateWhatsApp(whatsapp)) {
          toast({
            title: "Erro",
            description: `WhatsApp inválido para ${full_name}`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        invitesToInsert.push({
          company_id: profile!.company_id,
          event_id: selectedEventId,
          full_name,
          cpf: cpf.replace(/\D/g, ''),
          whatsapp: whatsapp.replace(/\D/g, ''),
          email: email || null,
          status: 'pending',
          message_sent: customMessage || null
        });
      }

      const { error } = await supabase
        .from("invites")
        .insert(invitesToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${invitesToInsert.length} convites criados com sucesso!`,
      });

      setBulkData("");
      setSelectedEventId("");
      setCustomMessage("");
      setIsDialogOpen(false);
      fetchInvites();
    } catch (error) {
      console.error("Error creating bulk invites:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar convites em massa.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualInvite = async () => {
    if (!selectedEventId || !manualForm.full_name || !manualForm.cpf || !manualForm.whatsapp) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(manualForm.cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido.",
        variant: "destructive",
      });
      return;
    }

    if (!validateWhatsApp(manualForm.whatsapp)) {
      toast({
        title: "Erro",
        description: "WhatsApp inválido.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("invites")
        .insert({
          company_id: profile!.company_id,
          event_id: selectedEventId,
          full_name: manualForm.full_name,
          cpf: manualForm.cpf.replace(/\D/g, ''),
          whatsapp: manualForm.whatsapp.replace(/\D/g, ''),
          email: manualForm.email || null,
          status: 'pending',
          message_sent: customMessage || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite criado com sucesso!",
      });

      setManualForm({ full_name: "", cpf: "", whatsapp: "", email: "" });
      setSelectedEventId("");
      setCustomMessage("");
      setIsDialogOpen(false);
      fetchInvites();
    } catch (error) {
      console.error("Error creating manual invite:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar convite.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const processMessage = (template: string, invite: Invite, event: Event) => {
    const eventDate = new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const hour = new Date().getHours();
    const greeting = hour >= 6 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";
    
    // Always use company public link
    const eventLink = companies?.slug ? `${window.location.origin}/${companies.slug}` : window.location.origin;
    
    const variables = {
      nome: invite.full_name,
      evento: event.title,
      data: eventDate,
      local: event.location || "A definir",
      link: eventLink,
      empresa: companies?.name || "Nossa empresa",
      saudacao: greeting
    };

    let processedMessage = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedMessage = processedMessage.replace(regex, value);
    });

    return processedMessage;
  };

  const handleSendWhatsApp = async (invite: Invite) => {
    const event = events.find(e => e.id === invite.event_id);
    if (!event) return;

    const whatsappNumber = invite.whatsapp.replace(/\D/g, '');
    
    // Use saved message or default
    let message = invite.message_sent;
    if (!message) {
      // Fallback to simple message if no template
      const eventDate = new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR');
      const eventLink = companies?.slug ? `${window.location.origin}/${companies.slug}` : window.location.origin;
      message = `Olá ${invite.full_name}, você está convidado para o evento ${event.title} no dia ${eventDate}. Para confirmar presença, acesse: ${eventLink}`;
    } else {
      // Process the saved template
      message = processMessage(message, invite, event);
    }
    
    const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Update status to sent
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: 'sent' })
        .eq("id", invite.id);

      if (error) throw error;
      
      fetchInvites();
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Error updating invite status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do convite.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invite: Invite) => {
    setEditingInvite(invite);
    setManualForm({
      full_name: invite.full_name,
      cpf: invite.cpf,
      whatsapp: invite.whatsapp,
      email: invite.email || ""
    });
    setSelectedEventId(invite.event_id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvite = async () => {
    if (!editingInvite || !manualForm.full_name || !manualForm.cpf || !manualForm.whatsapp) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(manualForm.cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido.",
        variant: "destructive",
      });
      return;
    }

    if (!validateWhatsApp(manualForm.whatsapp)) {
      toast({
        title: "Erro",
        description: "WhatsApp inválido.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("invites")
        .update({
          event_id: selectedEventId,
          full_name: manualForm.full_name,
          cpf: manualForm.cpf.replace(/\D/g, ''),
          whatsapp: manualForm.whatsapp.replace(/\D/g, ''),
          email: manualForm.email || null
        })
        .eq("id", editingInvite.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite atualizado com sucesso!",
      });

      setIsEditDialogOpen(false);
      setEditingInvite(null);
      fetchInvites();
    } catch (error) {
      console.error("Error updating invite:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar convite.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite excluído com sucesso!",
      });

      fetchInvites();
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir convite.",
        variant: "destructive",
      });
    }
  };

  // Import the standardized status function at the top
  // Status handling moved to @/lib/status

  // Filter invites based on selected event
  const filteredInvites = filterEventId === "all" 
    ? invites 
    : invites.filter(invite => invite.event_id === filterEventId);

  // Calculate stats based on filtered data
  const totalInvites = filteredInvites.length;
  const pendingInvites = filteredInvites.filter(invite => invite.status === 'pending').length;
  const sentInvites = filteredInvites.filter(invite => invite.status === 'sent').length;

  // Get selected event info for context
  const selectedEvent = filterEventId === "all" 
    ? null 
    : events.find(event => event.id === filterEventId);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Convites</h1>
            <p className="text-muted-foreground">Gerencie os convites para seus eventos</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Convidar
              </Button>
            </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Convite</DialogTitle>
                  <DialogDescription>
                    Convide pessoas para seus eventos através do WhatsApp
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event">Evento</Label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                       <SelectContent>
                         {events
                           .filter(event => event.status === 'active' && new Date(event.date) >= new Date())
                           .map((event) => (
                             <SelectItem key={event.id} value={event.id}>
                                {event.title} - {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                <Badge variant="default" className="ml-2">Ativo</Badge>
                             </SelectItem>
                           ))}
                       </SelectContent>
                    </Select>
                   </div>

                  {/* Message Templates and Editor */}
                  <div className="space-y-4">
                    <MessageTemplateManager 
                      onSelectTemplate={setSelectedTemplate}
                      selectedTemplate={selectedTemplate}
                    />
                    
                    {selectedTemplate && (
                      <MessageEditor
                        content={customMessage || selectedTemplate.content}
                        onChange={setCustomMessage}
                        previewData={{
                          nome: manualForm.full_name || "João Silva",
                          evento: events.find(e => e.id === selectedEventId)?.title || "Evento de Exemplo",
                          data: events.find(e => e.id === selectedEventId)?.date 
                            ? new Date(events.find(e => e.id === selectedEventId)!.date + 'T00:00:00').toLocaleDateString('pt-BR')
                            : "01/01/2024",
                          local: events.find(e => e.id === selectedEventId)?.location || "Local do evento",
                          link: companies?.slug ? `${window.location.origin}/${companies.slug}` : `${window.location.origin}`,
                          empresa: companies?.name || "Nossa Empresa"
                        }}
                      />
                    )}
                  </div>

                  <Tabs defaultValue="bulk" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="bulk">Convite em Massa</TabsTrigger>
                      <TabsTrigger value="manual">Convite Manual</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="bulk" className="space-y-4">
                      <div>
                        <Label htmlFor="bulk-data">Dados dos Convidados</Label>
                        <Textarea
                          id="bulk-data"
                          placeholder="Nome Completo | CPF | WhatsApp | Email (opcional)&#10;João Silva | 12345678901 | 11999999999 | joao@email.com&#10;Maria Santos | 09876543210 | 11888888888"
                          value={bulkData}
                          onChange={(e) => setBulkData(e.target.value)}
                          rows={6}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Use o formato: Nome | CPF | WhatsApp | Email (um por linha)
                        </p>
                      </div>
                      <Button onClick={handleBulkInvite} disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Criar Convites
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="manual" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="full_name">Nome Completo *</Label>
                          <Input
                            id="full_name"
                            value={manualForm.full_name}
                            onChange={(e) => setManualForm(prev => ({ ...prev, full_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpf">CPF *</Label>
                          <Input
                            id="cpf"
                            value={manualForm.cpf}
                            onChange={(e) => setManualForm(prev => ({ ...prev, cpf: e.target.value }))}
                            placeholder="12345678901"
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsapp">WhatsApp *</Label>
                          <Input
                            id="whatsapp"
                            value={manualForm.whatsapp}
                            onChange={(e) => setManualForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="11999999999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={manualForm.email}
                            onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button onClick={handleManualInvite} disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Criar Convite
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtro por Evento */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="filter-event">Filtrar por Evento</Label>
            <Select value={filterEventId} onValueChange={setFilterEventId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Todos os eventos" />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os eventos</SelectItem>
                 {events.map((event) => (
                   <SelectItem key={event.id} value={event.id}>
                     <div className="flex items-center justify-between w-full">
                       <span>{event.title}</span>
                       <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                         {event.status === 'active' ? 'Ativo' : 'Inativo'}
                       </Badge>
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>
          {selectedEvent && (
            <div className="text-sm text-muted-foreground">
              Exibindo convites para: <strong>{selectedEvent.title}</strong>
            </div>
          )}
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Convites</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvites}</div>
              <p className="text-xs text-muted-foreground">
                Todos os convites criados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvites}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando envio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convites Enviados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentInvites}</div>
              <p className="text-xs text-muted-foreground">
                Já enviados via WhatsApp
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Convites */}
        {filteredInvites.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum convite encontrado</CardTitle>
              <CardDescription>
                {filterEventId === "all" 
                  ? "Comece criando seus primeiros convites para os eventos."
                  : `Nenhum convite encontrado para ${selectedEvent?.title}.`
                }
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Convites</CardTitle>
              <CardDescription>
                {filterEventId === "all"
                  ? `Total de ${filteredInvites.length} convites`
                  : `${filteredInvites.length} convites para ${selectedEvent?.title}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.full_name}</TableCell>
                      <TableCell>{formatCPF(invite.cpf)}</TableCell>
                      <TableCell>{formatWhatsApp(invite.whatsapp)}</TableCell>
                      <TableCell>{invite.email || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invite.events.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(invite.events.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWhatsApp(invite)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(invite)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(invite.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Convite</DialogTitle>
              <DialogDescription>
                Atualize os dados do convite
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-event">Evento</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                   <SelectContent>
                     {events.map((event) => (
                       <SelectItem key={event.id} value={event.id}>
                         <div className="flex items-center justify-between w-full">
                           <span>{event.title} - {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                           <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                             {event.status === 'active' ? 'Ativo' : 'Inativo'}
                           </Badge>
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-full_name">Nome Completo *</Label>
                  <Input
                    id="edit-full_name"
                    value={manualForm.full_name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cpf">CPF *</Label>
                  <Input
                    id="edit-cpf"
                    value={manualForm.cpf}
                    onChange={(e) => setManualForm(prev => ({ ...prev, cpf: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-whatsapp">WhatsApp *</Label>
                  <Input
                    id="edit-whatsapp"
                    value={manualForm.whatsapp}
                    onChange={(e) => setManualForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateInvite} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Atualizar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}