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
import { Plus, MessageCircle, Edit, Trash2, Loader2, Send, Clock, CheckCircle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import MessageTemplateManager from "@/components/MessageTemplateManager";
import MessageEditor from "@/components/MessageEditor";
import { getInviteStatusBadge } from "@/lib/status";
import { exportInvites } from "@/lib/export";

interface Invite {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  event_id: string | null;
  events: {
    title: string;
    date: string;
  } | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  status: string | null;
  location?: string | null;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean | null;
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
    name: "",
    cpf: "",
    phone: "",
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
      setInvites((data || []) as Invite[]);
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
      setEvents((data || []) as Event[]);
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

  const validatePhone = (phone: string) => {
    return phone.replace(/\D/g, '').length >= 10;
  };

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**$4');
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
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

        const [name, cpf, phone, email] = parts;
        
        if (!validateCPF(cpf)) {
          toast({
            title: "Erro",
            description: `CPF inválido para ${name}`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        if (!validatePhone(phone)) {
          toast({
            title: "Erro",
            description: `Telefone inválido para ${name}`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        invitesToInsert.push({
          company_id: profile!.company_id,
          event_id: selectedEventId,
          name,
          cpf: cpf.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
          email: email || null,
          status: 'pending'
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
    if (!selectedEventId || !manualForm.name || !manualForm.cpf || !manualForm.phone) {
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

    if (!validatePhone(manualForm.phone)) {
      toast({
        title: "Erro",
        description: "Telefone inválido.",
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
          name: manualForm.name,
          cpf: manualForm.cpf.replace(/\D/g, ''),
          phone: manualForm.phone.replace(/\D/g, ''),
          email: manualForm.email || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite criado com sucesso!",
      });

      setManualForm({ name: "", cpf: "", phone: "", email: "" });
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
    
    const variables: Record<string, string> = {
      nome: invite.name,
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

    const phoneNumber = invite.phone?.replace(/\D/g, '') || '';
    
    // Generate direct confirmation link
    const directLink = `${window.location.origin}/${companies?.slug}/convite/${invite.id}`;
    console.log('🔗 Link direto gerado:', directLink);
    console.log('🏢 Company slug:', companies?.slug);
    console.log('📧 Invite ID:', invite.id);
    
    // Default message with direct confirmation link
    const eventDate = new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const message = `Olá ${invite.name}, você está convidado para o evento ${event.title} no dia ${eventDate}. Clique aqui para confirmar sua presença automaticamente: ${directLink}`;
    
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Update status to sent
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: 'pending', sent_at: new Date().toISOString() })
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
      name: invite.name,
      cpf: invite.cpf || '',
      phone: invite.phone || '',
      email: invite.email || ""
    });
    setSelectedEventId(invite.event_id || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvite = async () => {
    if (!editingInvite || !manualForm.name || !manualForm.cpf || !manualForm.phone) {
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

    if (!validatePhone(manualForm.phone)) {
      toast({
        title: "Erro",
        description: "Telefone inválido.",
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
          name: manualForm.name,
          cpf: manualForm.cpf.replace(/\D/g, ''),
          phone: manualForm.phone.replace(/\D/g, ''),
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

  const filteredInvites = filterEventId === "all" 
    ? invites 
    : invites.filter(invite => invite.event_id === filterEventId);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Convites</h1>
            <p className="text-muted-foreground">
              Gerencie os convites para seus eventos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportInvites(filteredInvites, filterEventId !== "all" ? filterEventId : undefined)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Convite
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Convite</DialogTitle>
                  <DialogDescription>
                    Adicione convidados para seus eventos
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="bulk">Em Massa</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Evento *</Label>
                      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} - {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input
                          value={manualForm.name}
                          onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                          placeholder="João da Silva"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input
                          value={manualForm.cpf}
                          onChange={(e) => setManualForm({ ...manualForm, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Telefone *</Label>
                        <Input
                          value={manualForm.phone}
                          onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={manualForm.email}
                          onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleManualInvite} disabled={submitting} className="w-full">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Criar Convite
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="bulk" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Evento *</Label>
                      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} - {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Dados dos Convidados</Label>
                      <Textarea
                        value={bulkData}
                        onChange={(e) => setBulkData(e.target.value)}
                        placeholder="Nome|CPF|Telefone|Email (opcional)
João da Silva|12345678901|11999999999|joao@email.com
Maria Santos|98765432100|11888888888"
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Um convidado por linha. Separe os dados com | (pipe).
                      </p>
                    </div>
                    
                    <Button onClick={handleBulkInvite} disabled={submitting} className="w-full">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Criar Convites
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label>Filtrar por Evento</Label>
                <Select value={filterEventId} onValueChange={setFilterEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Convites */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Convites</CardTitle>
            <CardDescription>
              {filteredInvites.length} convite(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvites.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum convite encontrado</h3>
                <p className="text-muted-foreground">
                  Crie seu primeiro convite clicando no botão acima.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.name}</TableCell>
                        <TableCell>{invite.cpf ? formatCPF(invite.cpf) : '-'}</TableCell>
                        <TableCell>{invite.phone ? formatPhone(invite.phone) : '-'}</TableCell>
                        <TableCell>{invite.events?.title || '-'}</TableCell>
                        <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendWhatsApp(invite)}
                              title="Enviar WhatsApp"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(invite)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(invite.id)}
                              className="text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Convite</DialogTitle>
              <DialogDescription>
                Atualize as informações do convite
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Evento *</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF *</Label>
                  <Input
                    value={manualForm.cpf}
                    onChange={(e) => setManualForm({ ...manualForm, cpf: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={handleUpdateInvite} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
