import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Building2, 
  Bell, 
  User, 
  Save,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

interface CompanyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  address: string;
  primary_color: string;
  secondary_color: string;
}

interface NotificationSettings {
  id?: string;
  company_id: string;
  new_registration: boolean;
  event_reminder: boolean;
  email_confirmation: boolean;
  checkin_alert: boolean;
}

const Settings = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  useEffect(() => {
    if (profile?.company_id) {
      fetchCompanyData();
      fetchNotificationSettings();
    }
  }, [profile]);

  const fetchCompanyData = async () => {
    if (!profile?.company_id) return;

    try {
      setLoadingCompany(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;
      setCompanyData(data);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
      });
    } finally {
      setLoadingCompany(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!profile?.company_id) return;

    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('company_id', profile.company_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setNotificationSettings(data);
      } else {
        // Criar configurações padrão se não existir
        setNotificationSettings({
          company_id: profile.company_id,
          new_registration: true,
          event_reminder: true,
          email_confirmation: true,
          checkin_alert: false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de notificação:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as configurações de notificação.",
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const saveCompanyData = async () => {
    if (!companyData) return;

    try {
      setSavingCompany(true);
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          email: companyData.email,
          phone: companyData.phone,
          description: companyData.description,
          address: companyData.address,
          primary_color: companyData.primary_color,
          secondary_color: companyData.secondary_color,
        })
        .eq('id', companyData.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "As informações da empresa foram atualizadas.",
      });
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
      });
    } finally {
      setSavingCompany(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!notificationSettings) return;

    try {
      setSavingNotifications(true);
      
      if (notificationSettings.id) {
        // Atualizar existente
        const { error } = await supabase
          .from('notification_settings')
          .update({
            new_registration: notificationSettings.new_registration,
            event_reminder: notificationSettings.event_reminder,
            email_confirmation: notificationSettings.email_confirmation,
            checkin_alert: notificationSettings.checkin_alert,
          })
          .eq('id', notificationSettings.id);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('notification_settings')
          .insert([{
            company_id: notificationSettings.company_id,
            new_registration: notificationSettings.new_registration,
            event_reminder: notificationSettings.event_reminder,
            email_confirmation: notificationSettings.email_confirmation,
            checkin_alert: notificationSettings.checkin_alert,
          }]);

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações de notificação foram atualizadas.",
      });
      
      // Recarregar para pegar o ID se foi criado
      fetchNotificationSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações de notificação.",
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  if (loading || loadingCompany || loadingNotifications) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">
                Gerencie as configurações da sua empresa e preferências
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </TabsTrigger>
          </TabsList>

          {/* Configurações da Empresa */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {companyData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company-email"
                          type="email"
                          className="pl-9"
                          value={companyData.email}
                          onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company-phone"
                          className="pl-9"
                          value={companyData.phone || ''}
                          onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Cor Primária</Label>
                      <Input
                        id="primary-color"
                        type="color"
                        value={companyData.primary_color}
                        onChange={(e) => setCompanyData({ ...companyData, primary_color: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="company-address">Endereço</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company-address"
                          className="pl-9"
                          value={companyData.address || ''}
                          onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="company-description">Descrição</Label>
                      <Textarea
                        id="company-description"
                        rows={3}
                        value={companyData.description || ''}
                        onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={saveCompanyData} disabled={savingCompany}>
                    {savingCompany && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Notificações */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificação</CardTitle>
                <CardDescription>
                  Configure quando você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Novas Confirmações</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber notificação quando alguém se confirmar em um evento
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.new_registration}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, new_registration: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Lembrete de Eventos</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber lembrete antes dos eventos acontecerem
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.event_reminder}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, event_reminder: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Confirmação por E-mail</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar e-mail de confirmação para participantes
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.email_confirmation}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, email_confirmation: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alerta de Check-in</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber notificação quando participantes fizerem check-in
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.checkin_alert}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, checkin_alert: checked })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={saveNotificationSettings} disabled={savingNotifications}>
                    {savingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações do Perfil */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Visualize e gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={profile.name} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input value={profile.email} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Input value={profile.role === 'admin' ? 'Administrador' : profile.role} disabled />
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Para alterar suas informações pessoais, entre em contato com o suporte.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;