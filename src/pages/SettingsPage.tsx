import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { Building, Bell, User, Save, Loader2, Shield, Upload, X } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  slug: string;
  logo_url: string | null;
}

interface NotificationSettings {
  id?: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  sms_notifications: boolean;
  reminder_days_before: number;
}

const SettingsPage = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    whatsapp_notifications: true,
    sms_notifications: false,
    reminder_days_before: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchCompanyData();
      fetchNotificationSettings();
    }
  }, [profile]);

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase.from('companies').select('id, name, email, phone, slug, logo_url').eq('id', profile?.company_id).single();
      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const { data, error } = await supabase.from('notification_settings').select('*').eq('company_id', profile?.company_id).maybeSingle();
      if (error) throw error;
      if (data) {
        setNotifications({
          id: data.id,
          email_notifications: data.email_notifications ?? true,
          whatsapp_notifications: data.whatsapp_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          reminder_days_before: data.reminder_days_before ?? 1
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de notificação:', error);
    }
  };

  const handleCompanyChange = (field: keyof Company, value: string) => {
    if (!company) return;
    console.log(`Alterando ${field}:`, value);
    setCompany({
      ...company,
      [field]: value
    });
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean | number) => {
    setNotifications({
      ...notifications,
      [field]: value
    });
  };

  const saveCompanyData = async () => {
    if (!company) return;
    console.log('=== VERIFICANDO DADOS ANTES DE SALVAR ===');
    console.log('User ID:', user?.id);
    console.log('Profile:', profile);
    console.log('Company ID:', company.id);
    console.log('Profile Company ID:', profile?.company_id);
    setIsSaving(true);
    try {
      const updateData = {
        name: company.name,
        phone: company.phone,
        logo_url: company.logo_url || null
      };
      console.log('Dados para atualizar:', updateData);
      const { data, error } = await supabase.from('companies').update(updateData).eq('id', company.id).select('*');
      console.log('Resposta completa:', { data, error });
      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }
      if (!data || data.length === 0) {
        console.log('Nenhum registro foi atualizado - verificando se o registro existe...');
        const { data: existingData, error: selectError } = await supabase.from('companies').select('*').eq('id', company.id);
        console.log('Dados existentes:', { existingData, selectError });
        if (!existingData || existingData.length === 0) {
          throw new Error('Empresa não encontrada');
        }

        // Se existe mas não foi atualizado, pode ser problema de permissão
        throw new Error('Não foi possível atualizar os dados. Verifique suas permissões.');
      }
      console.log('Dados atualizados com sucesso:', data);
      setCompany(data[0]);
      toast({
        title: "Dados salvos!",
        description: "As informações da empresa foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar os dados da empresa."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      const settingsData = {
        company_id: profile?.company_id,
        email_notifications: notifications.email_notifications,
        whatsapp_notifications: notifications.whatsapp_notifications,
        sms_notifications: notifications.sms_notifications,
        reminder_days_before: notifications.reminder_days_before
      };
      if (notifications.id) {
        const { error } = await supabase.from('notification_settings').update(settingsData).eq('id', notifications.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('notification_settings').insert([settingsData]).select().single();
        if (error) throw error;
        setNotifications({
          ...notifications,
          id: data.id
        });
      }
      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram atualizadas."
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações de notificação."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company) return;

    // Verificar se é imagem
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem."
      });
      return;
    }
    setIsUploadingLogo(true);
    try {
      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${company.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage.from('event-images').upload(filePath, file, {
        upsert: true
      });
      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path);

      // Atualizar estado local
      setCompany({
        ...company,
        logo_url: publicUrl
      });
      toast({
        title: "Logo enviado!",
        description: "Logo salvo com sucesso. Clique em 'Salvar Alterações' para confirmar."
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer upload do logotipo."
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    if (company) {
      setCompany({
        ...company,
        logo_url: null
      });
    }
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua empresa e preferências
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
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

          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Atualize os dados da sua empresa que aparecerão na página pública
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <Input id="company-name" value={company?.name || ''} onChange={e => handleCompanyChange('name', e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input id="company-phone" value={company?.phone || ''} onChange={e => handleCompanyChange('phone', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logotipo da Empresa</Label>
                  <div className="space-y-3">
                    {company?.logo_url ? (
                      <div className="relative inline-block">
                        <img src={company.logo_url} alt="Logo da empresa" className="h-20 w-20 object-cover rounded-lg border shadow-sm" onError={e => {
                          e.currentTarget.style.display = 'none';
                        }} />
                        <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={handleRemoveLogo}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button type="button" variant="outline" disabled={isUploadingLogo} onClick={() => document.getElementById('logo-upload')?.click()}>
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {company?.logo_url ? 'Trocar Logo' : 'Enviar Logo'}
                          </>
                        )}
                      </Button>
                      <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O logotipo será exibido automaticamente na página pública da empresa
                  </p>
                </div>

                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={company?.email || ''} disabled />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <Input value={company?.slug || ''} disabled />
                    <p className="text-xs text-muted-foreground">
                      O slug é usado na URL pública
                    </p>
                  </div>
                </div>

                <Button onClick={saveCompanyData} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificação</CardTitle>
                <CardDescription>
                  Configure como você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações por email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_notifications}
                      onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações por WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={notifications.whatsapp_notifications}
                      onCheckedChange={(checked) => handleNotificationChange('whatsapp_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações por SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms_notifications}
                      onCheckedChange={(checked) => handleNotificationChange('sms_notifications', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de antecedência para lembretes</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={notifications.reminder_days_before}
                      onChange={(e) => handleNotificationChange('reminder_days_before', parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantos dias antes do evento enviar lembretes
                    </p>
                  </div>
                </div>

                <Button onClick={saveNotificationSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Visualize as informações do seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={profile?.name || ''} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || user?.email || ''} disabled />
                </div>

                <p className="text-sm text-muted-foreground">
                  Para alterar suas informações de perfil, entre em contato com o suporte.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
