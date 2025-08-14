import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Users,
  LogOut,
  Building,
  Send,
  BarChart3,
  ExternalLink,
  Crown
} from 'lucide-react';
import { PlanStatusBanner } from '@/components/PlanStatusBanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, tourId: 'sidebar-dashboard' },
  { title: 'Eventos', url: '/events', icon: Calendar, tourId: 'sidebar-events' },
  { title: 'Convites', url: '/invites', icon: Send, tourId: 'sidebar-invites' },
  { title: 'Confirmações', url: '/confirmations', icon: Users, tourId: 'sidebar-confirmations' },
  { title: 'Check-in', url: '/checkin', icon: BarChart3, tourId: 'sidebar-checkin' },
  { title: 'Planos', url: '/plans', icon: Crown, tourId: 'sidebar-plans' },
  { title: 'Configurações', url: '/settings', icon: Settings, tourId: 'sidebar-settings' },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companySlug, setCompanySlug] = React.useState<string | null>(null);

  const isActive = (path: string) => currentPath === path;
  const collapsed = state === 'collapsed';

  // Buscar dados da empresa para o link público
  React.useEffect(() => {
    const fetchCompanySlug = async () => {
      if (!profile?.company_id) return;
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('slug')
          .eq('id', profile.company_id)
          .single();
        
        if (error) throw error;
        setCompanySlug(data?.slug || null);
      } catch (error) {
        console.error('Erro ao buscar slug da empresa:', error);
      }
    };

    fetchCompanySlug();
  }, [profile?.company_id]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado da plataforma.",
      });
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
                  Convidy
                </h2>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {profile?.name || user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      data-tour={item.tourId}
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plan Status - temporariamente desabilitado para estabilizar dashboard */}
        {/* !collapsed && (
          <div className="px-4 pb-4">
            <PlanStatusBanner />
          </div>
        ) */}

        {/* Footer */}
        <div className="mt-auto">
          {/* Link Público - Destacado */}
          {companySlug && (
            <div className="p-4 border-t bg-primary/5">
              <Button 
                variant="default" 
                size="sm"
                asChild
                className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <a 
                  href={`/${companySlug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {!collapsed && (
                    <span className="text-sm font-medium">Link Público</span>
                  )}
                </a>
              </Button>
              {!collapsed && (
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Para compartilhar com convidados
                </p>
              )}
            </div>
          )}
          
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          {/* Top Bar */}
          <header className="h-14 border-b bg-card flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
          </header>
          
          {/* Main Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;