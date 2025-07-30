import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import {
  Building,
  Bell,
  User,
  Save,
  Loader2,
  Shield,
  Upload,
  X
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  cnpj: string;
  primary_color: string;
  secondary_color: string;
  slug: string;
  plan: string;
  status: string;
  logo_url: string | null;
}

interface NotificationSettings {
  id?: string;
  new_registration: boolean;
  event_reminder: boolean;
  email_confirmation: boolean;
  checkin_alert: boolean;
}

const SettingsPage = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    new_registration: true,
    event_reminder: true,
    email_confirmation: true,
    checkin_alert: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile?.company_id)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('company_id', profile?.company_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setNotifications({
          id: data.id,
          new_registration: data.new_registration,
          event_reminder: data.event_reminder,
          email_confirmation: data.email_confirmation,
          checkin_alert: data.checkin_alert,
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
      [field]: value,
    });
    console.log('Estado atualizado da empresa:', { ...company, [field]: value });
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications({
      ...notifications,
      [field]: value,
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
        description: company.description,
        phone: company.phone,
        address: company.address,
        logo_url: company.logo_url || null,
      };
      
      console.log('Dados para atualizar:', updateData);

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
        .select('*');

      console.log('Resposta completa:', { data, error });

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('Nenhum registro foi atualizado - verificando se o registro existe...');
        
        const { data: existingData, error: selectError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', company.id);
          
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
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar os dados da empresa.",
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
        new_registration: notifications.new_registration,
        event_reminder: notifications.event_reminder,
        email_confirmation: notifications.email_confirmation,
        checkin_alert: notifications.checkin_alert,
      };

      if (notifications.id) {
        const { error } = await supabase
          .from('notification_settings')
          .update(settingsData)
          .eq('id', notifications.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notification_settings')
          .insert([settingsData])
          .select()
          .single();
        
        if (error) throw error;
        setNotifications({ ...notifications, id: data.id });
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações de notificação.",
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
        description: "Por favor, selecione uma imagem.",
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
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          upsert: true
        });

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(data.path);

      // Atualizar estado local
      setCompany({
        ...company,
        logo_url: publicUrl
      });

      toast({
        title: "Logo enviado!",
        description: "Logo salvo com sucesso. Clique em 'Salvar Alterações' para confirmar.",
      });

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer upload do logotipo.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    if (company) {
      setCompany({
        ...company,
        logo_url: ''
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
                    <Input
                      id="company-name"
                      value={company?.name || ''}
                      onChange={(e) => handleCompanyChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input
                      id="company-phone"
                      value={company?.phone || ''}
                      onChange={(e) => handleCompanyChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-description">Descrição</Label>
                  <Textarea
                    id="company-description"
                    rows={3}
                    value={company?.description || ''}
                    onChange={(e) => handleCompanyChange('description', e.target.value)}
                  />
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="company-street">Rua</Label>
                     <Input
                       id="company-street"
                       placeholder="Nome da rua, número"
                       value={(() => {
                         const addressParts = (company?.address || '').split(', ');
                         return addressParts[0] || '';
                       })()}
                       onChange={(e) => {
                         const currentAddress = company?.address || '';
                         const parts = currentAddress.split(', ');
                         const newParts = [e.target.value.trim(), parts[1] || '', parts[2] || ''];
                         const filteredParts = newParts.filter((part, index) => {
                           if (index === 0) return part !== ''; // Rua pode estar vazia
                           return part.trim() !== '';
                         });
                         const newAddress = filteredParts.join(', ');
                         handleCompanyChange('address', newAddress);
                       }}
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="company-city">Cidade</Label>
                     <Input
                       id="company-city"
                       placeholder="Nome da cidade"
                       value={(() => {
                         const addressParts = (company?.address || '').split(', ');
                         return addressParts[1] || '';
                       })()}
                       onChange={(e) => {
                         const currentAddress = company?.address || '';
                         const parts = currentAddress.split(', ');
                         const newParts = [parts[0] || '', e.target.value.trim(), parts[2] || ''];
                         const filteredParts = newParts.filter((part, index) => {
                           if (index === 1) return part !== ''; // Cidade pode estar vazia
                           return part.trim() !== '';
                         });
                         const newAddress = filteredParts.join(', ');
                         handleCompanyChange('address', newAddress);
                       }}
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="company-state">Estado</Label>
                     <Input
                       id="company-state"
                       placeholder="UF"
                       maxLength={2}
                       value={(() => {
                         const addressParts = (company?.address || '').split(', ');
                         return addressParts[2] || '';
                       })()}
                       onChange={(e) => {
                         const currentAddress = company?.address || '';
                         const parts = currentAddress.split(', ');
                         const newParts = [parts[0] || '', parts[1] || '', e.target.value.trim().toUpperCase()];
                         const filteredParts = newParts.filter((part, index) => {
                           if (index === 2) return part !== ''; // Estado pode estar vazio
                           return part.trim() !== '';
                         });
                         const newAddress = filteredParts.join(', ');
                         handleCompanyChange('address', newAddress);
                       }}
                     />
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label>Logotipo da Empresa</Label>
                  <div className="space-y-3">
                    {company?.logo_url ? (
                      <div className="relative inline-block">
                        <img 
                          src={company.logo_url} 
                          alt="Logo da empresa" 
                          className="h-20 w-20 object-cover rounded-lg border shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploadingLogo}
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
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
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
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
                    <Label>CNPJ</Label>
                    <Input value={company?.cnpj || ''} disabled />
                    <p className="text-xs text-muted-foreground">
                      O CNPJ não pode ser alterado
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Slug da Empresa</Label>
                    <Input value={company?.slug || ''} disabled />
                    <p className="text-xs text-muted-foreground">
                      URL: convidy.com/{company?.slug}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Plano Atual</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{company?.plan || 'Free'}</Badge>
                      <Badge variant={company?.status === 'active' ? 'default' : 'destructive'}>
                        {company?.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button onClick={saveCompanyData} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
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
                  Gerencie como você quer ser notificado sobre eventos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Novas confirmações</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificação quando alguém confirmar presença
                      </p>
                    </div>
                    <Switch
                      checked={notifications.new_registration}
                      onCheckedChange={(checked) => handleNotificationChange('new_registration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Lembretes de evento</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber lembrete antes do evento começar
                      </p>
                    </div>
                    <Switch
                      checked={notifications.event_reminder}
                      onCheckedChange={(checked) => handleNotificationChange('event_reminder', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Confirmação por email</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar email de confirmação para participantes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_confirmation}
                      onCheckedChange={(checked) => handleNotificationChange('email_confirmation', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Alertas de check-in</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificação quando alguém fizer check-in
                      </p>
                    </div>
                    <Switch
                      checked={notifications.checkin_alert}
                      onCheckedChange={(checked) => handleNotificationChange('checkin_alert', checked)}
                    />
                  </div>
                </div>

                <Button onClick={saveNotificationSettings} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
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
                  Suas informações pessoais de acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={profile?.name || ''} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Badge variant="secondary">{profile?.role || 'Admin'}</Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Informações protegidas</p>
                    <p className="text-xs text-muted-foreground">
                      Para alterar essas informações, entre em contato com o suporte
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;